#!/usr/bin/env node

/**
 * Database State Verification Script
 * Checks the current state of the Supabase database and reports what's missing
 *
 * Usage:
 * 1. Set your Supabase credentials in .env file
 * 2. Run: node scripts/verify-database-state.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const CONFIG = {
  supabaseUrl: process.env.VITE_SUPABASE_URL,
  supabaseServiceKey: process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
};

class DatabaseVerifier {
  constructor() {
    this.supabase = null;
  }

  async initialize() {
    console.log('🔧 Initializing database verifier...');

    if (!CONFIG.supabaseUrl || !CONFIG.supabaseServiceKey) {
      throw new Error('Missing Supabase credentials. Please set VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY in your .env file');
    }

    this.supabase = createClient(CONFIG.supabaseUrl, CONFIG.supabaseServiceKey);
    console.log('✅ Supabase client initialized');
  }

  async checkConnection() {
    console.log('🔍 Checking database connection...');

    try {
      const { data, error } = await this.supabase.from('information_schema.tables').select('count').limit(1);

      if (error) {
        throw new Error(`Connection failed: ${error.message}`);
      }

      console.log('✅ Database connection successful');
      return true;
    } catch (error) {
      console.error('❌ Database connection failed:', error.message);
      return false;
    }
  }

  async getExistingTables() {
    console.log('📋 Checking existing tables...');

    try {
      const { data: tables, error } = await this.supabase
        .from('information_schema.tables')
        .select('table_name, table_schema')
        .eq('table_schema', 'public');

      if (error) throw error;

      const tableNames = tables.map(t => t.table_name);
      console.log(`✅ Found ${tableNames.length} tables in public schema`);

      return tableNames;
    } catch (error) {
      console.error('❌ Failed to get table list:', error.message);
      return [];
    }
  }

  async getExistingFunctions() {
    console.log('🔧 Checking existing functions...');

    try {
      const { data: functions, error } = await this.supabase
        .from('information_schema.routines')
        .select('routine_name')
        .eq('routine_schema', 'public')
        .eq('routine_type', 'FUNCTION');

      if (error) throw error;

      const functionNames = functions.map(f => f.routine_name);
      console.log(`✅ Found ${functionNames.length} functions`);

      return functionNames;
    } catch (error) {
      console.error('❌ Failed to get function list:', error.message);
      return [];
    }
  }

  async checkRequiredSchema() {
    console.log('🔍 Analyzing required vs existing schema...');

    const requiredTables = [
      'system_settings',
      'tenants',
      'profiles',
      'business_settings',
      'reviews',
      'audit_logs',
      'usage_metrics'
    ];

    const requiredFunctions = [
      'get_current_tenant_id',
      'is_super_admin',
      'is_tenant_admin',
      'create_tenant_with_admin',
      'get_platform_analytics',
      'get_all_reviews_for_dashboard',
      'get_review_stats_for_dashboard',
      'update_updated_at_column'
    ];

    const existingTables = await this.getExistingTables();
    const existingFunctions = await this.getExistingFunctions();

    const missingTables = requiredTables.filter(table => !existingTables.includes(table));
    const existingRequiredTables = requiredTables.filter(table => existingTables.includes(table));
    const extraTables = existingTables.filter(table => !requiredTables.includes(table));

    const missingFunctions = requiredFunctions.filter(func => !existingFunctions.includes(func));
    const existingRequiredFunctions = requiredFunctions.filter(func => existingFunctions.includes(func));

    console.log('');
    console.log('📊 SCHEMA ANALYSIS REPORT');
    console.log('=========================');

    console.log('');
    console.log('🗂️  TABLES:');
    console.log(`   ✅ Present (${existingRequiredTables.length}): ${existingRequiredTables.join(', ')}`);
    if (missingTables.length > 0) {
      console.log(`   ❌ Missing (${missingTables.length}): ${missingTables.join(', ')}`);
    }
    if (extraTables.length > 0) {
      console.log(`   ⚠️  Extra (${extraTables.length}): ${extraTables.join(', ')}`);
    }

    console.log('');
    console.log('🔧 FUNCTIONS:');
    console.log(`   ✅ Present (${existingRequiredFunctions.length}): ${existingRequiredFunctions.join(', ')}`);
    if (missingFunctions.length > 0) {
      console.log(`   ❌ Missing (${missingFunctions.length}): ${missingFunctions.join(', ')}`);
    }

    return {
      missingTables,
      missingFunctions,
      existingTables: existingRequiredTables,
      existingFunctions: existingRequiredFunctions
    };
  }

  async checkRLSPolicies() {
    console.log('🔒 Checking RLS policies...');

    try {
      const tablesToCheck = ['tenants', 'profiles', 'business_settings', 'reviews', 'audit_logs', 'usage_metrics'];

      for (const table of tablesToCheck) {
        try {
          const { data: policies, error } = await this.supabase
            .from('pg_policies')
            .select('policyname, permissive, roles, cmd, qual')
            .eq('tablename', table);

          if (error) throw error;

          if (policies && policies.length > 0) {
            console.log(`   ✅ ${table}: ${policies.length} RLS policies`);
          } else {
            console.log(`   ⚠️  ${table}: No RLS policies found`);
          }
        } catch (error) {
          console.log(`   ❌ ${table}: Error checking RLS - ${error.message}`);
        }
      }
    } catch (error) {
      console.error('❌ Failed to check RLS policies:', error.message);
    }
  }

  async generateReport() {
    console.log('');
    console.log('📋 DEPLOYMENT RECOMMENDATIONS');
    console.log('==============================');

    const analysis = await this.checkRequiredSchema();

    if (analysis.missingTables.length > 0 || analysis.missingFunctions.length > 0) {
      console.log('');
      console.log('🚨 DEPLOYMENT REQUIRED');
      console.log('Run the following commands:');
      console.log('');
      console.log('1. Deploy database schema:');
      console.log('   node scripts/deploy-schema-production.js');
      console.log('');
      if (analysis.missingTables.length > 0) {
        console.log(`   Missing tables: ${analysis.missingTables.join(', ')}`);
      }
      if (analysis.missingFunctions.length > 0) {
        console.log(`   Missing functions: ${analysis.missingFunctions.join(', ')}`);
      }
    } else {
      console.log('');
      console.log('✅ DATABASE SCHEMA COMPLETE');
      console.log('All required tables and functions are present.');
      console.log('');
      console.log('Next steps:');
      console.log('1. Run the test suite');
      console.log('2. Configure error monitoring');
      console.log('3. Set up CI/CD pipeline');
    }

    await this.checkRLSPolicies();
  }

  async runVerification() {
    try {
      console.log('🔍 Crux Database State Verification');
      console.log('====================================');
      console.log('');

      await this.initialize();

      const connected = await this.checkConnection();
      if (!connected) {
        console.error('');
        console.error('❌ Cannot proceed without database connection');
        console.error('Please check your Supabase credentials and network connection');
        process.exit(1);
      }

      await this.generateReport();

    } catch (error) {
      console.error('❌ Verification failed:', error.message);
      process.exit(1);
    }
  }
}

// Run verification
const verifier = new DatabaseVerifier();
verifier.runVerification().catch(error => {
  console.error('💥 Unexpected error:', error);
  process.exit(1);
});
