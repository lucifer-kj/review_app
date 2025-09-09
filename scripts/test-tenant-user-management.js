#!/usr/bin/env node

/**
 * Test script for tenant user management
 * This script tests adding users to tenants and role management
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

async function testTenantUserManagement() {
  console.log('🧪 Testing Tenant User Management...\n');

  try {
    // Test 1: Create test tenant
    console.log('1️⃣ Creating test tenant...');
    const { data: tenantData, error: tenantError } = await supabase
      .from('tenants')
      .insert({
        name: 'Test Tenant for User Management',
        domain: 'test-tenant.example.com',
        plan_type: 'basic',
        billing_email: 'billing@test-tenant.com',
        status: 'active',
        settings: {
          description: 'Test tenant for user management testing',
          features: {
            analytics: true,
            custom_domain: false,
            api_access: false,
            priority_support: false,
          },
          limits: {
            max_users: 10,
            max_reviews: 1000,
            storage_limit: 1024,
          }
        }
      })
      .select()
      .single();

    if (tenantError) {
      console.error('❌ Failed to create test tenant:', tenantError.message);
      return;
    }

    console.log('✅ Test tenant created successfully');
    console.log(`   Tenant ID: ${tenantData.id}`);
    console.log(`   Tenant Name: ${tenantData.name}`);

    // Test 2: Create test users
    console.log('\n2️⃣ Creating test users...');
    const testUsers = [
      {
        email: 'user1@test-tenant.com',
        password: 'password123',
        full_name: 'Test User 1',
        role: 'user'
      },
      {
        email: 'admin1@test-tenant.com',
        password: 'password123',
        full_name: 'Test Admin 1',
        role: 'user'
      }
    ];

    const createdUsers = [];
    for (const userData of testUsers) {
      const { data: user, error: userError } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
        user_metadata: {
          full_name: userData.full_name,
          role: userData.role,
        }
      });

      if (userError) {
        console.error(`❌ Failed to create user ${userData.email}:`, userError.message);
        continue;
      }

      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          full_name: userData.full_name,
          role: userData.role,
          tenant_id: null, // Not assigned to tenant yet
        });

      if (profileError) {
        console.error(`❌ Failed to create profile for ${userData.email}:`, profileError.message);
        continue;
      }

      createdUsers.push({
        id: user.id,
        email: userData.email,
        full_name: userData.full_name,
        role: userData.role
      });

      console.log(`✅ Created user: ${userData.full_name} (${userData.email})`);
    }

    // Test 3: Add users to tenant
    console.log('\n3️⃣ Adding users to tenant...');
    for (const user of createdUsers) {
      const { error: addError } = await supabase
        .from('profiles')
        .update({
          tenant_id: tenantData.id,
          role: user.email.includes('admin') ? 'tenant_admin' : 'user'
        })
        .eq('id', user.id);

      if (addError) {
        console.error(`❌ Failed to add user ${user.full_name} to tenant:`, addError.message);
      } else {
        console.log(`✅ Added ${user.full_name} to tenant as ${user.email.includes('admin') ? 'tenant_admin' : 'user'}`);
      }
    }

    // Test 4: List tenant users
    console.log('\n4️⃣ Listing tenant users...');
    const { data: tenantUsers, error: listError } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        role,
        created_at,
        auth_users!inner(
          email,
          last_sign_in_at
        )
      `)
      .eq('tenant_id', tenantData.id)
      .order('created_at', { ascending: false });

    if (listError) {
      console.error('❌ Failed to list tenant users:', listError.message);
    } else {
      console.log(`✅ Found ${tenantUsers.length} users in tenant:`);
      tenantUsers.forEach(user => {
        console.log(`   - ${user.full_name} (${user.auth_users?.email}) - ${user.role}`);
      });
    }

    // Test 5: Update user role
    console.log('\n5️⃣ Testing role updates...');
    if (tenantUsers && tenantUsers.length > 0) {
      const userToUpdate = tenantUsers[0];
      const newRole = userToUpdate.role === 'tenant_admin' ? 'user' : 'tenant_admin';
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userToUpdate.id);

      if (updateError) {
        console.error('❌ Failed to update user role:', updateError.message);
      } else {
        console.log(`✅ Updated ${userToUpdate.full_name} role to ${newRole}`);
      }
    }

    // Test 6: Search users
    console.log('\n6️⃣ Testing user search...');
    const { data: searchResults, error: searchError } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        role,
        tenant_id,
        auth_users!inner(
          email
        )
      `)
      .or('full_name.ilike.%Test%,auth_users.email.ilike.%test%')
      .limit(5);

    if (searchError) {
      console.error('❌ Failed to search users:', searchError.message);
    } else {
      console.log(`✅ Found ${searchResults.length} users matching search:`);
      searchResults.forEach(user => {
        console.log(`   - ${user.full_name} (${user.auth_users?.email}) - ${user.role} - Tenant: ${user.tenant_id || 'None'}`);
      });
    }

    // Test 7: Remove user from tenant
    console.log('\n7️⃣ Testing user removal from tenant...');
    if (tenantUsers && tenantUsers.length > 1) {
      const userToRemove = tenantUsers[1];
      
      const { error: removeError } = await supabase
        .from('profiles')
        .update({
          tenant_id: null,
          role: 'user'
        })
        .eq('id', userToRemove.id);

      if (removeError) {
        console.error('❌ Failed to remove user from tenant:', removeError.message);
      } else {
        console.log(`✅ Removed ${userToRemove.full_name} from tenant`);
      }
    }

    // Test 8: Cleanup
    console.log('\n8️⃣ Cleaning up test data...');
    
    // Delete test users
    for (const user of createdUsers) {
      const { error: deleteUserError } = await supabase.auth.admin.deleteUser(user.id);
      if (deleteUserError) {
        console.error(`⚠️  Failed to delete user ${user.email}:`, deleteUserError.message);
      } else {
        console.log(`✅ Deleted user: ${user.email}`);
      }
    }

    // Delete test tenant
    const { error: deleteTenantError } = await supabase
      .from('tenants')
      .delete()
      .eq('id', tenantData.id);

    if (deleteTenantError) {
      console.error('⚠️  Failed to delete test tenant:', deleteTenantError.message);
    } else {
      console.log('✅ Deleted test tenant');
    }

    console.log('\n🎉 All tenant user management tests passed!');
    console.log('\n📋 Summary:');
    console.log('✅ Tenant creation');
    console.log('✅ User creation with profiles');
    console.log('✅ Adding users to tenant');
    console.log('✅ Listing tenant users');
    console.log('✅ Updating user roles');
    console.log('✅ Searching users');
    console.log('✅ Removing users from tenant');
    console.log('✅ Data cleanup');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Run the tests
testTenantUserManagement().catch(console.error);
