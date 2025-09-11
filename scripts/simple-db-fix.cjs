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

async function testCurrentTenantFunction() {
  try {
    console.log('🔧 Testing get_current_tenant_id function...');
    
    // Test the function
    const { data, error } = await supabase.rpc('get_current_tenant_id');
    
    if (error) {
      console.error('❌ Error testing get_current_tenant_id:', error.message);
      
      // If the function doesn't exist or has issues, let's create a simple version
      console.log('🔧 Creating a simple get_current_tenant_id function...');
      
      // We'll need to create this function through the Supabase dashboard
      // or use a different approach
      console.log('📝 Manual fix required:');
      console.log('   1. Go to your Supabase dashboard');
      console.log('   2. Navigate to SQL Editor');
      console.log('   3. Run this SQL:');
      console.log(`
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
      `);
      
    } else {
      console.log('✅ get_current_tenant_id function is working:', data);
    }
    
    // Test business settings query
    console.log('🔧 Testing business settings query...');
    const { data: settingsData, error: settingsError } = await supabase
      .from('business_settings')
      .select('*')
      .limit(1);
    
    if (settingsError) {
      console.error('❌ Error querying business_settings:', settingsError.message);
    } else {
      console.log('✅ business_settings query successful');
    }
    
  } catch (error) {
    console.error('❌ Failed to test database functions:', error.message);
  }
}

// Run the test
testCurrentTenantFunction();
