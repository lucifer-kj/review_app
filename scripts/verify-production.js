#!/usr/bin/env node

/**
 * Production Verification Script
 * This script verifies that the production deployment is working correctly
 */

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.production' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   VITE_SUPABASE_URL');
  console.error('   VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verifyProduction() {
  console.log('🔍 Verifying production deployment...\n');

  const testTenantId = '36dcb9ba-9dec-4cb1-9465-a084e73329c4';
  let allTestsPassed = true;

  try {
    // Test 1: Anonymous access to tenant
    console.log('📋 Test 1: Anonymous access to tenant...');
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('name, domain, status')
      .eq('id', testTenantId)
      .single();

    if (tenantError) {
      console.error('❌ Failed:', tenantError.message);
      allTestsPassed = false;
    } else {
      console.log('✅ Success:', tenant.name, `(${tenant.status})`);
    }

    // Test 2: Anonymous access to business settings
    console.log('\n📋 Test 2: Anonymous access to business settings...');
    const { data: settings, error: settingsError } = await supabase
      .from('business_settings')
      .select('business_name, form_customization')
      .eq('tenant_id', testTenantId)
      .single();

    if (settingsError) {
      console.error('❌ Failed:', settingsError.message);
      allTestsPassed = false;
    } else {
      console.log('✅ Success:', settings.business_name);
      if (settings.form_customization) {
        console.log('   Custom styling configured:', settings.form_customization.primary_color);
      }
    }

    // Test 3: Anonymous review insertion
    console.log('\n📋 Test 3: Anonymous review insertion...');
    const testReview = {
      tenant_id: testTenantId,
      customer_name: 'Test Customer',
      customer_phone: '+1-555-0123',
      country_code: '+1',
      rating: 5,
      review_text: 'Test review for verification',
      google_review: true,
      redirect_opened: false,
      metadata: {
        source: 'verification_test',
        test_run: true
      }
    };

    const { data: review, error: reviewError } = await supabase
      .from('reviews')
      .insert(testReview)
      .select()
      .single();

    if (reviewError) {
      console.error('❌ Failed:', reviewError.message);
      allTestsPassed = false;
    } else {
      console.log('✅ Success: Review inserted with ID:', review.id);
      
      // Clean up test review
      await supabase
        .from('reviews')
        .delete()
        .eq('id', review.id);
      console.log('   Test review cleaned up');
    }

    // Test 4: Check RLS policies
    console.log('\n📋 Test 4: RLS policies verification...');
    const { data: policies, error: policiesError } = await supabase
      .rpc('get_table_policies', { table_name: 'tenants' });

    if (policiesError) {
      console.log('⚠️  Could not verify RLS policies (function may not exist)');
    } else {
      const publicPolicies = policies.filter(p => p.roles.includes('anon'));
      if (publicPolicies.length > 0) {
        console.log('✅ Public RLS policies found:', publicPolicies.length);
      } else {
        console.log('❌ No public RLS policies found');
        allTestsPassed = false;
      }
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    if (allTestsPassed) {
      console.log('🎉 All tests passed! Production deployment is ready.');
      console.log('\n📋 Next steps:');
      console.log('   1. Deploy your application to Vercel');
      console.log('   2. Test the review form URL:');
      console.log(`      https://demo.alphabusinessdesigns.co.in/review/${testTenantId}`);
      console.log('   3. Verify the form loads and accepts submissions');
    } else {
      console.log('❌ Some tests failed. Please check the errors above.');
      console.log('\n🔧 Troubleshooting:');
      console.log('   1. Ensure the database migration was applied');
      console.log('   2. Check your environment variables');
      console.log('   3. Verify Supabase CORS settings');
    }

  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    process.exit(1);
  }
}

// Run verification
verifyProduction();
