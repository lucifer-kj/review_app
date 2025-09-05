#!/usr/bin/env node

/**
 * Deploy Database Schema Script
 * This script deploys the multi-tenancy schema to Supabase
 * 
 * Usage:
 * 1. Set your Supabase credentials in .env file
 * 2. Run: node scripts/deploy-schema.js
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
  console.error('❌ Missing Supabase credentials!');
  console.error('Please set VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY in your .env file');
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function deploySchema() {
  try {
    console.log('🚀 Starting database schema deployment...');
    
    // Read the migration file
    const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '20250104000000_implement_multi_tenancy.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Migration file loaded successfully');
    console.log('🔧 Executing migration...');
    
    // Execute the migration
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: migrationSQL
    });
    
    if (error) {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    }
    
    console.log('✅ Migration executed successfully!');
    console.log('🎉 Multi-tenancy schema deployed to Supabase');
    
    // Verify tables were created
    console.log('🔍 Verifying tables...');
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['tenants', 'user_invitations', 'audit_logs', 'usage_metrics', 'system_settings']);
    
    if (tablesError) {
      console.error('❌ Error verifying tables:', tablesError);
    } else {
      console.log('✅ Tables created successfully:');
      tables.forEach(table => {
        console.log(`   - ${table.table_name}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Deployment failed:', error);
    process.exit(1);
  }
}

// Run the deployment
deploySchema();
