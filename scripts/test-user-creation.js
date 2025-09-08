/**
 * Test User Creation Script
 * This script tests the user creation process to identify trigger issues
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
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

async function testUserCreation() {
  console.log('🧪 Testing User Creation Process...\n');

  try {
    // Test 1: Check if handle_new_user function exists
    console.log('1️⃣ Checking handle_new_user function...');
    try {
      const { data, error } = await supabaseAdmin.rpc('handle_new_user', {});
      if (error) {
        console.log('   ⚠️  Function exists but has issues:', error.message);
      } else {
        console.log('   ✅ Function exists and is callable');
      }
    } catch (err) {
      console.log('   ❌ Function check failed:', err.message);
    }

    // Test 2: Check if trigger exists
    console.log('\n2️⃣ Checking trigger existence...');
    try {
      const { data: triggers, error } = await supabaseAdmin
        .from('pg_trigger')
        .select('*')
        .eq('tgname', 'on_auth_user_created');

      if (error) {
        console.log('   ⚠️  Could not check triggers:', error.message);
      } else if (triggers && triggers.length > 0) {
        console.log('   ✅ Trigger exists');
        triggers.forEach(trigger => {
          console.log(`      - Name: ${trigger.tgname}`);
          console.log(`      - Table: ${trigger.tgrelid}`);
          console.log(`      - Function: ${trigger.tgfoid}`);
        });
      } else {
        console.log('   ❌ Trigger not found');
      }
    } catch (err) {
      console.log('   ⚠️  Trigger check failed:', err.message);
    }

    // Test 3: Check profiles table structure
    console.log('\n3️⃣ Checking profiles table structure...');
    try {
      const { data: columns, error } = await supabaseAdmin
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable')
        .eq('table_name', 'profiles')
        .eq('table_schema', 'public');

      if (error) {
        console.log('   ❌ Could not check table structure:', error.message);
      } else {
        console.log('   ✅ Profiles table structure:');
        columns.forEach(col => {
          console.log(`      - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
        });
      }
    } catch (err) {
      console.log('   ❌ Table structure check failed:', err.message);
    }

    // Test 4: Check user_invitations table
    console.log('\n4️⃣ Checking user_invitations table...');
    try {
      const { data: invitations, error } = await supabaseAdmin
        .from('user_invitations')
        .select('*')
        .limit(1);

      if (error) {
        console.log('   ❌ user_invitations table error:', error.message);
      } else {
        console.log('   ✅ user_invitations table accessible');
      }
    } catch (err) {
      console.log('   ❌ user_invitations check failed:', err.message);
    }

    // Test 5: Test invitation creation
    console.log('\n5️⃣ Testing invitation creation...');
    const testEmail = `test-user-${Date.now()}@example.com`;
    
    try {
      // Get a tenant to use
      const { data: tenants } = await supabaseAdmin
        .from('tenants')
        .select('id, name')
        .limit(1)
        .single();

      if (!tenants) {
        console.log('   ❌ No tenants available for testing');
        return;
      }

      // Create test invitation
      const { data: invitation, error: invitationError } = await supabaseAdmin
        .from('user_invitations')
        .insert({
          tenant_id: tenants.id,
          email: testEmail,
          role: 'user',
          invited_by: null,
          token: 'test-token-' + Date.now(),
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .select()
        .single();

      if (invitationError) {
        console.log('   ❌ Invitation creation failed:', invitationError.message);
      } else {
        console.log('   ✅ Test invitation created');
        
        // Test 6: Try to create user via Supabase Auth Admin
        console.log('\n6️⃣ Testing user creation via Supabase Auth...');
        try {
          const { data: user, error: userError } = await supabaseAdmin.auth.admin.createUser({
            email: testEmail,
            password: 'TestPassword123!',
            email_confirm: true
          });

          if (userError) {
            console.log('   ❌ User creation failed:', userError.message);
            console.log('   📝 Error details:', userError);
          } else {
            console.log('   ✅ User created successfully');
            console.log('   📝 User ID:', user.user?.id);
            
            // Check if profile was created
            const { data: profile, error: profileError } = await supabaseAdmin
              .from('profiles')
              .select('*')
              .eq('id', user.user?.id)
              .single();

            if (profileError) {
              console.log('   ❌ Profile creation failed:', profileError.message);
            } else {
              console.log('   ✅ Profile created successfully');
              console.log('   📝 Profile details:', {
                id: profile.id,
                email: profile.email,
                role: profile.role,
                tenant_id: profile.tenant_id
              });
            }

            // Clean up test user
            await supabaseAdmin.auth.admin.deleteUser(user.user?.id);
            console.log('   🧹 Test user cleaned up');
          }
        } catch (userErr) {
          console.log('   ❌ User creation test failed:', userErr.message);
        }

        // Clean up test invitation
        await supabaseAdmin
          .from('user_invitations')
          .delete()
          .eq('id', invitation.id);
        console.log('   🧹 Test invitation cleaned up');
      }
    } catch (err) {
      console.log('   ❌ Invitation test failed:', err.message);
    }

    console.log('\n🎯 Test Summary:');
    console.log('   If you see ❌ errors above, those need to be fixed.');
    console.log('   The most common issue is the handle_new_user trigger failing.');
    console.log('   Apply the migration: 20250110000003_fix_user_creation_trigger.sql');

  } catch (error) {
    console.error('❌ Test suite failed:', error);
  }
}

// Run the test
testUserCreation().then(() => {
  console.log('\n🏁 Test completed!');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Test suite crashed:', error);
  process.exit(1);
});
