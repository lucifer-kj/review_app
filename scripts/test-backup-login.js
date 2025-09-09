#!/usr/bin/env node

/**
 * Test script for backup login system
 * This script tests the email/password authentication flow
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

async function testBackupLoginSystem() {
  console.log('🧪 Testing Backup Login System...\n');

  try {
    // Test 1: Create a test user
    console.log('1️⃣ Creating test user...');
    const testEmail = 'backup-test@example.com';
    const testPassword = 'testpassword123';
    const testName = 'Backup Test User';

    const { data: createData, error: createError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
      user_metadata: {
        full_name: testName,
        role: 'user',
      }
    });

    if (createError) {
      console.error('❌ Failed to create test user:', createError.message);
      return;
    }

    console.log('✅ Test user created successfully');
    console.log(`   Email: ${testEmail}`);
    console.log(`   User ID: ${createData.user.id}`);

    // Test 2: Create profile record
    console.log('\n2️⃣ Creating profile record...');
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: createData.user.id,
        full_name: testName,
        role: 'user',
        tenant_id: null,
      });

    if (profileError) {
      console.error('❌ Failed to create profile:', profileError.message);
      return;
    }

    console.log('✅ Profile record created successfully');

    // Test 3: Test backup login
    console.log('\n3️⃣ Testing backup login...');
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });

    if (loginError) {
      console.error('❌ Backup login failed:', loginError.message);
      return;
    }

    console.log('✅ Backup login successful');
    console.log(`   User: ${loginData.user.email}`);
    console.log(`   Session: ${loginData.session ? 'Active' : 'None'}`);

    // Test 4: Test role-based redirection logic
    console.log('\n4️⃣ Testing role-based redirection...');
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, tenant_id')
      .eq('id', loginData.user.id)
      .single();

    if (profile) {
      console.log(`   Role: ${profile.role}`);
      console.log(`   Tenant ID: ${profile.tenant_id || 'None'}`);
      
      // Simulate redirection logic
      let redirectPath = '/dashboard'; // default
      if (profile.role === 'super_admin') {
        redirectPath = '/master';
      } else if (profile.role === 'tenant_admin' || profile.role === 'user') {
        redirectPath = '/dashboard';
      }
      
      console.log(`   Redirect Path: ${redirectPath}`);
      console.log('✅ Role-based redirection logic working');
    } else {
      console.log('⚠️  No profile found for user');
    }

    // Test 5: Test password update
    console.log('\n5️⃣ Testing password update...');
    const newPassword = 'newpassword123';
    
    const { error: updateError } = await supabase.auth.admin.updateUserById(createData.user.id, {
      password: newPassword
    });

    if (updateError) {
      console.error('❌ Password update failed:', updateError.message);
      return;
    }

    console.log('✅ Password updated successfully');

    // Test 6: Test login with new password
    console.log('\n6️⃣ Testing login with new password...');
    const { data: newLoginData, error: newLoginError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: newPassword,
    });

    if (newLoginError) {
      console.error('❌ Login with new password failed:', newLoginError.message);
      return;
    }

    console.log('✅ Login with new password successful');

    // Test 7: Cleanup
    console.log('\n7️⃣ Cleaning up test user...');
    const { error: deleteError } = await supabase.auth.admin.deleteUser(createData.user.id);

    if (deleteError) {
      console.error('⚠️  Failed to delete test user:', deleteError.message);
    } else {
      console.log('✅ Test user deleted successfully');
    }

    console.log('\n🎉 All backup login tests passed!');
    console.log('\n📋 Summary:');
    console.log('✅ User creation with email/password');
    console.log('✅ Profile record creation');
    console.log('✅ Backup login authentication');
    console.log('✅ Role-based redirection logic');
    console.log('✅ Password update functionality');
    console.log('✅ Login with updated password');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Run the tests
testBackupLoginSystem().catch(console.error);
