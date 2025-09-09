/**
 * Fix missing plan_type column in tenants table
 * This script applies the migration to add the plan_type column
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   VITE_SUPABASE_URL');
  console.error('   VITE_SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function fixPlanTypeColumn() {
  try {
    console.log('🔧 Fixing missing plan_type column in tenants table...');
    
    // Read the migration file
    const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '20250111000001_add_plan_type_to_tenants.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Migration SQL:');
    console.log(migrationSQL);
    console.log('\n🚀 Applying migration...');
    
    // Execute the migration
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
    
    if (error) {
      console.error('❌ Migration failed:', error);
      return false;
    }
    
    console.log('✅ Migration applied successfully!');
    
    // Verify the column was added
    console.log('\n🔍 Verifying tenants table structure...');
    const { data: tableInfo, error: tableError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', 'tenants')
      .eq('table_schema', 'public')
      .order('ordinal_position');
    
    if (tableError) {
      console.error('❌ Failed to verify table structure:', tableError);
      return false;
    }
    
    console.log('📋 Tenants table columns:');
    tableInfo.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    // Check if plan_type column exists
    const planTypeColumn = tableInfo.find(col => col.column_name === 'plan_type');
    if (planTypeColumn) {
      console.log('✅ plan_type column successfully added!');
      console.log(`   Type: ${planTypeColumn.data_type}`);
      console.log(`   Nullable: ${planTypeColumn.is_nullable}`);
      console.log(`   Default: ${planTypeColumn.column_default}`);
    } else {
      console.error('❌ plan_type column not found after migration');
      return false;
    }
    
    // Test tenant creation
    console.log('\n🧪 Testing tenant creation...');
    const testTenant = {
      name: 'Test Tenant',
      domain: 'test.example.com',
      plan_type: 'pro',
      settings: { test: true }
    };
    
    const { data: testResult, error: testError } = await supabase
      .from('tenants')
      .insert(testTenant)
      .select()
      .single();
    
    if (testError) {
      console.error('❌ Test tenant creation failed:', testError);
      return false;
    }
    
    console.log('✅ Test tenant created successfully!');
    console.log('   ID:', testResult.id);
    console.log('   Name:', testResult.name);
    console.log('   Plan Type:', testResult.plan_type);
    
    // Clean up test tenant
    await supabase
      .from('tenants')
      .delete()
      .eq('id', testResult.id);
    
    console.log('🧹 Test tenant cleaned up');
    
    console.log('\n🎉 Fix completed successfully!');
    console.log('   The tenants table now has the plan_type column');
    console.log('   Tenant creation should work properly now');
    
    return true;
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return false;
  }
}

// Run the fix
fixPlanTypeColumn()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
