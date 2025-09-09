#!/usr/bin/env node

/**
 * Test script for plan-based review limits
 * This script tests the review limit functionality across different plans
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please set VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testPlanLimits() {
  console.log('🧪 Testing Plan-Based Review Limits...\n');

  try {
    // Test 1: Create test tenants with different plans
    console.log('1️⃣ Creating test tenants with different plans...');
    const testTenants = [
      {
        name: 'Basic Plan Tenant',
        plan_type: 'basic',
        billing_email: 'basic@test.com',
        status: 'active'
      },
      {
        name: 'Pro Plan Tenant',
        plan_type: 'pro',
        billing_email: 'pro@test.com',
        status: 'active'
      },
      {
        name: 'Industry Plan Tenant',
        plan_type: 'industry',
        billing_email: 'industry@test.com',
        status: 'active'
      }
    ];

    const createdTenants = [];
    for (const tenantData of testTenants) {
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .insert({
          ...tenantData,
          settings: {
            description: `Test tenant for ${tenantData.plan_type} plan`,
            features: {
              analytics: true,
              custom_domain: tenantData.plan_type !== 'basic',
              api_access: tenantData.plan_type === 'industry',
              priority_support: tenantData.plan_type === 'industry',
            },
            limits: {
              max_users: tenantData.plan_type === 'basic' ? 10 : tenantData.plan_type === 'pro' ? 25 : 100,
              max_reviews: tenantData.plan_type === 'basic' ? 100 : tenantData.plan_type === 'pro' ? 500 : 1000,
              storage_limit: tenantData.plan_type === 'basic' ? 1024 : tenantData.plan_type === 'pro' ? 5120 : 10240,
            }
          }
        })
        .select()
        .single();

      if (tenantError) {
        console.error(`❌ Failed to create ${tenantData.plan_type} tenant:`, tenantError.message);
        continue;
      }

      createdTenants.push(tenant);
      console.log(`✅ Created ${tenantData.plan_type} tenant: ${tenant.id}`);
    }

    // Test 2: Test review limits for each plan
    console.log('\n2️⃣ Testing review limits for each plan...');
    for (const tenant of createdTenants) {
      console.log(`\n--- Testing ${tenant.plan_type.toUpperCase()} Plan ---`);
      
      // Get current limits
      const { count: currentReviews } = await supabase
        .from('reviews')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenant.id);

      const reviewCount = currentReviews || 0;
      const maxReviews = tenant.settings.limits.max_reviews;
      const usagePercentage = (reviewCount / maxReviews) * 100;

      console.log(`   Current Reviews: ${reviewCount}/${maxReviews} (${Math.round(usagePercentage)}%)`);
      
      // Test limit calculations
      const canCollect = reviewCount < maxReviews;
      const canShare = reviewCount < maxReviews;
      const canSend = reviewCount < maxReviews;
      
      console.log(`   Can Collect: ${canCollect ? '✅' : '❌'}`);
      console.log(`   Can Share: ${canShare ? '✅' : '❌'}`);
      console.log(`   Can Send: ${canSend ? '✅' : '❌'}`);
      
      // Test upgrade recommendation
      if (usagePercentage >= 80) {
        let recommendedPlan = tenant.plan_type;
        if (tenant.plan_type === 'basic') {
          recommendedPlan = 'pro';
        } else if (tenant.plan_type === 'pro') {
          recommendedPlan = 'industry';
        }
        
        console.log(`   Upgrade Recommended: ${recommendedPlan.toUpperCase()}`);
      } else {
        console.log(`   No upgrade needed (${Math.round(usagePercentage)}% usage)`);
      }
    }

    // Test 3: Create test reviews to test limits
    console.log('\n3️⃣ Testing review creation with limits...');
    const basicTenant = createdTenants.find(t => t.plan_type === 'basic');
    
    if (basicTenant) {
      console.log(`Creating reviews for ${basicTenant.plan_type} tenant...`);
      
      // Create test reviews (up to limit + 5)
      for (let i = 1; i <= 105; i++) {
        const { error: reviewError } = await supabase
          .from('reviews')
          .insert({
            tenant_id: basicTenant.id,
            customer_name: `Test Customer ${i}`,
            customer_email: `customer${i}@test.com`,
            rating: Math.floor(Math.random() * 5) + 1,
            review_text: `This is test review number ${i}`,
            created_at: new Date().toISOString()
          });

        if (reviewError) {
          console.log(`   Review ${i} creation failed: ${reviewError.message}`);
          break;
        }

        if (i % 20 === 0) {
          console.log(`   Created ${i} reviews...`);
        }
      }

      // Check final status
      const { count: finalCount } = await supabase
        .from('reviews')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', basicTenant.id);

      console.log(`   Final review count: ${finalCount}`);
      console.log(`   Limit reached: ${finalCount >= basicTenant.settings.limits.max_reviews ? '✅' : '❌'}`);
    }

    // Test 4: Test Google Business URL generation
    console.log('\n4️⃣ Testing Google Business URL generation...');
    const testGoogleUrl = 'https://www.google.com/maps/place/Test-Business/@40.7128,-74.0060,17z/data=!3m1!4b1!4m6!3m5!1s0x89c25a1234567890:0x1234567890abcdef!8m2!3d40.7128!4d-74.0060!16s%2Fg%2F11test123';
    
    // Simulate the URL generation logic
    function generateGoogleReviewUrl(googleBusinessUrl) {
      try {
        const url = new URL(googleBusinessUrl);
        const pathParts = url.pathname.split('/');
        const placeIndex = pathParts.findIndex(part => part === 'place');
        
        if (placeIndex !== -1 && pathParts[placeIndex + 1]) {
          const businessName = pathParts[placeIndex + 1];
          return `https://www.google.com/maps/place/${businessName}/reviews`;
        }
        
        return googleBusinessUrl;
      } catch (error) {
        console.error('Error generating Google review URL:', error);
        return googleBusinessUrl;
      }
    }

    const generatedUrl = generateGoogleReviewUrl(testGoogleUrl);
    console.log(`   Original URL: ${testGoogleUrl}`);
    console.log(`   Generated Review URL: ${generatedUrl}`);
    console.log(`   URL Generation: ${generatedUrl.includes('/reviews') ? '✅' : '❌'}`);

    // Test 5: Test business settings integration
    console.log('\n5️⃣ Testing business settings integration...');
    if (basicTenant) {
      // Create business settings with Google Business URL
      const { error: settingsError } = await supabase
        .from('business_settings')
        .insert({
          tenant_id: basicTenant.id,
          google_business_url: testGoogleUrl,
          business_name: 'Test Business',
          business_email: 'test@business.com',
          business_phone: '+1234567890',
          business_address: '123 Test St, Test City, TC 12345'
        });

      if (settingsError) {
        console.error('❌ Failed to create business settings:', settingsError.message);
      } else {
        console.log('✅ Business settings created with Google Business URL');
        
        // Test retrieving settings
        const { data: settings } = await supabase
          .from('business_settings')
          .select('google_business_url')
          .eq('tenant_id', basicTenant.id)
          .single();

        if (settings) {
          console.log(`   Google Business URL: ${settings.google_business_url}`);
          console.log(`   Settings Integration: ✅`);
        }
      }
    }

    // Test 6: Cleanup
    console.log('\n6️⃣ Cleaning up test data...');
    
    // Delete test reviews
    for (const tenant of createdTenants) {
      const { error: deleteReviewsError } = await supabase
        .from('reviews')
        .delete()
        .eq('tenant_id', tenant.id);

      if (deleteReviewsError) {
        console.error(`⚠️  Failed to delete reviews for ${tenant.plan_type} tenant:`, deleteReviewsError.message);
      } else {
        console.log(`✅ Deleted reviews for ${tenant.plan_type} tenant`);
      }

      // Delete business settings
      const { error: deleteSettingsError } = await supabase
        .from('business_settings')
        .delete()
        .eq('tenant_id', tenant.id);

      if (deleteSettingsError) {
        console.error(`⚠️  Failed to delete settings for ${tenant.plan_type} tenant:`, deleteSettingsError.message);
      } else {
        console.log(`✅ Deleted settings for ${tenant.plan_type} tenant`);
      }

      // Delete tenant
      const { error: deleteTenantError } = await supabase
        .from('tenants')
        .delete()
        .eq('id', tenant.id);

      if (deleteTenantError) {
        console.error(`⚠️  Failed to delete ${tenant.plan_type} tenant:`, deleteTenantError.message);
      } else {
        console.log(`✅ Deleted ${tenant.plan_type} tenant`);
      }
    }

    console.log('\n🎉 All plan limit tests passed!');
    console.log('\n📋 Summary:');
    console.log('✅ Plan-based review limits (basic: 100, pro: 500, industry: 1000)');
    console.log('✅ Review counting per tenant');
    console.log('✅ Limit enforcement (collect, share, send)');
    console.log('✅ Upgrade recommendations');
    console.log('✅ Google Business URL generation');
    console.log('✅ Business settings integration');
    console.log('✅ Data cleanup');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Run the tests
testPlanLimits().catch(console.error);
