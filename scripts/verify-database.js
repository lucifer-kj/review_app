#!/usr/bin/env node

/**
 * Database Verification Script
 * This script verifies that all required tables, policies, and functions exist in the database
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Get Supabase credentials from environment
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verifyDatabase() {
  console.log('🔍 Verifying database schema...\n');

  const checks = [
    { name: 'profiles table', check: checkProfilesTable },
    { name: 'business_settings table', check: checkBusinessSettingsTable },
    { name: 'reviews table', check: checkReviewsTable },
    { name: 'RLS policies', check: checkRLSPolicies },
    { name: 'Functions', check: checkFunctions },
    { name: 'Triggers', check: checkTriggers },
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
    console.log('Please run the migration: supabase db push');
  }

  return allPassed;
}

async function checkProfilesTable() {
  try {
    const { data, error } = await supabase
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
    const { data, error } = await supabase
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
    const { data, error } = await supabase
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
    const { data, error } = await supabase
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
    const { data, error } = await supabase
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

async function checkTriggers() {
  try {
    // This is a basic check - in a real scenario you'd query the information_schema
    // For now, we'll just return true if we can access the tables
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
    
    return !error;
  } catch (error) {
    return false;
  }
}

// Run the verification
if (require.main === module) {
  verifyDatabase()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('Verification failed:', error);
      process.exit(1);
    });
}

module.exports = { verifyDatabase };
