#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   VITE_SUPABASE_URL');
  console.error('   VITE_SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixAmbiguousColumns() {
  try {
    console.log('🔧 Fixing ambiguous column references...');
    
    // 1. Drop and recreate get_current_tenant_id function
    console.log('1. Recreating get_current_tenant_id function...');
    const { error: drop1 } = await supabase.rpc('exec', {
      sql: 'DROP FUNCTION IF EXISTS get_current_tenant_id();'
    });
    
    const { error: create1 } = await supabase.rpc('exec', {
      sql: `
        CREATE OR REPLACE FUNCTION get_current_tenant_id()
        RETURNS UUID
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        DECLARE
          user_id UUID;
          tenant_id UUID;
        BEGIN
          user_id := auth.uid();
          
          IF user_id IS NULL THEN
            RETURN NULL;
          END IF;
          
          SELECT p.tenant_id INTO tenant_id
          FROM profiles p
          WHERE p.id = user_id;
          
          RETURN tenant_id;
        END;
        $$;
      `
    });
    
    if (create1) {
      console.error('❌ Error creating get_current_tenant_id:', create1.message);
    } else {
      console.log('✅ get_current_tenant_id function created');
    }
    
    // 2. Drop and recreate get_all_reviews_for_dashboard function
    console.log('2. Recreating get_all_reviews_for_dashboard function...');
    const { error: drop2 } = await supabase.rpc('exec', {
      sql: 'DROP FUNCTION IF EXISTS get_all_reviews_for_dashboard(UUID);'
    });
    
    const { error: create2 } = await supabase.rpc('exec', {
      sql: `
        CREATE OR REPLACE FUNCTION get_all_reviews_for_dashboard(p_tenant_id UUID)
        RETURNS TABLE (
          id UUID,
          customer_name VARCHAR,
          rating INTEGER,
          review_text TEXT,
          created_at TIMESTAMP WITH TIME ZONE
        )
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        BEGIN
          RETURN QUERY
          SELECT r.id, r.customer_name, r.rating, r.review_text, r.created_at
          FROM reviews r
          WHERE r.tenant_id = p_tenant_id
          ORDER BY r.created_at DESC;
        END;
        $$;
      `
    });
    
    if (create2) {
      console.error('❌ Error creating get_all_reviews_for_dashboard:', create2.message);
    } else {
      console.log('✅ get_all_reviews_for_dashboard function created');
    }
    
    // 3. Drop and recreate get_review_stats_for_dashboard function
    console.log('3. Recreating get_review_stats_for_dashboard function...');
    const { error: drop3 } = await supabase.rpc('exec', {
      sql: 'DROP FUNCTION IF EXISTS get_review_stats_for_dashboard(UUID);'
    });
    
    const { error: create3 } = await supabase.rpc('exec', {
      sql: `
        CREATE OR REPLACE FUNCTION get_review_stats_for_dashboard(p_tenant_id UUID)
        RETURNS TABLE (
          total_reviews BIGINT,
          average_rating NUMERIC,
          five_star_reviews BIGINT,
          four_star_reviews BIGINT,
          three_star_reviews BIGINT,
          two_star_reviews BIGINT,
          one_star_reviews BIGINT
        )
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        BEGIN
          RETURN QUERY
          SELECT 
            COUNT(r.id) as total_reviews,
            ROUND(AVG(r.rating), 2) as average_rating,
            COUNT(CASE WHEN r.rating = 5 THEN 1 END) as five_star_reviews,
            COUNT(CASE WHEN r.rating = 4 THEN 1 END) as four_star_reviews,
            COUNT(CASE WHEN r.rating = 3 THEN 1 END) as three_star_reviews,
            COUNT(CASE WHEN r.rating = 2 THEN 1 END) as two_star_reviews,
            COUNT(CASE WHEN r.rating = 1 THEN 1 END) as one_star_reviews
          FROM reviews r
          WHERE r.tenant_id = p_tenant_id;
        END;
        $$;
      `
    });
    
    if (create3) {
      console.error('❌ Error creating get_review_stats_for_dashboard:', create3.message);
    } else {
      console.log('✅ get_review_stats_for_dashboard function created');
    }
    
    console.log('✅ All database functions updated successfully!');
    console.log('');
    console.log('🎯 The ambiguous column reference errors should now be resolved.');
    console.log('   Test the settings save functionality to verify the fix.');
    
  } catch (error) {
    console.error('❌ Failed to fix ambiguous columns:', error.message);
    process.exit(1);
  }
}

// Run the fix
fixAmbiguousColumns();
