/**
 * Diagnostic script to check database state
 * Run with: node scripts/diagnose-database.js
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
const envPath = join(__dirname, '..', '.env');
let envVars = {};

try {
  const envContent = readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      envVars[key.trim()] = value.trim();
    }
  });
} catch (error) {
  console.log('No .env file found, using environment variables');
}

const supabaseUrl = envVars.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = envVars.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   VITE_SUPABASE_URL');
  console.error('   VITE_SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function diagnoseDatabase() {
  try {
    console.log('🔍 Diagnosing database state...\n');

    // Check if profiles table exists and its structure
    console.log('📋 Checking profiles table structure...');
    const { data: tableInfo, error: tableError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', 'profiles')
      .eq('table_schema', 'public');

    if (tableError) {
      console.error('❌ Error checking table structure:', tableError.message);
    } else {
      console.log('✅ Profiles table structure:');
      tableInfo.forEach(col => {
        console.log(`   ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
    }

    // Check current roles in the table
    console.log('\n👥 Checking current roles...');
    const { data: roles, error: rolesError } = await supabase
      .from('profiles')
      .select('role')
      .not('role', 'is', null);

    if (rolesError) {
      console.error('❌ Error checking roles:', rolesError.message);
    } else {
      const roleCounts = {};
      roles.forEach(row => {
        roleCounts[row.role] = (roleCounts[row.role] || 0) + 1;
      });
      
      console.log('✅ Current roles in profiles table:');
      Object.entries(roleCounts).forEach(([role, count]) => {
        console.log(`   ${role}: ${count} user(s)`);
      });
    }

    // Check specific user
    console.log('\n🎯 Checking specific user...');
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', 'edd7c8bc-f167-43b0-8ef0-53120b5cd444')
      .single();

    if (userError) {
      console.error('❌ Error checking specific user:', userError.message);
      console.log('   User might not exist in profiles table');
    } else {
      console.log('✅ Specific user found:');
      console.log(`   ID: ${user.id}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Created: ${user.created_at}`);
      console.log(`   Updated: ${user.updated_at}`);
    }

    // Check auth.users table
    console.log('\n🔐 Checking auth.users table...');
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById('edd7c8bc-f167-43b0-8ef0-53120b5cd444');
    
    if (authError) {
      console.error('❌ Error checking auth user:', authError.message);
    } else if (authUser.user) {
      console.log('✅ User found in auth.users:');
      console.log(`   Email: ${authUser.user.email}`);
      console.log(`   Created: ${authUser.user.created_at}`);
      console.log(`   Email confirmed: ${authUser.user.email_confirmed_at ? 'Yes' : 'No'}`);
    } else {
      console.log('❌ User not found in auth.users');
    }

    // Check constraints
    console.log('\n🔒 Checking table constraints...');
    const { data: constraints, error: constraintError } = await supabase
      .from('information_schema.check_constraints')
      .select('constraint_name, check_clause')
      .eq('table_name', 'profiles')
      .eq('table_schema', 'public');

    if (constraintError) {
      console.error('❌ Error checking constraints:', constraintError.message);
    } else {
      console.log('✅ Table constraints:');
      constraints.forEach(constraint => {
        console.log(`   ${constraint.constraint_name}: ${constraint.check_clause}`);
      });
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

// Run the diagnosis
diagnoseDatabase();
