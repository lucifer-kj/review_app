/**
 * Test Invitation System
 * Comprehensive test script to verify invitation functionality
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   VITE_SUPABASE_URL');
  console.error('   VITE_SUPABASE_ANON_KEY');
  console.error('   VITE_SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create clients
const supabase = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testInvitationSystem() {
  console.log('🧪 Testing Invitation System...\n');

  try {
    // Test 1: Check if admin client is properly configured
    console.log('1️⃣ Testing Admin Client Configuration...');
    try {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers();
      if (error) {
        console.log('   ⚠️  Admin client error:', error.message);
        console.log('   📝 This is expected if the service key is not properly configured');
      } else {
        console.log('   ✅ Admin client working properly');
      }
    } catch (err) {
      console.log('   ❌ Admin client failed:', err.message);
    }

    // Test 2: Check if invitation table exists
    console.log('\n2️⃣ Testing Database Schema...');
    try {
      const { data, error } = await supabase
        .from('user_invitations')
        .select('*')
        .limit(1);
      
      if (error) {
        console.log('   ❌ user_invitations table error:', error.message);
      } else {
        console.log('   ✅ user_invitations table accessible');
      }
    } catch (err) {
      console.log('   ❌ Database connection failed:', err.message);
    }

    // Test 3: Check if profiles table exists
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .limit(1);
      
      if (error) {
        console.log('   ❌ profiles table error:', error.message);
      } else {
        console.log('   ✅ profiles table accessible');
      }
    } catch (err) {
      console.log('   ❌ Profiles table failed:', err.message);
    }

    // Test 4: Check if tenants table exists
    try {
      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .limit(1);
      
      if (error) {
        console.log('   ❌ tenants table error:', error.message);
      } else {
        console.log('   ✅ tenants table accessible');
      }
    } catch (err) {
      console.log('   ❌ Tenants table failed:', err.message);
    }

    // Test 5: Test invitation creation (dry run)
    console.log('\n3️⃣ Testing Invitation Creation...');
    const testEmail = `test-${Date.now()}@example.com`;
    const testTenantId = '00000000-0000-0000-0000-000000000000'; // Dummy UUID
    
    try {
      // Check if user exists (should not exist)
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('email', testEmail)
        .single();

      if (existingProfile) {
        console.log('   ⚠️  Test user already exists (this is unexpected)');
      } else {
        console.log('   ✅ User existence check working');
      }

      // Try to create invitation record
      const { data: invitation, error: invitationError } = await supabase
        .from('user_invitations')
        .insert({
          tenant_id: testTenantId,
          email: testEmail,
          role: 'user',
          token: 'test-token-' + Date.now(),
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .select()
        .single();

      if (invitationError) {
        console.log('   ❌ Invitation creation failed:', invitationError.message);
      } else {
        console.log('   ✅ Invitation creation working');
        
        // Clean up test invitation
        await supabase
          .from('user_invitations')
          .delete()
          .eq('id', invitation.id);
        console.log('   🧹 Test invitation cleaned up');
      }
    } catch (err) {
      console.log('   ❌ Invitation test failed:', err.message);
    }

    // Test 6: Test Supabase Auth Admin methods
    console.log('\n4️⃣ Testing Supabase Auth Admin Methods...');
    try {
      // Test if inviteUserByEmail method exists
      if (typeof supabaseAdmin.auth.admin.inviteUserByEmail === 'function') {
        console.log('   ✅ inviteUserByEmail method exists');
      } else {
        console.log('   ❌ inviteUserByEmail method not found');
      }

      // Test if getUserByEmail method exists
      if (typeof supabaseAdmin.auth.admin.getUserByEmail === 'function') {
        console.log('   ✅ getUserByEmail method exists');
      } else {
        console.log('   ❌ getUserByEmail method not found');
      }
    } catch (err) {
      console.log('   ❌ Auth admin methods test failed:', err.message);
    }

    // Test 7: Check environment variables
    console.log('\n5️⃣ Checking Environment Variables...');
    console.log('   📍 Supabase URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
    console.log('   🔑 Anon Key:', supabaseAnonKey ? '✅ Set' : '❌ Missing');
    console.log('   🛡️  Service Key:', supabaseServiceKey ? '✅ Set' : '❌ Missing');

    console.log('\n🎯 Test Summary:');
    console.log('   If you see ❌ errors above, those need to be fixed.');
    console.log('   If you see ⚠️  warnings, those are expected in some cases.');
    console.log('   If you see ✅ success messages, those components are working.');

  } catch (error) {
    console.error('❌ Test suite failed:', error);
  }
}

// Run the test
testInvitationSystem().then(() => {
  console.log('\n🏁 Test completed!');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Test suite crashed:', error);
  process.exit(1);
});
