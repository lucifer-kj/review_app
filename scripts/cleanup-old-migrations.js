/**
 * Script to clean up old conflicting migration files
 * This script removes old migrations that are now consolidated
 */

import fs from 'fs';
import path from 'path';

const migrationsDir = './supabase/migrations';

// List of migrations to keep (the consolidated one and any future ones)
const migrationsToKeep = [
  '20250110000000_consolidated_database_schema.sql', // Our new consolidated migration
];

// List of migrations to remove (all the old conflicting ones)
const migrationsToRemove = [
  '20250101000000_create_business_settings.sql',
  '20250101000001_fix_reviews_phone_column.sql',
  '20250101000002_fix_rls_policies.sql',
  '20250101000003_remove_invoice_functionality.sql',
  '20250102000000_fix_multi_tenant.sql',
  '20250103000000_recreate_database_schema.sql',
  '20250103000001_fix_anonymous_review_inserts.sql',
  '20250103000002_fix_anonymous_review_inserts_final.sql',
  '20250104000000_implement_multi_tenancy.sql',
  '20250104000001_safe_multi_tenancy.sql',
  '20250104000002_enhanced_rls_policies.sql',
  '20250104000003_platform_analytics.sql',
  '20250105000000_update_roles_and_promote_user.sql',
  '20250105000001_safe_role_update.sql',
  '20250105000002_step_by_step_fix.sql',
  '20250105000003_simple_user_promotion.sql',
  '20250105000004_create_platform_analytics_function.sql',
  '20250105000005_add_tenant_review_form_url.sql',
  '20250108000000_fix_invitation_policies.sql',
  '20250109000000_fix_invitation_user_creation.sql',
  '20250829055203_9ea67a6a-8794-44f3-bc79-a1feb4d1315f.sql',
  '20250829055225_80b73282-8794-44f3-bc79-a1feb4d1315f.sql',
  '20250829055413_0d0ea3e2-e512-4a3d-8768-d184f73088e3.sql',
  '20250829055512_9ba6f9af-929b-4b15-86a7-bf7297b7957e.sql',
  '20250830133928_aededa22-7b96-465b-9e9c-73f84235ebbd.sql',
  '20250830133948_32f2c6fc-9692-43eb-bdfe-1229be1b7aa2.sql',
  '20250830134235_f445b18a-86fe-4d32-badb-0e98badf5b0f.sql',
  '20250830134459_3c6e770d-a2f6-44f9-aba0-ecb196fa1a13.sql',
  '20250830134542_369dde6e-0f47-4168-a924-a6b90b8ccaae.sql',
  '20250901051627_29c0b782-cebe-4c23-b855-a232a755684d.sql'
];

async function cleanupMigrations() {
  console.log('🧹 Cleaning up old migration files...\n');

  try {
    // Check if migrations directory exists
    if (!fs.existsSync(migrationsDir)) {
      console.error('❌ Migrations directory not found:', migrationsDir);
      return;
    }

    // Get all migration files
    const allMigrations = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    console.log(`📋 Found ${allMigrations.length} migration files`);

    // Remove old migrations
    let removedCount = 0;
    for (const migration of migrationsToRemove) {
      const filePath = path.join(migrationsDir, migration);
      
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
          console.log(`✅ Removed: ${migration}`);
          removedCount++;
        } catch (error) {
          console.error(`❌ Failed to remove ${migration}:`, error.message);
        }
      } else {
        console.log(`⚠️  Not found: ${migration}`);
      }
    }

    // List remaining migrations
    const remainingMigrations = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    console.log(`\n📊 Cleanup Summary:`);
    console.log(`   Removed: ${removedCount} files`);
    console.log(`   Remaining: ${remainingMigrations.length} files`);

    if (remainingMigrations.length > 0) {
      console.log(`\n📁 Remaining migrations:`);
      remainingMigrations.forEach(migration => {
        console.log(`   - ${migration}`);
      });
    }

    // Verify consolidated migration exists
    const consolidatedMigration = '20250110000000_consolidated_database_schema.sql';
    if (remainingMigrations.includes(consolidatedMigration)) {
      console.log(`\n✅ Consolidated migration found: ${consolidatedMigration}`);
    } else {
      console.log(`\n❌ Consolidated migration not found: ${consolidatedMigration}`);
    }

    console.log('\n🎉 Migration cleanup completed!');
    console.log('\n📝 Next steps:');
    console.log('   1. Apply the consolidated migration to your database');
    console.log('   2. Test the application to ensure everything works');
    console.log('   3. Remove this cleanup script if no longer needed');

  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  }
}

// Run the cleanup
cleanupMigrations();
