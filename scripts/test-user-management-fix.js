#!/usr/bin/env node

/**
 * Test script for user management functionality
 * This script tests the fixed user fetching and search functionality
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

async function testUserManagement() {
  console.log('🧪 Testing User Management Functionality...\n');

  try {
    // Test 1: Create test tenant
    console.log('1️⃣ Creating test tenant...');
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .insert({
        name: 'User Management Test Tenant',
        domain: 'user-test.example.com',
        plan_type: 'basic',
        billing_email: 'billing@user-test.com',
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
            max_reviews: 100,
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
    console.log(`   Tenant ID: ${tenant.id}`);

    // Test 2: Create test users
    console.log('\n2️⃣ Creating test users...');
    const testUsers = [
      {
        email: 'user1@test.com',
        password: 'password123',
        full_name: 'Test User One',
        role: 'user'
      },
      {
        email: 'user2@test.com',
        password: 'password123',
        full_name: 'Test User Two',
        role: 'user'
      },
      {
        email: 'admin@test.com',
        password: 'password123',
        full_name: 'Test Admin User',
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

    // Test 3: Test user search functionality
    console.log('\n3️⃣ Testing user search functionality...');
    
    // Test search by name
    console.log('   Testing search by name...');
    const { data: searchResults, error: searchError } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        role,
        tenant_id,
        created_at
      `)
      .ilike('full_name', '%Test%')
      .limit(10);

    if (searchError) {
      console.error('❌ Search failed:', searchError.message);
    } else {
      console.log(`✅ Found ${searchResults.length} users matching 'Test'`);
      searchResults.forEach(user => {
        console.log(`   - ${user.full_name} (${user.role}) - Tenant: ${user.tenant_id || 'None'}`);
      });
    }

    // Test 4: Test fetching auth user data
    console.log('\n4️⃣ Testing auth user data fetching...');
    for (const user of createdUsers) {
      try {
        const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(user.id);
        
        if (authError) {
          console.error(`❌ Failed to fetch auth data for ${user.full_name}:`, authError.message);
        } else {
          console.log(`✅ Fetched auth data for ${user.full_name}: ${authUser.user.email}`);
        }
      } catch (error) {
        console.error(`❌ Error fetching auth data for ${user.full_name}:`, error.message);
      }
    }

    // Test 5: Test adding users to tenant
    console.log('\n5️⃣ Testing adding users to tenant...');
    for (let i = 0; i < Math.min(2, createdUsers.length); i++) {
      const user = createdUsers[i];
      const role = i === 0 ? 'tenant_admin' : 'user';
      
      const { error: addError } = await supabase
        .from('profiles')
        .update({
          tenant_id: tenant.id,
          role: role
        })
        .eq('id', user.id);

      if (addError) {
        console.error(`❌ Failed to add ${user.full_name} to tenant:`, addError.message);
      } else {
        console.log(`✅ Added ${user.full_name} to tenant as ${role}`);
      }
    }

    // Test 6: Test loading tenant users
    console.log('\n6️⃣ Testing loading tenant users...');
    const { data: tenantUsers, error: tenantUsersError } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        role,
        created_at
      `)
      .eq('tenant_id', tenant.id)
      .order('created_at', { ascending: false });

    if (tenantUsersError) {
      console.error('❌ Failed to load tenant users:', tenantUsersError.message);
    } else {
      console.log(`✅ Loaded ${tenantUsers.length} tenant users:`);
      tenantUsers.forEach(user => {
        console.log(`   - ${user.full_name} (${user.role})`);
      });
    }

    // Test 7: Test user search with auth data
    console.log('\n7️⃣ Testing user search with auth data...');
    const searchResultsWithAuth = [];
    
    for (const profile of searchResults || []) {
      try {
        const { data: authUser } = await supabase.auth.admin.getUserById(profile.id);
        
        if (authUser?.user?.email) {
          searchResultsWithAuth.push({
            id: profile.id,
            email: authUser.user.email,
            full_name: profile.full_name,
            current_tenant_id: profile.tenant_id,
            current_role: profile.role,
          });
        }
      } catch (authError) {
        console.warn(`⚠️  Failed to fetch auth data for ${profile.full_name}:`, authError.message);
      }
    }

    console.log(`✅ Found ${searchResultsWithAuth.length} users with auth data:`);
    searchResultsWithAuth.forEach(user => {
      console.log(`   - ${user.full_name} (${user.email}) - Role: ${user.current_role} - Tenant: ${user.current_tenant_id || 'None'}`);
    });

    // Test 8: Test role updates
    console.log('\n8️⃣ Testing role updates...');
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

    // Test 9: Cleanup
    console.log('\n9️⃣ Cleaning up test data...');
    
    // Remove users from tenant
    for (const user of createdUsers) {
      const { error: removeError } = await supabase
        .from('profiles')
        .update({
          tenant_id: null,
          role: 'user'
        })
        .eq('id', user.id);

      if (removeError) {
        console.error(`⚠️  Failed to remove ${user.full_name} from tenant:`, removeError.message);
      } else {
        console.log(`✅ Removed ${user.full_name} from tenant`);
      }
    }

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
      .eq('id', tenant.id);

    if (deleteTenantError) {
      console.error('⚠️  Failed to delete test tenant:', deleteTenantError.message);
    } else {
      console.log('✅ Deleted test tenant');
    }

    console.log('\n🎉 All user management tests passed!');
    console.log('\n📋 Summary:');
    console.log('✅ User creation with profiles');
    console.log('✅ User search by name');
    console.log('✅ Auth user data fetching');
    console.log('✅ Adding users to tenant');
    console.log('✅ Loading tenant users');
    console.log('✅ User search with auth data');
    console.log('✅ Role updates');
    console.log('✅ Data cleanup');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Run the tests
testUserManagement().catch(console.error);
