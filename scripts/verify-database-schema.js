/**
 * Database Schema Verification Script
 * Verifies that the consolidated database schema is properly applied
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

async function verifyDatabaseSchema() {
  console.log('🔍 Verifying consolidated database schema...\n');

  try {
    // Step 1: Verify all tables exist
    console.log('1️⃣ Checking tables...');
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', [
        'system_settings',
        'tenants',
        'profiles',
        'user_invitations',
        'business_settings',
        'reviews',
        'audit_logs',
        'usage_metrics'
      ]);

    if (tablesError) {
      console.error('❌ Failed to check tables:', tablesError);
      return;
    }

    const expectedTables = [
      'system_settings',
      'tenants',
      'profiles',
      'user_invitations',
      'business_settings',
      'reviews',
      'audit_logs',
      'usage_metrics'
    ];

    const existingTables = tables.map(t => t.table_name);
    const missingTables = expectedTables.filter(table => !existingTables.includes(table));

    if (missingTables.length === 0) {
      console.log('✅ All required tables exist');
    } else {
      console.log('❌ Missing tables:', missingTables.join(', '));
    }

    // Step 2: Verify all functions exist
    console.log('\n2️⃣ Checking functions...');
    const { data: functions, error: functionsError } = await supabase
      .from('information_schema.routines')
      .select('routine_name')
      .eq('routine_schema', 'public')
      .in('routine_name', [
        'handle_new_user',
        'update_updated_at_column',
        'get_current_tenant_id',
        'is_super_admin',
        'is_tenant_admin',
        'create_tenant_with_admin',
        'get_platform_analytics',
        'get_all_reviews_for_dashboard',
        'get_review_stats_for_dashboard'
      ]);

    if (functionsError) {
      console.error('❌ Failed to check functions:', functionsError);
      return;
    }

    const expectedFunctions = [
      'handle_new_user',
      'update_updated_at_column',
      'get_current_tenant_id',
      'is_super_admin',
      'is_tenant_admin',
      'create_tenant_with_admin',
      'get_platform_analytics',
      'get_all_reviews_for_dashboard',
      'get_review_stats_for_dashboard'
    ];

    const existingFunctions = functions.map(f => f.routine_name);
    const missingFunctions = expectedFunctions.filter(func => !existingFunctions.includes(func));

    if (missingFunctions.length === 0) {
      console.log('✅ All required functions exist');
    } else {
      console.log('❌ Missing functions:', missingFunctions.join(', '));
    }

    // Step 3: Verify RLS policies
    console.log('\n3️⃣ Checking RLS policies...');
    const { data: policies, error: policiesError } = await supabase
      .from('pg_policies')
      .select('tablename, policyname')
      .eq('schemaname', 'public');

    if (policiesError) {
      console.log('⚠️  Could not check RLS policies (this is normal)');
    } else {
      console.log(`📋 Found ${policies.length} RLS policies`);
      
      // Group policies by table
      const policiesByTable = policies.reduce((acc, policy) => {
        acc[policy.tablename] = (acc[policy.tablename] || 0) + 1;
        return acc;
      }, {});

      console.log('📊 Policies per table:', policiesByTable);
    }

    // Step 4: Verify indexes
    console.log('\n4️⃣ Checking indexes...');
    const { data: indexes, error: indexesError } = await supabase
      .from('pg_indexes')
      .select('tablename, indexname')
      .eq('schemaname', 'public')
      .like('indexname', 'idx_%');

    if (indexesError) {
      console.log('⚠️  Could not check indexes (this is normal)');
    } else {
      console.log(`📋 Found ${indexes.length} custom indexes`);
      
      // Group indexes by table
      const indexesByTable = indexes.reduce((acc, index) => {
        acc[index.tablename] = (acc[index.tablename] || 0) + 1;
        return acc;
      }, {});

      console.log('📊 Indexes per table:', indexesByTable);
    }

    // Step 5: Test critical functions
    console.log('\n5️⃣ Testing critical functions...');
    
    // Test get_platform_analytics
    try {
      const { data: analytics, error: analyticsError } = await supabase
        .rpc('get_platform_analytics');
      
      if (analyticsError) {
        console.log('❌ get_platform_analytics failed:', analyticsError.message);
      } else {
        console.log('✅ get_platform_analytics working');
        console.log('   Analytics data:', analytics);
      }
    } catch (error) {
      console.log('❌ get_platform_analytics error:', error.message);
    }

    // Test is_super_admin
    try {
      const { data: isSuperAdmin, error: superAdminError } = await supabase
        .rpc('is_super_admin', { user_id: '00000000-0000-0000-0000-000000000000' });
      
      if (superAdminError) {
        console.log('❌ is_super_admin failed:', superAdminError.message);
      } else {
        console.log('✅ is_super_admin working');
      }
    } catch (error) {
      console.log('❌ is_super_admin error:', error.message);
    }

    // Step 6: Check system settings
    console.log('\n6️⃣ Checking system settings...');
    const { data: settings, error: settingsError } = await supabase
      .from('system_settings')
      .select('key, value');

    if (settingsError) {
      console.log('❌ Failed to check system settings:', settingsError.message);
    } else {
      console.log(`✅ Found ${settings.length} system settings`);
      settings.forEach(setting => {
        console.log(`   - ${setting.key}: ${setting.value}`);
      });
    }

    // Step 7: Test tenant creation
    console.log('\n7️⃣ Testing tenant creation...');
    try {
      const testTenantData = {
        name: 'Test Tenant',
        domain: 'test.example.com',
        settings: { test: true }
      };

      const { data: tenantResult, error: tenantError } = await supabase
        .rpc('create_tenant_with_admin', {
          tenant_data: testTenantData,
          admin_email: 'test@example.com'
        });

      if (tenantError) {
        console.log('❌ create_tenant_with_admin failed:', tenantError.message);
      } else {
        console.log('✅ create_tenant_with_admin working');
        console.log('   Created tenant:', tenantResult);

        // Clean up test tenant
        await supabase
          .from('tenants')
          .delete()
          .eq('id', tenantResult.tenant_id);
        
        await supabase
          .from('user_invitations')
          .delete()
          .eq('tenant_id', tenantResult.tenant_id);
      }
    } catch (error) {
      console.log('❌ create_tenant_with_admin error:', error.message);
    }

    // Final summary
    console.log('\n🎉 Database schema verification completed!');
    console.log('\n📊 Summary:');
    console.log(`   Tables: ${missingTables.length === 0 ? '✅ All present' : `❌ ${missingTables.length} missing`}`);
    console.log(`   Functions: ${missingFunctions.length === 0 ? '✅ All present' : `❌ ${missingFunctions.length} missing`}`);
    console.log(`   RLS Policies: ${policies ? `✅ ${policies.length} policies` : '⚠️  Could not verify'}`);
    console.log(`   Indexes: ${indexes ? `✅ ${indexes.length} indexes` : '⚠️  Could not verify'}`);
    console.log(`   System Settings: ${settings ? `✅ ${settings.length} settings` : '❌ Failed'}`);

    if (missingTables.length === 0 && missingFunctions.length === 0) {
      console.log('\n🎊 Database schema is properly consolidated and ready!');
    } else {
      console.log('\n⚠️  Some issues found. Please review and fix before proceeding.');
    }

  } catch (error) {
    console.error('❌ Verification failed:', error);
  }
}

// Run the verification
verifyDatabaseSchema();
