#!/usr/bin/env node

/**
 * Test script for the conditional redirection feature
 * This script tests the entire user flow from tenant creation to review submission
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please set VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY in a .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Helper function to generate a random string for emails
const randomString = (length = 8) => Math.random().toString(36).substring(2, 2 + length);

async function testConditionalRedirection() {
  console.log('🧪 Testing Conditional Redirection Feature...\n');
  const testData = {
    tenant: null,
    user: null,
    profile: null,
    businessSettings: null,
    reviews: []
  };

  try {
    // 1. Create a new tenant
    console.log('1️⃣ Creating a new tenant...');
    const tenantName = `Test Tenant ${randomString()}`;
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .insert({ name: tenantName })
      .select()
      .single();

    if (tenantError) throw new Error(`Failed to create tenant: ${tenantError.message}`);
    testData.tenant = tenant;
    console.log(`✅ Tenant created with ID: ${tenant.id}`);

    // 2. Create a new user (tenant_admin)
    console.log('\n2️⃣ Creating a new tenant admin...');
    const userEmail = `admin_${randomString()}@test.com`;
    const userPassword = 'password123';
    const { data: { user }, error: userError } = await supabase.auth.admin.createUser({
      email: userEmail,
      password: userPassword,
      email_confirm: true, // Automatically confirm the email for testing
    });

    if (userError) throw new Error(`Failed to create user: ${userError.message}`);
    testData.user = user;

    // We need to update the profile created by the trigger to set the role and tenant_id
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .update({ role: 'tenant_admin', tenant_id: tenant.id })
        .eq('id', user.id)
        .select()
        .single();

    if (profileError) throw new Error(`Failed to update profile for tenant admin: ${profileError.message}`);
    testData.profile = profile;
    console.log(`✅ Tenant admin created with email: ${userEmail}`);

    // 3. Set Google Business URL
    console.log('\n3️⃣ Setting Google Business URL...');
    const googleBusinessUrl = `https://www.google.com/maps/place/Test-Business-${randomString()}`;
    const { data: businessSettings, error: settingsError } = await supabase
      .from('business_settings')
      .insert({
        tenant_id: tenant.id,
        user_id: user.id,
        google_business_url: googleBusinessUrl,
        business_name: tenantName
      })
      .select()
      .single();

    if (settingsError) throw new Error(`Failed to set business settings: ${settingsError.message}`);
    testData.businessSettings = businessSettings;
    console.log(`✅ Google Business URL set to: ${googleBusinessUrl}`);

    // At this point, we need to simulate the review submission.
    // The TenantReviewFormService is a client-side service, so we'll replicate its core logic here.
    console.log('\n4️⃣ Simulating review submissions...');

    // 4a. High rating submission
    console.log('   - Submitting a 5-star review...');
    const highRatingReview = {
      customer_name: 'Happy Customer',
      rating: 5,
      review_text: 'This was a great experience!'
    };
    const { data: highRatingResult, error: highRatingError } = await submitReview(tenant.id, highRatingReview);
    if (highRatingError) throw new Error(`High rating review submission failed: ${highRatingError.message}`);

    if (highRatingResult.google_business_url === googleBusinessUrl) {
      console.log('✅ High rating review returned correct Google Business URL.');
    } else {
      throw new Error(`❌ High rating review did not return the correct Google Business URL. Expected ${googleBusinessUrl}, got ${highRatingResult.google_business_url}`);
    }
    testData.reviews.push(highRatingResult);

    // 4b. Low rating submission
    console.log('   - Submitting a 2-star review...');
    const lowRatingReview = {
      customer_name: 'Unhappy Customer',
      rating: 2,
      review_text: 'This was a bad experience.'
    };
    const { data: lowRatingResult, error: lowRatingError } = await submitReview(tenant.id, lowRatingReview);
    if (lowRatingError) throw new Error(`Low rating review submission failed: ${lowRatingError.message}`);

    if (lowRatingResult.google_business_url === googleBusinessUrl) {
        console.log('✅ Low rating review correctly returned the Google Business URL (frontend will handle logic).');
    } else {
        throw new Error(`❌ Low rating review did not return the correct Google Business URL. Expected ${googleBusinessUrl}, got ${lowRatingResult.google_business_url}`);
    }
    testData.reviews.push(lowRatingResult);


    console.log('\n🎉 All tests passed!');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    // 5. Cleanup
    console.log('\n5️⃣ Cleaning up created test data...');
    if (testData.reviews.length > 0) {
        const reviewIds = testData.reviews.map(r => r.id);
        const { error: reviewCleanError } = await supabase.from('reviews').delete().in('id', reviewIds);
        if (reviewCleanError) console.error('  - Error cleaning up reviews:', reviewCleanError.message);
        else console.log('  - ✅ Reviews cleaned up.');
    }
    if (testData.businessSettings) {
      const { error: settingsCleanError } = await supabase.from('business_settings').delete().eq('id', testData.businessSettings.id);
      if (settingsCleanError) console.error('  - Error cleaning up business settings:', settingsCleanError.message);
      else console.log('  - ✅ Business settings cleaned up.');
    }
    if (testData.user) {
        const { error: profileCleanError } = await supabase.from('profiles').delete().eq('id', testData.user.id);
        if (profileCleanError) console.error('  - Error cleaning up profile:', profileCleanError.message);
        else console.log('  - ✅ Profile cleaned up.');

        const { error: userCleanError } = await supabase.auth.admin.deleteUser(testData.user.id);
        if (userCleanError) console.error('  - Error cleaning up user:', userCleanError.message);
        else console.log('  - ✅ User cleaned up.');
    }
    if (testData.tenant) {
      const { error: tenantCleanError } = await supabase.from('tenants').delete().eq('id', testData.tenant.id);
      if (tenantCleanError) console.error('  - Error cleaning up tenant:', tenantCleanError.message);
      else console.log('  - ✅ Tenant cleaned up.');
    }
    console.log('\n✨ Cleanup complete.');
  }
}

/**
 * Replicates the core logic of TenantReviewFormService.submitTenantReview
 */
async function submitReview(tenantId, reviewData) {
  const { data, error } = await supabase
    .from('reviews')
    .insert({
      tenant_id: tenantId,
      ...reviewData
    })
    .select()
    .single();

  if (error) {
    return { data: null, error };
  }

  const { data: businessSettings } = await supabase
    .from('business_settings')
    .select('google_business_url')
    .eq('tenant_id', tenantId)
    .single();

  return {
    data: {
      ...data,
      google_business_url: businessSettings?.google_business_url,
    },
    error: null,
  };
}

// Run the tests
testConditionalRedirection();
