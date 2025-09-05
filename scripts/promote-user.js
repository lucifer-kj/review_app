/**
 * Script to promote user to super_admin
 * Run with: node scripts/promote-user.js
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
  console.error('\nPlease set these in your .env file or environment variables.');
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const USER_ID = 'edd7c8bc-f167-43b0-8ef0-53120b5cd444';

async function promoteUser() {
  try {
    console.log('🚀 Promoting user to super_admin...');
    console.log(`   User ID: ${USER_ID}`);

    // First, check if user exists in auth.users
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

    // Update or insert profile with super_admin role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: USER_ID,
        role: 'super_admin',
        tenant_id: null,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id'
      })
      .select()
      .single();

    if (profileError) {
      console.error('❌ Error updating profile:', profileError.message);
      return;
    }

    console.log('✅ User profile updated successfully:');
    console.log(`   Role: ${profile.role}`);
    console.log(`   Tenant ID: ${profile.tenant_id || 'NULL (super_admin)'}`);
    console.log(`   Updated: ${profile.updated_at}`);

    // Verify the promotion worked
    const { data: verifyProfile, error: verifyError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', USER_ID)
      .single();

    if (verifyError) {
      console.error('❌ Error verifying profile:', verifyError.message);
      return;
    }

    console.log('\n🎉 User successfully promoted to super_admin!');
    console.log('   The user should now be able to access the master dashboard.');
    console.log('\n📋 Final profile:');
    console.log(JSON.stringify(verifyProfile, null, 2));

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

// Run the promotion
promoteUser();
