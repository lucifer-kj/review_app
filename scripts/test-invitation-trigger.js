/**
 * Test script to verify the updated handle_new_user() trigger works correctly
 * This script tests both invitation-based and direct signup scenarios
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

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testInvitationTrigger() {
  console.log('🧪 Testing invitation-based user creation trigger...\n');

  try {
    // Step 1: Create a test tenant
    console.log('1️⃣ Creating test tenant...');
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .insert({
        name: 'Test Tenant for Trigger',
        domain: 'test-trigger.example.com',
        status: 'active'
      })
      .select()
      .single();

    if (tenantError) {
      console.error('❌ Failed to create tenant:', tenantError);
      return;
    }
    console.log('✅ Test tenant created:', tenant.id);

    // Step 2: Create a test invitation
    console.log('\n2️⃣ Creating test invitation...');
    const testEmail = `test-trigger-${Date.now()}@example.com`;
    const { data: invitation, error: invitationError } = await supabase
      .from('user_invitations')
      .insert({
        tenant_id: tenant.id,
        email: testEmail,
        role: 'tenant_admin',
        token: crypto.randomUUID(),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      })
      .select()
      .single();

    if (invitationError) {
      console.error('❌ Failed to create invitation:', invitationError);
      return;
    }
    console.log('✅ Test invitation created:', invitation.id);

    // Step 3: Create a user via Supabase Auth (this should trigger our function)
    console.log('\n3️⃣ Creating user via Supabase Auth...');
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: 'testpassword123',
      email_confirm: true,
      user_metadata: {
        full_name: 'Test User',
        tenant_id: tenant.id,
        role: 'tenant_admin'
      }
    });

    if (authError) {
      console.error('❌ Failed to create user:', authError);
      return;
    }
    console.log('✅ User created via Auth:', authData.user.id);

    // Step 4: Check if profile was created correctly
    console.log('\n4️⃣ Checking profile creation...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError) {
      console.error('❌ Failed to fetch profile:', profileError);
      return;
    }

    // Verify profile data
    console.log('📋 Profile data:');
    console.log('   ID:', profile.id);
    console.log('   Email:', profile.email);
    console.log('   Full Name:', profile.full_name);
    console.log('   Role:', profile.role);
    console.log('   Tenant ID:', profile.tenant_id);

    // Check if profile matches invitation data
    const isCorrect = 
      profile.email === testEmail &&
      profile.full_name === 'Test User' &&
      profile.role === 'tenant_admin' &&
      profile.tenant_id === tenant.id;

    if (isCorrect) {
      console.log('✅ Profile created correctly with invitation data!');
    } else {
      console.log('❌ Profile data does not match invitation:');
      console.log('   Expected email:', testEmail, 'Got:', profile.email);
      console.log('   Expected role: tenant_admin', 'Got:', profile.role);
      console.log('   Expected tenant_id:', tenant.id, 'Got:', profile.tenant_id);
    }

    // Step 5: Test direct signup (no invitation)
    console.log('\n5️⃣ Testing direct signup (no invitation)...');
    const directEmail = `direct-signup-${Date.now()}@example.com`;
    const { data: directAuthData, error: directAuthError } = await supabase.auth.admin.createUser({
      email: directEmail,
      password: 'testpassword123',
      email_confirm: true,
      user_metadata: {
        full_name: 'Direct Signup User'
      }
    });

    if (directAuthError) {
      console.error('❌ Failed to create direct user:', directAuthError);
      return;
    }

    const { data: directProfile, error: directProfileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', directAuthData.user.id)
      .single();

    if (directProfileError) {
      console.error('❌ Failed to fetch direct profile:', directProfileError);
      return;
    }

    console.log('📋 Direct signup profile:');
    console.log('   Email:', directProfile.email);
    console.log('   Role:', directProfile.role);
    console.log('   Tenant ID:', directProfile.tenant_id);

    const isDirectCorrect = 
      directProfile.email === directEmail &&
      directProfile.role === 'user' &&
      directProfile.tenant_id === null;

    if (isDirectCorrect) {
      console.log('✅ Direct signup profile created correctly!');
    } else {
      console.log('❌ Direct signup profile data incorrect');
    }

    // Step 6: Cleanup
    console.log('\n6️⃣ Cleaning up test data...');
    
    // Delete profiles
    await supabase.from('profiles').delete().eq('id', authData.user.id);
    await supabase.from('profiles').delete().eq('id', directAuthData.user.id);
    
    // Delete users
    await supabase.auth.admin.deleteUser(authData.user.id);
    await supabase.auth.admin.deleteUser(directAuthData.user.id);
    
    // Delete invitation
    await supabase.from('user_invitations').delete().eq('id', invitation.id);
    
    // Delete tenant
    await supabase.from('tenants').delete().eq('id', tenant.id);
    
    console.log('✅ Cleanup completed');

    // Final result
    console.log('\n🎉 Test Results:');
    console.log('   Invitation-based signup:', isCorrect ? '✅ PASS' : '❌ FAIL');
    console.log('   Direct signup:', isDirectCorrect ? '✅ PASS' : '❌ FAIL');
    
    if (isCorrect && isDirectCorrect) {
      console.log('\n🎊 All tests passed! The trigger is working correctly.');
    } else {
      console.log('\n⚠️ Some tests failed. Check the trigger implementation.');
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
testInvitationTrigger();
