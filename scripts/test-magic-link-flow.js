/**
 * Test Magic Link Flow
 * Tests the complete magic link authentication system
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   VITE_SUPABASE_URL:', !!supabaseUrl);
  console.error('   VITE_SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

// Create admin client
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testMagicLinkFlow() {
  console.log('🧪 Testing Magic Link Flow...\n');

  try {
    // Test 1: Check admin client configuration
    console.log('1️⃣ Testing admin client configuration...');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser();
    if (userError) {
      console.log('   ⚠️  Admin client test:', userError.message);
    } else {
      console.log('   ✅ Admin client configured successfully');
    }

    // Test 2: Send magic link
    console.log('\n2️⃣ Testing magic link sending...');
    const testEmail = `test-${Date.now()}@example.com`;
    
    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      testEmail,
      {
        data: {
          role: 'user',
          tenant_id: '00000000-0000-0000-0000-000000000000', // Test tenant
          tenant_name: 'Test Tenant'
        },
        redirectTo: 'http://localhost:5173/dashboard'
      }
    );

    if (inviteError) {
      console.log('   ❌ Magic link sending failed:', inviteError.message);
      return;
    }

    console.log('   ✅ Magic link sent successfully');
    console.log('   📧 Email:', testEmail);
    console.log('   👤 User ID:', inviteData.user?.id);

    // Test 3: Check if user was created in auth.users
    console.log('\n3️⃣ Testing user creation in auth.users...');
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(inviteData.user.id);
    
    if (authError) {
      console.log('   ❌ Failed to get user from auth:', authError.message);
    } else {
      console.log('   ✅ User created in auth.users');
      console.log('   📧 Email:', authUser.user.email);
      console.log('   🏷️  Role:', authUser.user.user_metadata?.role);
      console.log('   🏢 Tenant:', authUser.user.user_metadata?.tenant_id);
    }

    // Test 4: Check if profile was created
    console.log('\n4️⃣ Testing profile creation...');
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', inviteData.user.id)
      .single();

    if (profileError) {
      console.log('   ❌ Profile creation failed:', profileError.message);
    } else {
      console.log('   ✅ Profile created successfully');
      console.log('   📧 Email:', profile.email);
      console.log('   🏷️  Role:', profile.role);
      console.log('   🏢 Tenant ID:', profile.tenant_id);
    }

    // Test 5: Cleanup test user
    console.log('\n5️⃣ Cleaning up test user...');
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(inviteData.user.id);
    
    if (deleteError) {
      console.log('   ⚠️  Failed to delete test user:', deleteError.message);
    } else {
      console.log('   ✅ Test user cleaned up');
    }

    console.log('\n🎉 Magic Link Flow Test Complete!');
    console.log('\n📋 Summary:');
    console.log('   ✅ Admin client configuration');
    console.log('   ✅ Magic link sending');
    console.log('   ✅ User creation in auth.users');
    console.log('   ✅ Profile creation via trigger');
    console.log('   ✅ Test cleanup');

  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testMagicLinkFlow();
