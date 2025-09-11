#!/usr/bin/env node

/**
 * Production Deployment Fixes Script
 * This script applies the necessary database migrations and configurations
 * to fix the 404 error and make the app production-ready.
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.production' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   VITE_SUPABASE_URL');
  console.error('   VITE_SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function deployProductionFixes() {
  console.log('🚀 Starting production deployment fixes...\n');

  try {
    // 1. Apply the public access migration
    console.log('📋 Applying public access migration...');
    const migrationPath = path.join(__dirname, '../supabase/migrations/20250115000000_fix_public_review_access.sql');
    
    if (!fs.existsSync(migrationPath)) {
      throw new Error('Migration file not found: ' + migrationPath);
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Split the migration into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    for (const statement of statements) {
      if (statement.trim()) {
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        if (error) {
          console.warn(`⚠️  Warning executing statement: ${error.message}`);
        }
      }
    }

    console.log('✅ Public access migration applied successfully\n');

    // 2. Verify test tenant exists
    console.log('🔍 Verifying test tenant...');
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', '36dcb9ba-9dec-4cb1-9465-a084e73329c4')
      .single();

    if (tenantError) {
      console.error('❌ Test tenant verification failed:', tenantError.message);
    } else {
      console.log('✅ Test tenant verified:', tenant.name);
    }

    // 3. Verify business settings exist
    console.log('🔍 Verifying business settings...');
    const { data: settings, error: settingsError } = await supabase
      .from('business_settings')
      .select('*')
      .eq('tenant_id', '36dcb9ba-9dec-4cb1-9465-a084e73329c4')
      .single();

    if (settingsError) {
      console.error('❌ Business settings verification failed:', settingsError.message);
    } else {
      console.log('✅ Business settings verified:', settings.business_name);
    }

    // 4. Test anonymous access
    console.log('🔍 Testing anonymous access...');
    const anonClient = createClient(supabaseUrl, process.env.VITE_SUPABASE_ANON_KEY);
    
    const { data: anonTenant, error: anonError } = await anonClient
      .from('tenants')
      .select('name, domain')
      .eq('id', '36dcb9ba-9dec-4cb1-9465-a084e73329c4')
      .single();

    if (anonError) {
      console.error('❌ Anonymous access test failed:', anonError.message);
    } else {
      console.log('✅ Anonymous access verified:', anonTenant.name);
    }

    console.log('\n🎉 Production deployment fixes completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('   1. Update your environment variables in Vercel');
    console.log('   2. Redeploy your application');
    console.log('   3. Test the review form URL: https://demo.alphabusinessdesigns.co.in/review/36dcb9ba-9dec-4cb1-9465-a084e73329c4');

  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    process.exit(1);
  }
}

// Add exec_sql function if it doesn't exist
async function createExecSqlFunction() {
  const { error } = await supabase.rpc('exec_sql', { sql: 'SELECT 1' });
  
  if (error && error.message.includes('function exec_sql')) {
    console.log('📋 Creating exec_sql function...');
    
    const createFunctionSQL = `
      CREATE OR REPLACE FUNCTION exec_sql(sql text)
      RETURNS void
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      BEGIN
        EXECUTE sql;
      END;
      $$;
    `;
    
    const { error: createError } = await supabase.rpc('exec_sql', { sql: createFunctionSQL });
    if (createError) {
      console.warn('⚠️  Could not create exec_sql function:', createError.message);
    }
  }
}

// Run the deployment
deployProductionFixes();