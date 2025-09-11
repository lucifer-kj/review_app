#!/usr/bin/env node

/**
 * Cleanup Conflicting Migrations Script
 * Identifies and removes conflicting migration files that cause RLS policy conflicts
 */

import fs from 'fs';
import path from 'path';

console.log('🧹 Starting cleanup of conflicting migration files...\n');

// List of conflicting migration files to remove
const conflictingMigrations = [
  '20250111000000_fix_rls_conflicts.sql',
  '20250111000001_simple_rls_fix.sql',
  '20250111000002_fix_missing_functions.sql',
  '20250111000003_complete_rls_fix.sql',
  '20250115000000_update_profiles_table.sql',
  '20250115000001_fix_rls_policies_comprehensive.sql',
  '20250115000001_fix_ambiguous_column_reference.sql',
  '20250115000002_create_missing_functions.sql',
  '20250115000003_fix_role_consistency.sql',
  '20250115000004_fix_tenant_assignment.sql'
];

// List of migration files to keep (the clean ones)
const keepMigrations = [
  '20250110000000_consolidated_database_schema.sql',
  '20250110000001_disable_public_signup.sql',
  '20250110000002_fix_invitation_rls_policies.sql',
  '20250110000003_fix_user_creation_trigger.sql',
  '20250110000004_simplified_magic_link_trigger.sql',
  '20250115000000_fix_public_review_access.sql',
  '20250116000000_fix_critical_schema_issues.sql',
  '20250116000001_resolve_rls_policy_conflicts.sql'
];

const migrationsDir = 'supabase/migrations';

try {
  // Check if migrations directory exists
  if (!fs.existsSync(migrationsDir)) {
    console.error('❌ Migrations directory not found:', migrationsDir);
    process.exit(1);
  }

  // Get all migration files
  const allMigrations = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort();

  console.log('📋 Found migration files:');
  allMigrations.forEach(file => {
    const isConflicting = conflictingMigrations.includes(file);
    const isKeep = keepMigrations.includes(file);
    const status = isConflicting ? '❌ CONFLICTING' : isKeep ? '✅ KEEP' : '⚠️  UNKNOWN';
    console.log(`   ${status} ${file}`);
  });

  console.log('\n🔍 Analyzing conflicts...');

  // Find conflicting files that exist
  const existingConflicting = conflictingMigrations.filter(file => 
    fs.existsSync(path.join(migrationsDir, file))
  );

  if (existingConflicting.length === 0) {
    console.log('✅ No conflicting migration files found. Cleanup not needed.');
    process.exit(0);
  }

  console.log(`\n🚨 Found ${existingConflicting.length} conflicting migration files:`);
  existingConflicting.forEach(file => {
    console.log(`   - ${file}`);
  });

  // Create backup directory
  const backupDir = 'supabase/migrations/backup-conflicting';
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
    console.log(`\n📁 Created backup directory: ${backupDir}`);
  }

  // Move conflicting files to backup
  console.log('\n🔄 Moving conflicting files to backup...');
  existingConflicting.forEach(file => {
    const sourcePath = path.join(migrationsDir, file);
    const backupPath = path.join(backupDir, file);
    
    try {
      fs.copyFileSync(sourcePath, backupPath);
      fs.unlinkSync(sourcePath);
      console.log(`   ✅ Moved ${file} to backup`);
    } catch (error) {
      console.error(`   ❌ Failed to move ${file}:`, error.message);
    }
  });

  // Verify cleanup
  const remainingMigrations = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort();

  console.log('\n📊 Cleanup Summary:');
  console.log(`   🗑️  Removed: ${existingConflicting.length} conflicting files`);
  console.log(`   📁 Backed up to: ${backupDir}`);
  console.log(`   📋 Remaining: ${remainingMigrations.length} migration files`);

  console.log('\n✅ Remaining migration files:');
  remainingMigrations.forEach(file => {
    console.log(`   - ${file}`);
  });

  // Check for any remaining conflicts
  const remainingConflicting = remainingMigrations.filter(file => 
    conflictingMigrations.includes(file)
  );

  if (remainingConflicting.length > 0) {
    console.log('\n⚠️  Warning: Some conflicting files still remain:');
    remainingConflicting.forEach(file => {
      console.log(`   - ${file}`);
    });
  } else {
    console.log('\n🎉 All conflicting migration files have been removed!');
  }

  // Create summary report
  const report = {
    timestamp: new Date().toISOString(),
    removedFiles: existingConflicting,
    remainingFiles: remainingMigrations,
    backupLocation: backupDir
  };

  fs.writeFileSync(
    path.join(backupDir, 'cleanup-report.json'),
    JSON.stringify(report, null, 2)
  );

  console.log(`\n📄 Cleanup report saved to: ${path.join(backupDir, 'cleanup-report.json')}`);

  console.log('\n🚀 Next steps:');
  console.log('   1. Deploy the clean migration: npm run fix-schema');
  console.log('   2. Run validation: npm run validate-schema');
  console.log('   3. Test the application thoroughly');
  console.log('   4. If issues occur, restore from backup');

} catch (error) {
  console.error('💥 Cleanup failed:', error.message);
  process.exit(1);
}
