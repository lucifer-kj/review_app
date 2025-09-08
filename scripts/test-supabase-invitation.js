/**
 * Test script for Supabase invitation system
 * Run with: node scripts/test-supabase-invitation.js
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
  console.log('No .env file found, using process.env');
  envVars = process.env;
}

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseServiceKey = envVars.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:');
  console.error('- VITE_SUPABASE_URL');
  console.error('- VITE_SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testInvitationFlow() {
  console.log('🧪 Testing Supabase Invitation Flow...\n');

  try {
    // Test 1: Send invitation email
    console.log('1️⃣ Testing invitation email sending...');
    const testEmail = 'test@example.com';
    const tenantName = 'Test Tenant';
    const tenantId = 'test-tenant-id';

    const { error } = await supabase.auth.admin.inviteUserByEmail(testEmail, {
      data: {
        tenant_name: tenantName,
        tenant_id: tenantId,
        role: 'tenant_admin',
      },
      redirectTo: 'http://localhost:3000/accept-invitation',
    });

    if (error) {
      console.error('❌ Failed to send invitation:', error.message);
      return;
    }

    console.log('✅ Invitation email sent successfully!');
    console.log(`   Email: ${testEmail}`);
    console.log(`   Redirect URL: http://localhost:3000/accept-invitation`);
    console.log(`   Tenant: ${tenantName}`);

    // Test 2: Check if user was created in auth.users
    console.log('\n2️⃣ Checking if user was created in auth.users...');
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.error('❌ Failed to list users:', usersError.message);
      return;
    }

    const invitedUser = users.users.find(user => user.email === testEmail);
    if (invitedUser) {
      console.log('✅ User created in auth.users:');
      console.log(`   ID: ${invitedUser.id}`);
      console.log(`   Email: ${invitedUser.email}`);
      console.log(`   Confirmed: ${invitedUser.email_confirmed_at ? 'Yes' : 'No'}`);
      console.log(`   User Metadata:`, invitedUser.user_metadata);
    } else {
      console.log('⚠️  User not found in auth.users (this is normal for invitations)');
    }

    // Test 3: Check invitation record
    console.log('\n3️⃣ Checking invitation record...');
    const { data: invitations, error: invitationsError } = await supabase
      .from('user_invitations')
      .select('*')
      .eq('email', testEmail);

    if (invitationsError) {
      console.error('❌ Failed to check invitations:', invitationsError.message);
      return;
    }

    if (invitations && invitations.length > 0) {
      console.log('✅ Invitation record found:');
      console.log(`   ID: ${invitations[0].id}`);
      console.log(`   Email: ${invitations[0].email}`);
      console.log(`   Role: ${invitations[0].role}`);
      console.log(`   Expires: ${invitations[0].expires_at}`);
    } else {
      console.log('⚠️  No invitation record found (this is normal if using Supabase only)');
    }

    console.log('\n🎉 Test completed successfully!');
    console.log('\n📋 Next Steps:');
    console.log('1. Check your email for the invitation');
    console.log('2. Click the link in the email');
    console.log('3. You should be redirected to: http://localhost:3000/accept-invitation');
    console.log('4. Create your password and complete the signup');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testInvitationFlow();
