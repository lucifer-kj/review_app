/**
 * Script to check user's current role in the database
 * Run with: node scripts/check-user-role.js
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
const supabaseServiceKey = envVars.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   VITE_SUPABASE_URL');
  console.error('   VITE_SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const USER_ID = 'edd7c8bc-f167-43b0-8ef0-53120b5cd444';

async function checkUserRole() {
  try {
    console.log('🔍 Checking user role in database...');
    console.log(`   User ID: ${USER_ID}\n`);

    // Check auth.users table
    console.log('📋 Checking auth.users table...');
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(USER_ID);
    
    if (authError) {
      console.error('❌ Error fetching user from auth:', authError.message);
      return;
    }

    if (!authUser.user) {
      console.error('❌ User not found in auth.users');
      return;
    }

    console.log('✅ User found in auth.users:');
    console.log(`   Email: ${authUser.user.email}`);
    console.log(`   Created: ${authUser.user.created_at}`);
    console.log(`   Email confirmed: ${authUser.user.email_confirmed_at ? 'Yes' : 'No'}`);
    console.log(`   Last sign in: ${authUser.user.last_sign_in_at || 'Never'}`);

    // Check profiles table
    console.log('\n📋 Checking profiles table...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', USER_ID)
      .single();

    if (profileError) {
      console.error('❌ Error fetching profile:', profileError.message);
      console.log('   This might be why the login is looping!');
      return;
    }

    if (!profile) {
      console.error('❌ No profile found for user');
      console.log('   This is likely why the login is looping!');
      return;
    }

    console.log('✅ Profile found:');
    console.log(`   Role: ${profile.role}`);
    console.log(`   Tenant ID: ${profile.tenant_id || 'NULL'}`);
    console.log(`   Created: ${profile.created_at}`);
    console.log(`   Updated: ${profile.updated_at}`);

    // Check if role allows access
    const hasAccess = profile.role === 'super_admin' || profile.role === 'tenant_admin' || profile.role === 'admin';
    console.log(`\n🎯 Access Check:`);
    console.log(`   Has Manager Access: ${hasAccess ? '✅' : '❌'}`);
    
    if (hasAccess) {
      console.log('   ✅ User should be able to access the master dashboard');
    } else {
      console.log('   ❌ User will be denied access and signed out');
      console.log('   💡 This explains the login loop!');
    }

    // Check all profiles to see what roles exist
    console.log('\n📊 All profiles in database:');
    const { data: allProfiles, error: allProfilesError } = await supabase
      .from('profiles')
      .select('id, role, created_at')
      .order('created_at', { ascending: false });

    if (allProfilesError) {
      console.error('❌ Error fetching all profiles:', allProfilesError.message);
    } else {
      console.log('✅ All profiles:');
      allProfiles.forEach(p => {
        const isTargetUser = p.id === USER_ID;
        console.log(`   ${isTargetUser ? '🎯' : '  '} ${p.id.substring(0, 8)}... - ${p.role} (${p.created_at})`);
      });
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

// Run the check
checkUserRole();
