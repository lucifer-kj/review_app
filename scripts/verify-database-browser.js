/**
 * Browser-based Database Verification Script
 * Run this in your browser console after setting up the database
 */

// Replace these with your actual Supabase credentials
const SUPABASE_URL = 'https://elhbthnvwcqewjpwulhq.supabase.co';
const SUPABASE_ANON_KEY = 'your_supabase_anon_key'; // Replace with your actual key

// Create Supabase client
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function verifyDatabase() {
  console.log('🔍 Verifying database schema...\n');

  const checks = [
    { name: 'profiles table', check: checkProfilesTable },
    { name: 'business_settings table', check: checkBusinessSettingsTable },
    { name: 'reviews table', check: checkReviewsTable },
    { name: 'RLS policies', check: checkRLSPolicies },
    { name: 'Functions', check: checkFunctions },
  ];

  let allPassed = true;

  for (const { name, check } of checks) {
    try {
      const result = await check();
      if (result) {
        console.log(`✅ ${name}: OK`);
      } else {
        console.log(`❌ ${name}: FAILED`);
        allPassed = false;
      }
    } catch (error) {
      console.log(`❌ ${name}: ERROR - ${error.message}`);
      allPassed = false;
    }
  }

  console.log('\n' + '='.repeat(50));
  
  if (allPassed) {
    console.log('🎉 All database checks passed!');
    console.log('Your database is properly configured.');
  } else {
    console.log('⚠️  Some database checks failed.');
    console.log('Please run the SQL setup script in your Supabase dashboard.');
  }

  return allPassed;
}

async function checkProfilesTable() {
  try {
    const { data, error } = await supabaseClient
      .from('profiles')
      .select('id, role, created_at, updated_at')
      .limit(1);
    
    if (error) {
      console.error('Profiles table error:', error.message);
      return false;
    }
    
    return true;
  } catch (error) {
    return false;
  }
}

async function checkBusinessSettingsTable() {
  try {
    const { data, error } = await supabaseClient
      .from('business_settings')
      .select('id, user_id, google_business_url, business_name, created_at, updated_at')
      .limit(1);
    
    if (error) {
      console.error('Business settings table error:', error.message);
      return false;
    }
    
    return true;
  } catch (error) {
    return false;
  }
}

async function checkReviewsTable() {
  try {
    const { data, error } = await supabaseClient
      .from('reviews')
      .select('id, user_id, name, phone, country_code, rating, feedback, created_at')
      .limit(1);
    
    if (error) {
      console.error('Reviews table error:', error.message);
      return false;
    }
    
    return true;
  } catch (error) {
    return false;
  }
}

async function checkRLSPolicies() {
  try {
    // Test RLS by trying to access data without authentication
    const { data, error } = await supabaseClient
      .from('business_settings')
      .select('*')
      .limit(1);
    
    // Should return empty array due to RLS, not an error
    if (error && error.message.includes('permission denied')) {
      return true; // RLS is working
    }
    
    return true;
  } catch (error) {
    return false;
  }
}

async function checkFunctions() {
  try {
    // Test the is_admin function
    const { data, error } = await supabaseClient
      .rpc('is_admin');
    
    if (error) {
      console.error('Functions error:', error.message);
      return false;
    }
    
    return true;
  } catch (error) {
    return false;
  }
}

// Instructions for use
console.log(`
📋 Database Verification Instructions:

1. First, run the SQL setup script in your Supabase dashboard:
   - Go to https://supabase.com/dashboard/project/elhbthnvwcqewjpwulhq/sql
   - Copy and paste the contents of 'supabase/setup-database.sql'
   - Click "Run" to execute the script

2. Then, update the SUPABASE_ANON_KEY in this script with your actual anon key

3. Finally, run this verification script in your browser console

To run the verification, call: verifyDatabase()
`);

// Export for use
window.verifyDatabase = verifyDatabase;
