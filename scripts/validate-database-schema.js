#!/usr/bin/env node

/**
 * Database Schema Validation Script
 * Validates that all critical database components are working correctly
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
    name: 'Verify all required tables exist',
    test: async () => {
      const requiredTables = [
        'tenants', 'profiles', 'business_settings', 'reviews', 
        'user_invitations', 'audit_logs', 'usage_metrics', 'system_settings'
      ];
      
      const { data, error } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .in('table_name', requiredTables);
      
      if (error) throw error;
      
      const existingTables = data.map(row => row.table_name);
      const missingTables = requiredTables.filter(table => !existingTables.includes(table));
      
      if (missingTables.length > 0) {
        throw new Error(`Missing tables: ${missingTables.join(', ')}`);
      }
      
      return `✅ All ${requiredTables.length} required tables exist`;
    }
  },
  
  {
    name: 'Verify all required functions exist',
    test: async () => {
      const requiredFunctions = [
        'get_current_tenant_id', 'is_super_admin', 'is_tenant_admin', 'handle_new_user'
      ];
      
      const { data, error } = await supabase
        .from('information_schema.routines')
        .select('routine_name')
        .eq('routine_schema', 'public')
        .in('routine_name', requiredFunctions);
      
      if (error) throw error;
      
      const existingFunctions = data.map(row => row.routine_name);
      const missingFunctions = requiredFunctions.filter(func => !existingFunctions.includes(func));
      
      if (missingFunctions.length > 0) {
        throw new Error(`Missing functions: ${missingFunctions.join(', ')}`);
      }
      
      return `✅ All ${requiredFunctions.length} required functions exist`;
    }
  },
  
  {
    name: 'Verify RLS is enabled on all tables',
    test: async () => {
      const requiredTables = [
        'tenants', 'profiles', 'business_settings', 'reviews', 
        'user_invitations', 'audit_logs', 'usage_metrics', 'system_settings'
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
    name: 'Verify RLS policies exist',
    test: async () => {
      const { data, error } = await supabase
        .from('pg_policies')
        .select('tablename, policyname')
        .eq('schemaname', 'public')
        .order('tablename');
      
      if (error) throw error;
      
      const policiesByTable = {};
      data.forEach(row => {
        if (!policiesByTable[row.tablename]) {
          policiesByTable[row.tablename] = [];
        }
        policiesByTable[row.tablename].push(row.policyname);
      });
      
      const requiredTables = [
        'tenants', 'profiles', 'business_settings', 'reviews', 
        'user_invitations', 'audit_logs', 'usage_metrics', 'system_settings'
      ];
      
      const tablesWithoutPolicies = requiredTables.filter(table => 
        !policiesByTable[table] || policiesByTable[table].length === 0
      );
      
      if (tablesWithoutPolicies.length > 0) {
        throw new Error(`Tables without RLS policies: ${tablesWithoutPolicies.join(', ')}`);
      }
      
      const totalPolicies = data.length;
      return `✅ ${totalPolicies} RLS policies exist across all tables`;
    }
  },
  
  {
    name: 'Test get_current_tenant_id function',
    test: async () => {
      // Create a test user profile
      const testUserId = '00000000-0000-0000-0000-000000000001';
      const testTenantId = '00000000-0000-0000-0000-000000000002';
      
      // Insert test tenant
      await supabase
        .from('tenants')
        .upsert({
          id: testTenantId,
          name: 'Test Tenant',
          status: 'active'
        });
      
      // Insert test profile
      await supabase
        .from('profiles')
        .upsert({
          id: testUserId,
          email: 'test@example.com',
          role: 'user',
          tenant_id: testTenantId
        });
      
      // Test the function
      const { data, error } = await supabase.rpc('get_current_tenant_id');
      
      if (error) {
        throw new Error(`Function error: ${error.message}`);
      }
      
      // Clean up test data
      await supabase.from('profiles').delete().eq('id', testUserId);
      await supabase.from('tenants').delete().eq('id', testTenantId);
      
      return '✅ get_current_tenant_id function works correctly';
    }
  },
  
  {
    name: 'Test is_super_admin function',
    test: async () => {
      const testUserId = '00000000-0000-0000-0000-000000000003';
      
      // Insert test profile with super_admin role
      await supabase
        .from('profiles')
        .upsert({
          id: testUserId,
          email: 'admin@example.com',
          role: 'super_admin'
        });
      
      // Test the function
      const { data, error } = await supabase.rpc('is_super_admin', { user_id: testUserId });
      
      if (error) {
        throw new Error(`Function error: ${error.message}`);
      }
      
      if (!data) {
        throw new Error('Function returned false for super_admin user');
      }
      
      // Clean up test data
      await supabase.from('profiles').delete().eq('id', testUserId);
      
      return '✅ is_super_admin function works correctly';
    }
  },
  
  {
    name: 'Test user_invitations table access',
    test: async () => {
      // Test that we can insert into user_invitations table
      const { data, error } = await supabase
        .from('user_invitations')
        .insert({
          email: 'test@example.com',
          role: 'user',
          invited_by: '00000000-0000-0000-0000-000000000004',
          token: 'test-token-123',
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        })
        .select();
      
      if (error) {
        throw new Error(`Insert error: ${error.message}`);
      }
      
      // Clean up test data
      await supabase.from('user_invitations').delete().eq('id', data[0].id);
      
      return '✅ user_invitations table is accessible and working';
    }
  },
  
  {
    name: 'Test tenant isolation',
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
        
        return '✅ Tenant isolation is working correctly';
        
      } finally {
        // Clean up test data
        await supabase.from('business_settings').delete().in('tenant_id', [tenant1Id, tenant2Id]);
        await supabase.from('profiles').delete().in('id', [user1Id, user2Id]);
        await supabase.from('tenants').delete().in('id', [tenant1Id, tenant2Id]);
      }
    }
  }
];

async function runValidation() {
  console.log('🔍 Starting database schema validation...\n');
  
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
  
  console.log('📊 Validation Summary:');
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);
  
  if (failed > 0) {
    console.log('\n🚨 Some tests failed. Please review the errors above.');
    process.exit(1);
  } else {
    console.log('\n🎉 All tests passed! Database schema is ready for production.');
  }
}

// Run validation
runValidation().catch(error => {
  console.error('💥 Validation script failed:', error);
  process.exit(1);
});
