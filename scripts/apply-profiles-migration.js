#!/usr/bin/env node

/**
 * Script to apply the profiles table migration
 * This will update the profiles table to support multi-tenancy
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please set VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  console.log('🔄 Applying profiles table migration...\n');

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20250115000000_update_profiles_table.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Migration SQL loaded');
    console.log('🔧 Executing migration...\n');

    // Execute the migration
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });

    if (error) {
      console.error('❌ Migration failed:', error.message);
      console.error('Details:', error);
      return;
    }

    console.log('✅ Migration applied successfully!');
    console.log('\n📋 What was updated:');
    console.log('  • Added full_name column to profiles table');
    console.log('  • Added email column to profiles table');
    console.log('  • Added tenant_id column to profiles table');
    console.log('  • Added avatar_url column to profiles table');
    console.log('  • Added preferences column to profiles table');
    console.log('  • Updated role constraint for multi-tenant roles');
    console.log('  • Created indexes for better performance');
    console.log('  • Updated RLS policies for multi-tenancy');
    console.log('  • Created helper functions for tenant management');

    console.log('\n🎉 The TenantUserManager should now work properly!');
    console.log('\n📝 Next steps:');
    console.log('  1. Test the user management functionality');
    console.log('  2. Update existing user profiles with full_name and email data');
    console.log('  3. Assign users to tenants as needed');

  } catch (error) {
    console.error('❌ Error applying migration:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the migration
applyMigration().catch(console.error);
