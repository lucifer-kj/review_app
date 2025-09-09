/**
 * Test script to verify that real tenant data is being fetched
 * This will help confirm that the fix is working
 */

import { createClient } from '@supabase/supabase-js';

// Load environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables:');
  console.error('   VITE_SUPABASE_URL');
  console.error('   VITE_SUPABASE_ANON_KEY');
  console.error('\nPlease set these environment variables and try again.');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testRealTenantData() {
  try {
    console.log('🔍 Testing real tenant data fetch...');
    console.log('Supabase URL:', supabaseUrl);
    console.log('Anon Key:', supabaseAnonKey.substring(0, 20) + '...');
    
    // Test 1: Fetch all tenants
    console.log('\n📋 Fetching all tenants...');
    const { data: tenants, error: tenantsError } = await supabase
      .from('tenants')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (tenantsError) {
      console.error('❌ Failed to fetch tenants:', tenantsError);
      return false;
    }
    
    console.log('✅ Tenants fetched successfully!');
    console.log(`   Found ${tenants.length} tenants`);
    
    if (tenants.length > 0) {
      console.log('\n📄 Sample tenant data:');
      tenants.slice(0, 3).forEach((tenant, index) => {
        console.log(`   ${index + 1}. ${tenant.name} (${tenant.status})`);
        console.log(`      ID: ${tenant.id}`);
        console.log(`      Plan: ${tenant.plan_type || 'N/A'}`);
        console.log(`      Created: ${new Date(tenant.created_at).toLocaleDateString()}`);
        console.log('');
      });
    } else {
      console.log('   No tenants found in database');
    }
    
    // Test 2: Check if plan_type column exists
    console.log('🔍 Checking table structure...');
    const { data: tableInfo, error: tableError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_name', 'tenants')
      .eq('table_schema', 'public');
    
    if (tableError) {
      console.error('❌ Failed to check table structure:', tableError);
      return false;
    }
    
    const hasPlanType = tableInfo.some(col => col.column_name === 'plan_type');
    const hasBillingEmail = tableInfo.some(col => col.column_name === 'billing_email');
    
    console.log('✅ Table structure check complete');
    console.log(`   plan_type column: ${hasPlanType ? '✅ EXISTS' : '❌ MISSING'}`);
    console.log(`   billing_email column: ${hasBillingEmail ? '✅ EXISTS' : '❌ MISSING'}`);
    
    if (!hasPlanType || !hasBillingEmail) {
      console.log('\n⚠️  Missing columns detected!');
      console.log('   Please run the MANUAL_DATABASE_FIX.sql script in Supabase Dashboard');
      return false;
    }
    
    // Test 3: Test tenant creation (if no tenants exist)
    if (tenants.length === 0) {
      console.log('\n🧪 Testing tenant creation...');
      const testTenant = {
        name: 'Test Tenant from Script',
        plan_type: 'basic',
        settings: { test: true }
      };
      
      const { data: newTenant, error: createError } = await supabase
        .from('tenants')
        .insert(testTenant)
        .select()
        .single();
      
      if (createError) {
        console.error('❌ Failed to create test tenant:', createError);
        return false;
      }
      
      console.log('✅ Test tenant created successfully!');
      console.log(`   ID: ${newTenant.id}`);
      console.log(`   Name: ${newTenant.name}`);
      console.log(`   Plan: ${newTenant.plan_type}`);
      
      // Clean up test tenant
      await supabase
        .from('tenants')
        .delete()
        .eq('id', newTenant.id);
      
      console.log('🧹 Test tenant cleaned up');
    }
    
    console.log('\n🎉 All tests passed!');
    console.log('   Real tenant data is being fetched correctly');
    console.log('   The app should now show real data instead of mock data');
    
    return true;
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return false;
  }
}

// Run the test
testRealTenantData()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
