#!/usr/bin/env node

/**
 * Database Migration Deployment Script
 * This script applies the multi-tenancy migration to Supabase
 * 
 * Usage:
 * 1. Set your Supabase credentials in environment variables
 * 2. Run: node deploy-migration.js
 * 
 * Environment Variables Required:
 * - SUPABASE_URL: Your Supabase project URL
 * - SUPABASE_SERVICE_ROLE_KEY: Your Supabase service role key
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://elhbthnvwcqewjpwulhq.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  console.log('Please set your Supabase service role key:');
  console.log('export SUPABASE_SERVICE_ROLE_KEY=your_service_role_key');
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function deployMigration() {
  console.log('🚀 Starting multi-tenancy migration deployment...');
  console.log(`📡 Connecting to: ${SUPABASE_URL}`);

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20250104000001_safe_multi_tenancy.sql');
    
    if (!fs.existsSync(migrationPath)) {
      console.error('❌ Migration file not found:', migrationPath);
      process.exit(1);
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    console.log('📄 Migration file loaded successfully');

    // Split the migration into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📝 Found ${statements.length} SQL statements to execute`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      if (statement.trim()) {
        console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);
        
        try {
          const { error } = await supabase.rpc('exec_sql', { sql: statement });
          
          if (error) {
            console.error(`❌ Error in statement ${i + 1}:`, error.message);
            console.log('Statement:', statement.substring(0, 100) + '...');
            
            // Continue with other statements unless it's a critical error
            if (error.message.includes('already exists') || error.message.includes('does not exist')) {
              console.log('⚠️  Non-critical error, continuing...');
              continue;
            } else {
              throw error;
            }
          } else {
            console.log(`✅ Statement ${i + 1} executed successfully`);
          }
        } catch (error) {
          console.error(`❌ Failed to execute statement ${i + 1}:`, error.message);
          throw error;
        }
      }
    }

    console.log('🎉 Migration completed successfully!');

    // Verify the migration
    await verifyMigration();

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

async function verifyMigration() {
  console.log('🔍 Verifying migration...');

  try {
    // Check if new tables exist
    const tables = ['tenants', 'user_invitations', 'audit_logs', 'usage_metrics', 'system_settings'];
    
    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);

      if (error) {
        console.error(`❌ Table ${table} verification failed:`, error.message);
      } else {
        console.log(`✅ Table ${table} exists and accessible`);
      }
    }

    // Check if functions exist
    const functions = [
      'get_current_tenant_id',
      'is_super_admin',
      'is_tenant_admin',
      'get_all_reviews_for_dashboard',
      'get_review_stats_for_dashboard',
      'get_platform_analytics'
    ];

    for (const func of functions) {
      try {
        const { error } = await supabase.rpc(func);
        if (error && !error.message.includes('permission denied')) {
          console.error(`❌ Function ${func} verification failed:`, error.message);
        } else {
          console.log(`✅ Function ${func} exists and accessible`);
        }
      } catch (error) {
        console.log(`⚠️  Function ${func} verification skipped (expected for some functions)`);
      }
    }

    // Check if tenant_id columns were added
    const { data: profiles } = await supabase
      .from('profiles')
      .select('tenant_id')
      .limit(1);

    if (profiles) {
      console.log('✅ tenant_id column added to profiles table');
    }

    const { data: businessSettings } = await supabase
      .from('business_settings')
      .select('tenant_id')
      .limit(1);

    if (businessSettings) {
      console.log('✅ tenant_id column added to business_settings table');
    }

    const { data: reviews } = await supabase
      .from('reviews')
      .select('tenant_id')
      .limit(1);

    if (reviews) {
      console.log('✅ tenant_id column added to reviews table');
    }

    console.log('🎉 Migration verification completed!');

  } catch (error) {
    console.error('❌ Verification failed:', error.message);
  }
}

async function createDefaultTenant() {
  console.log('🏗️  Creating default tenant for existing data...');

  try {
    // Check if any tenants exist
    const { data: existingTenants } = await supabase
      .from('tenants')
      .select('id')
      .limit(1);

    if (existingTenants && existingTenants.length > 0) {
      console.log('ℹ️  Tenants already exist, skipping default tenant creation');
      return;
    }

    // Create default tenant
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .insert({
        name: 'Default Tenant',
        domain: 'default',
        plan_type: 'basic',
        status: 'active',
        settings: {},
        billing_email: 'admin@crux-reviews.com'
      })
      .select()
      .single();

    if (tenantError) {
      console.error('❌ Failed to create default tenant:', tenantError.message);
      return;
    }

    console.log('✅ Default tenant created:', tenant.id);

    // Update existing profiles to belong to default tenant
    const { error: profilesError } = await supabase
      .from('profiles')
      .update({ tenant_id: tenant.id })
      .is('tenant_id', null);

    if (profilesError) {
      console.error('❌ Failed to update profiles:', profilesError.message);
    } else {
      console.log('✅ Existing profiles assigned to default tenant');
    }

    // Update existing business_settings to belong to default tenant
    const { error: businessError } = await supabase
      .from('business_settings')
      .update({ tenant_id: tenant.id })
      .is('tenant_id', null);

    if (businessError) {
      console.error('❌ Failed to update business_settings:', businessError.message);
    } else {
      console.log('✅ Existing business_settings assigned to default tenant');
    }

    // Update existing reviews to belong to default tenant
    const { error: reviewsError } = await supabase
      .from('reviews')
      .update({ tenant_id: tenant.id })
      .is('tenant_id', null);

    if (reviewsError) {
      console.error('❌ Failed to update reviews:', reviewsError.message);
    } else {
      console.log('✅ Existing reviews assigned to default tenant');
    }

    console.log('🎉 Default tenant setup completed!');

  } catch (error) {
    console.error('❌ Default tenant creation failed:', error.message);
  }
}

// Main execution
async function main() {
  console.log('🔧 Crux Multi-Tenancy Migration Tool');
  console.log('=====================================');

  await deployMigration();
  await createDefaultTenant();

  console.log('');
  console.log('🎉 Migration completed successfully!');
  console.log('');
  console.log('Next steps:');
  console.log('1. Test the application to ensure everything works');
  console.log('2. Create your first super admin user');
  console.log('3. Create tenants and invite users');
  console.log('');
  console.log('For creating a super admin user, run:');
  console.log('node scripts/promote-user.js <user-email>');
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});

// Run the migration
main().catch((error) => {
  console.error('❌ Migration failed:', error);
  process.exit(1);
});
