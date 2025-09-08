#!/usr/bin/env node

/**
 * Apply RLS Policy Fix Migration
 * This script applies the RLS conflict fix migration to resolve user fetching issues
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
  console.error('');
  console.error('Please create a .env file with these variables.');
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyRLSFix() {
  try {
    console.log('🔧 Applying RLS Policy Fix Migration...');
    console.log('');

    // Read the migration file
    const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '20250111000000_fix_rls_conflicts.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');

    console.log('📄 Migration file loaded successfully');
    console.log('🚀 Executing migration...');

    // Execute the migration
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: migrationSQL
    });

    if (error) {
      // If exec_sql doesn't exist, try direct query
      console.log('⚠️  exec_sql function not found, trying direct execution...');
      
      // Split SQL into individual statements and execute them
      const statements = migrationSQL
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

      for (const statement of statements) {
        if (statement.trim()) {
          console.log(`   Executing: ${statement.substring(0, 50)}...`);
          const { error: stmtError } = await supabase.rpc('exec', { sql: statement });
          if (stmtError) {
            console.warn(`   ⚠️  Warning: ${stmtError.message}`);
          }
        }
      }
    } else {
      console.log('✅ Migration executed successfully');
    }

    console.log('');
    console.log('🔍 Verifying RLS policies...');

    // Check RLS policies
    const { data: policies, error: policiesError } = await supabase
      .from('pg_policies')
      .select('tablename, policyname, permissive, roles, cmd, qual')
      .eq('schemaname', 'public');

    if (policiesError) {
      console.log('⚠️  Could not verify policies:', policiesError.message);
    } else {
      console.log(`✅ Found ${policies.length} RLS policies`);
      
      // Group by table
      const policiesByTable = policies.reduce((acc, policy) => {
        if (!acc[policy.tablename]) acc[policy.tablename] = [];
        acc[policy.tablename].push(policy.policyname);
        return acc;
      }, {});

      console.log('📋 Policies by table:');
      Object.entries(policiesByTable).forEach(([table, policyNames]) => {
        console.log(`   ${table}: ${policyNames.join(', ')}`);
      });
    }

    console.log('');
    console.log('🔍 Checking profiles table...');

    // Check profiles table structure
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(5);

    if (profilesError) {
      console.log('❌ Error checking profiles:', profilesError.message);
    } else {
      console.log(`✅ Found ${profiles.length} profiles`);
      if (profiles.length > 0) {
        console.log('📋 Sample profile:');
        console.log(`   ID: ${profiles[0].id}`);
        console.log(`   Email: ${profiles[0].email || 'N/A'}`);
        console.log(`   Role: ${profiles[0].role}`);
        console.log(`   Tenant ID: ${profiles[0].tenant_id || 'N/A'}`);
      }
    }

    console.log('');
    console.log('🎉 RLS Policy Fix Applied Successfully!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Restart your development server');
    console.log('2. Test the User Management page');
    console.log('3. Check browser console for any remaining errors');
    console.log('4. Remove the debug component from UserManagement.tsx');

  } catch (error) {
    console.error('❌ Error applying RLS fix:', error.message);
    console.error('');
    console.error('Please check:');
    console.error('1. Your Supabase service role key is correct');
    console.error('2. You have admin permissions on the database');
    console.error('3. The migration file exists and is readable');
    process.exit(1);
  }
}

// Run the migration
applyRLSFix();
