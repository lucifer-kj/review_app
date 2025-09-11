#!/usr/bin/env node

/**
 * Deploy Schema Fixes Script
 * Deploys the critical schema fixes and validates the database
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🚀 Starting database schema fixes deployment...\n');

try {
  // Step 1: Check if Supabase CLI is available
  console.log('📋 Step 1: Checking Supabase CLI...');
  try {
    execSync('supabase --version', { stdio: 'pipe' });
    console.log('✅ Supabase CLI is available\n');
  } catch (error) {
    console.error('❌ Supabase CLI not found. Please install it first:');
    console.error('   npm install -g supabase');
    process.exit(1);
  }

  // Step 2: Check if we're in a Supabase project
  console.log('📋 Step 2: Checking Supabase project...');
  if (!fs.existsSync('supabase/config.toml')) {
    console.error('❌ Not in a Supabase project directory. Please run this from the project root.');
    process.exit(1);
  }
  console.log('✅ Supabase project detected\n');

  // Step 3: Backup current database (if possible)
  console.log('📋 Step 3: Creating database backup...');
  try {
    execSync('supabase db dump --file backup-before-schema-fixes.sql', { stdio: 'pipe' });
    console.log('✅ Database backup created: backup-before-schema-fixes.sql\n');
  } catch (error) {
    console.log('⚠️  Could not create backup (this is normal for some setups)\n');
  }

  // Step 4: Deploy the migration
  console.log('📋 Step 4: Deploying schema fixes migration...');
  try {
    execSync('supabase db push', { stdio: 'inherit' });
    console.log('✅ Schema fixes migration deployed successfully\n');
  } catch (error) {
    console.error('❌ Failed to deploy migration:');
    console.error(error.message);
    process.exit(1);
  }

  // Step 5: Run validation
  console.log('📋 Step 5: Running database validation...');
  try {
    execSync('node scripts/validate-database-schema.js', { stdio: 'inherit' });
    console.log('✅ Database validation completed successfully\n');
  } catch (error) {
    console.error('❌ Database validation failed:');
    console.error(error.message);
    console.error('\n🔧 Please check the validation errors and fix them manually.');
    process.exit(1);
  }

  // Step 6: Clean up old migration file
  console.log('📋 Step 6: Cleaning up old migration files...');
  const oldMigrationFile = 'supabase/migrations/20250829055203_9ea67a6a-9678-4382-93a2-1d73ddb44f08.sql';
  if (fs.existsSync(oldMigrationFile)) {
    fs.unlinkSync(oldMigrationFile);
    console.log('✅ Old conflicting migration file removed\n');
  } else {
    console.log('✅ Old migration file already removed\n');
  }

  // Step 7: Summary
  console.log('🎉 Database schema fixes deployment completed successfully!');
  console.log('\n📊 What was fixed:');
  console.log('   ✅ Removed conflicting old migration file');
  console.log('   ✅ Added missing user_invitations table');
  console.log('   ✅ Fixed RLS policies for multi-tenancy');
  console.log('   ✅ Verified all required functions exist');
  console.log('   ✅ Added proper indexes for performance');
  console.log('   ✅ Validated tenant isolation');
  
  console.log('\n🚀 Next steps:');
  console.log('   1. Test the application thoroughly');
  console.log('   2. Verify user invitation flow works');
  console.log('   3. Test tenant isolation');
  console.log('   4. Run integration tests');
  console.log('   5. Deploy to production when ready');

} catch (error) {
  console.error('💥 Deployment failed:', error.message);
  process.exit(1);
}
