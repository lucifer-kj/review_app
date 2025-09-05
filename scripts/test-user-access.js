/**
 * Script to test user access and role verification
 * Run with: node scripts/test-user-access.js
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
const envPath = join(__dirname, '..', '.env');
let envVars = {};

try {
  const envContent = readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      envVars[key.trim()] = value.trim();
    }
  });
} catch (error) {
  console.log('No .env file found, using environment variables');
}

const supabaseUrl = envVars.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = envVars.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   VITE_SUPABASE_URL');
  console.error('   VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

// Create Supabase client with anon key
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const USER_ID = 'edd7c8bc-f167-43b0-8ef0-53120b5cd444';

async function testUserAccess() {
  try {
    console.log('🔍 Testing user access and role verification...');
    console.log(`   User ID: ${USER_ID}`);

    // Test profile access
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', USER_ID)
      .single();

    if (profileError) {
      console.error('❌ Error fetching profile:', profileError.message);
      console.error('   This might be due to RLS policies or missing profile');
      return;
    }

    if (!profile) {
      console.error('❌ No profile found for user');
      return;
    }

    console.log('✅ Profile found:');
    console.log(`   Role: ${profile.role}`);
    console.log(`   Tenant ID: ${profile.tenant_id || 'NULL'}`);
    console.log(`   Created: ${profile.created_at}`);
    console.log(`   Updated: ${profile.updated_at}`);

    // Test role-based access logic
    const isSuperAdmin = profile.role === 'super_admin';
    const isTenantAdmin = profile.role === 'tenant_admin';
    const isManager = isSuperAdmin || isTenantAdmin;

    console.log('\n📋 Role-based access:');
    console.log(`   Is Super Admin: ${isSuperAdmin ? '✅' : '❌'}`);
    console.log(`   Is Tenant Admin: ${isTenantAdmin ? '✅' : '❌'}`);
    console.log(`   Is Manager: ${isManager ? '✅' : '❌'}`);

    if (isManager) {
      console.log('\n🎉 User has manager access!');
      console.log('   They should be able to access the master dashboard.');
    } else {
      console.log('\n⚠️  User does not have manager access');
      console.log('   They will be denied access to the system.');
    }

    // Test database functions if they exist
    try {
      const { data: isAdminResult, error: isAdminError } = await supabase
        .rpc('is_admin', { user_id: USER_ID });

      if (!isAdminError) {
        console.log(`\n🔧 Database function test:`);
        console.log(`   is_admin(): ${isAdminResult ? '✅' : '❌'}`);
      }
    } catch (error) {
      console.log('\n🔧 Database functions not available or not accessible');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

// Run the test
testUserAccess();
