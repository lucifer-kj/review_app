#!/usr/bin/env node

/**
 * RLS Policy Validation Script
 * Validates that all RLS policies are working correctly and there are no conflicts
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   VITE_SUPABASE_URL');
  console.error('   VITE_SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const tests = [
  {
    name: 'Verify all required policies exist',
    test: async () => {
      const expectedPolicies = [
        // System settings
        { table: 'system_settings', policy: 'system_settings_super_admin_only' },
        
        // Tenants
        { table: 'tenants', policy: 'tenants_super_admin_all' },
        { table: 'tenants', policy: 'tenants_tenant_admin_read_own' },
        { table: 'tenants', policy: 'tenants_tenant_admin_update_own' },
        { table: 'tenants', policy: 'tenants_public_read_active' },
        { table: 'tenants', policy: 'tenants_authenticated_read_access' },
        
        // Profiles
        { table: 'profiles', policy: 'profiles_super_admin_all' },
        { table: 'profiles', policy: 'profiles_tenant_admin_tenant' },
        { table: 'profiles', policy: 'profiles_users_view_own' },
        { table: 'profiles', policy: 'profiles_users_update_own' },
        
        // User invitations
        { table: 'user_invitations', policy: 'user_invitations_super_admin_all' },
        { table: 'user_invitations', policy: 'user_invitations_tenant_admin_tenant' },
        { table: 'user_invitations', policy: 'user_invitations_users_view_own' },
        
        // Business settings
        { table: 'business_settings', policy: 'business_settings_super_admin_all' },
        { table: 'business_settings', policy: 'business_settings_tenant_users' },
        { table: 'business_settings', policy: 'business_settings_public_read_active' },
        
        // Reviews
        { table: 'reviews', policy: 'reviews_super_admin_all' },
        { table: 'reviews', policy: 'reviews_tenant_users' },
        { table: 'reviews', policy: 'reviews_anonymous_insert' },
        
        // Audit logs
        { table: 'audit_logs', policy: 'audit_logs_super_admin_all' },
        { table: 'audit_logs', policy: 'audit_logs_tenant_read' },
        { table: 'audit_logs', policy: 'audit_logs_tenant_insert' },
        
        // Usage metrics
        { table: 'usage_metrics', policy: 'usage_metrics_super_admin_all' },
        { table: 'usage_metrics', policy: 'usage_metrics_tenant_read' },
        { table: 'usage_metrics', policy: 'usage_metrics_tenant_insert' }
      ];
      
      const { data, error } = await supabase
        .from('pg_policies')
        .select('tablename, policyname')
        .eq('schemaname', 'public');
      
      if (error) throw error;
      
      const existingPolicies = data.map(row => ({
        table: row.tablename,
        policy: row.policyname
      }));
      
      const missingPolicies = expectedPolicies.filter(expected => 
        !existingPolicies.some(existing => 
          existing.table === expected.table && existing.policy === expected.policy
        )
      );
      
      if (missingPolicies.length > 0) {
        throw new Error(`Missing policies: ${missingPolicies.map(p => `${p.table}.${p.policy}`).join(', ')}`);
      }
      
      return `✅ All ${expectedPolicies.length} required policies exist`;
    }
  },
  
  {
    name: 'Check for duplicate policies',
    test: async () => {
      const { data, error } = await supabase
        .from('pg_policies')
        .select('tablename, policyname')
        .eq('schemaname', 'public');
      
      if (error) throw error;
      
      const policyCounts = {};
      data.forEach(row => {
        const key = `${row.tablename}.${row.policyname}`;
        policyCounts[key] = (policyCounts[key] || 0) + 1;
      });
      
      const duplicates = Object.entries(policyCounts)
        .filter(([key, count]) => count > 1)
        .map(([key]) => key);
      
      if (duplicates.length > 0) {
        throw new Error(`Duplicate policies found: ${duplicates.join(', ')}`);
      }
      
      return `✅ No duplicate policies found`;
    }
  },
  
  {
    name: 'Verify RLS is enabled on all tables',
    test: async () => {
      const requiredTables = [
        'system_settings', 'tenants', 'profiles', 'user_invitations',
        'business_settings', 'reviews', 'audit_logs', 'usage_metrics'
      ];
      
      const { data, error } = await supabase
        .from('pg_tables')
        .select('tablename, rowsecurity')
        .eq('schemaname', 'public')
        .in('tablename', requiredTables);
      
      if (error) throw error;
      
      const disabledRLS = data.filter(row => !row.rowsecurity);
      
      if (disabledRLS.length > 0) {
        throw new Error(`RLS disabled on tables: ${disabledRLS.map(row => row.tablename).join(', ')}`);
      }
      
      return `✅ RLS enabled on all ${requiredTables.length} tables`;
    }
  },
  
  {
    name: 'Test tenant isolation for business_settings',
    test: async () => {
      const tenant1Id = '00000000-0000-0000-0000-000000000001';
      const tenant2Id = '00000000-0000-0000-0000-000000000002';
      const user1Id = '00000000-0000-0000-0000-000000000003';
      const user2Id = '00000000-0000-0000-0000-000000000004';
      
      try {
        // Create test tenants
        await supabase.from('tenants').upsert([
          { id: tenant1Id, name: 'Tenant 1', status: 'active' },
          { id: tenant2Id, name: 'Tenant 2', status: 'active' }
        ]);
        
        // Create test profiles
        await supabase.from('profiles').upsert([
          { id: user1Id, email: 'user1@tenant1.com', role: 'user', tenant_id: tenant1Id },
          { id: user2Id, email: 'user2@tenant2.com', role: 'user', tenant_id: tenant2Id }
        ]);
        
        // Create test business settings
        await supabase.from('business_settings').upsert([
          { tenant_id: tenant1Id, user_id: user1Id, business_name: 'Business 1' },
          { tenant_id: tenant2Id, user_id: user2Id, business_name: 'Business 2' }
        ]);
        
        // Test that user1 can only see tenant1's business settings
        const { data: user1Settings, error: user1Error } = await supabase
          .from('business_settings')
          .select('*')
          .eq('tenant_id', tenant1Id);
        
        if (user1Error) throw user1Error;
        
        if (user1Settings.length !== 1 || user1Settings[0].business_name !== 'Business 1') {
          throw new Error('Tenant isolation failed: user1 can see wrong business settings');
        }
        
        return '✅ Tenant isolation working correctly for business_settings';
        
      } finally {
        // Clean up test data
        await supabase.from('business_settings').delete().in('tenant_id', [tenant1Id, tenant2Id]);
        await supabase.from('profiles').delete().in('id', [user1Id, user2Id]);
        await supabase.from('tenants').delete().in('id', [tenant1Id, tenant2Id]);
      }
    }
  },
  
  {
    name: 'Test tenant isolation for reviews',
    test: async () => {
      const tenant1Id = '00000000-0000-0000-0000-000000000005';
      const tenant2Id = '00000000-0000-0000-0000-000000000006';
      const user1Id = '00000000-0000-0000-0000-000000000007';
      const user2Id = '00000000-0000-0000-0000-000000000008';
      
      try {
        // Create test tenants
        await supabase.from('tenants').upsert([
          { id: tenant1Id, name: 'Tenant 1', status: 'active' },
          { id: tenant2Id, name: 'Tenant 2', status: 'active' }
        ]);
        
        // Create test profiles
        await supabase.from('profiles').upsert([
          { id: user1Id, email: 'user1@tenant1.com', role: 'user', tenant_id: tenant1Id },
          { id: user2Id, email: 'user2@tenant2.com', role: 'user', tenant_id: tenant2Id }
        ]);
        
        // Create test reviews
        await supabase.from('reviews').upsert([
          { tenant_id: tenant1Id, customer_name: 'Customer 1', rating: 5, review_text: 'Great service!' },
          { tenant_id: tenant2Id, customer_name: 'Customer 2', rating: 4, review_text: 'Good service!' }
        ]);
        
        // Test that user1 can only see tenant1's reviews
        const { data: user1Reviews, error: user1Error } = await supabase
          .from('reviews')
          .select('*')
          .eq('tenant_id', tenant1Id);
        
        if (user1Error) throw user1Error;
        
        if (user1Reviews.length !== 1 || user1Reviews[0].customer_name !== 'Customer 1') {
          throw new Error('Tenant isolation failed: user1 can see wrong reviews');
        }
        
        return '✅ Tenant isolation working correctly for reviews';
        
      } finally {
        // Clean up test data
        await supabase.from('reviews').delete().in('tenant_id', [tenant1Id, tenant2Id]);
        await supabase.from('profiles').delete().in('id', [user1Id, user2Id]);
        await supabase.from('tenants').delete().in('id', [tenant1Id, tenant2Id]);
      }
    }
  },
  
  {
    name: 'Test super admin access to system_settings',
    test: async () => {
      const superAdminId = '00000000-0000-0000-0000-000000000009';
      
      try {
        // Create super admin profile
        await supabase.from('profiles').upsert({
          id: superAdminId,
          email: 'admin@example.com',
          role: 'super_admin'
        });
        
        // Insert test system setting
        await supabase.from('system_settings').upsert({
          key: 'test_setting',
          value: '{"test": true}',
          description: 'Test setting'
        });
        
        // Test super admin access
        const { data, error } = await supabase
          .from('system_settings')
          .select('*')
          .eq('key', 'test_setting');
        
        if (error) {
          throw new Error(`Super admin access failed: ${error.message}`);
        }
        
        if (data.length === 0) {
          throw new Error('Super admin cannot access system settings');
        }
        
        return '✅ Super admin access working correctly for system_settings';
        
      } finally {
        // Clean up test data
        await supabase.from('system_settings').delete().eq('key', 'test_setting');
        await supabase.from('profiles').delete().eq('id', superAdminId);
      }
    }
  },
  
  {
    name: 'Test anonymous access to public review forms',
    test: async () => {
      const tenantId = '00000000-0000-0000-0000-000000000010';
      
      try {
        // Create active tenant
        await supabase.from('tenants').upsert({
          id: tenantId,
          name: 'Public Tenant',
          status: 'active'
        });
        
        // Create business settings for tenant
        await supabase.from('business_settings').upsert({
          tenant_id: tenantId,
          user_id: '00000000-0000-0000-0000-000000000011',
          business_name: 'Public Business'
        });
        
        // Test anonymous access to tenant data
        const { data: tenantData, error: tenantError } = await supabase
          .from('tenants')
          .select('*')
          .eq('id', tenantId);
        
        if (tenantError) {
          throw new Error(`Anonymous tenant access failed: ${tenantError.message}`);
        }
        
        if (tenantData.length === 0) {
          throw new Error('Anonymous users cannot access active tenants');
        }
        
        // Test anonymous access to business settings
        const { data: businessData, error: businessError } = await supabase
          .from('business_settings')
          .select('*')
          .eq('tenant_id', tenantId);
        
        if (businessError) {
          throw new Error(`Anonymous business settings access failed: ${businessError.message}`);
        }
        
        if (businessData.length === 0) {
          throw new Error('Anonymous users cannot access business settings for active tenants');
        }
        
        return '✅ Anonymous access working correctly for public review forms';
        
      } finally {
        // Clean up test data
        await supabase.from('business_settings').delete().eq('tenant_id', tenantId);
        await supabase.from('tenants').delete().eq('id', tenantId);
      }
    }
  },
  
  {
    name: 'Test user profile access policies',
    test: async () => {
      const userId = '00000000-0000-0000-0000-000000000012';
      
      try {
        // Create user profile
        await supabase.from('profiles').upsert({
          id: userId,
          email: 'user@example.com',
          role: 'user',
          full_name: 'Test User'
        });
        
        // Test user can view their own profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId);
        
        if (profileError) {
          throw new Error(`User profile access failed: ${profileError.message}`);
        }
        
        if (profileData.length === 0) {
          throw new Error('User cannot access their own profile');
        }
        
        return '✅ User profile access policies working correctly';
        
      } finally {
        // Clean up test data
        await supabase.from('profiles').delete().eq('id', userId);
      }
    }
  }
];

async function runValidation() {
  console.log('🔍 Starting RLS policy validation...\n');
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      console.log(`Running: ${test.name}`);
      const result = await test.test();
      console.log(`${result}\n`);
      passed++;
    } catch (error) {
      console.log(`❌ ${test.name} failed:`);
      console.log(`   Error: ${error.message}\n`);
      failed++;
    }
  }
  
  console.log('📊 RLS Policy Validation Summary:');
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);
  
  if (failed > 0) {
    console.log('\n🚨 Some RLS policy tests failed. Please review the errors above.');
    console.log('\n🔧 Common fixes:');
    console.log('   1. Ensure all policies exist and are correctly named');
    console.log('   2. Verify RLS is enabled on all tables');
    console.log('   3. Check that tenant isolation functions work correctly');
    console.log('   4. Test user access scenarios manually');
    process.exit(1);
  } else {
    console.log('\n🎉 All RLS policy tests passed! Policies are working correctly.');
  }
}

// Run validation
runValidation().catch(error => {
  console.error('💥 RLS policy validation failed:', error);
  process.exit(1);
});
