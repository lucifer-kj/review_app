// Script to clean up orphaned users that might be causing duplicate key errors
import { createClient } from '@supabase/supabase-js';

// You'll need to set these environment variables or replace with actual values
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://elhbthnvwcqewjpwulhq.supabase.co';
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || 'your_service_role_key_here';

if (supabaseServiceKey === 'your_service_role_key_here') {
  console.log('❌ Please set VITE_SUPABASE_SERVICE_ROLE_KEY environment variable');
  console.log('   Or replace the service key in this script with your actual service role key');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function cleanupOrphanedUsers() {
  console.log('🧹 Starting cleanup of orphaned users...\n');

  try {
    // Get all auth users
    console.log('📋 Fetching auth users...');
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000
    });

    if (authError) {
      console.error('❌ Error fetching auth users:', authError);
      return;
    }

    console.log(`📊 Found ${authUsers?.users?.length || 0} auth users`);

    // Get all profile IDs
    console.log('📋 Fetching profiles...');
    const { data: profiles, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, email');

    if (profileError) {
      console.error('❌ Error fetching profiles:', profileError);
      return;
    }

    console.log(`📊 Found ${profiles?.length || 0} profiles`);

    const profileIds = new Set(profiles?.map(p => p.id) || []);
    const profileEmails = new Set(profiles?.map(p => p.email) || []);
    let orphanedCount = 0;
    let cleanedCount = 0;

    console.log('\n🔍 Checking for orphaned users...\n');

    // Find orphaned users
    for (const user of authUsers?.users || []) {
      const isOrphaned = !profileIds.has(user.id);
      const hasDuplicateEmail = profileEmails.has(user.email);
      
      if (isOrphaned) {
        orphanedCount++;
        console.log(`🔍 Orphaned user found: ${user.email} (ID: ${user.id})`);
        
        if (hasDuplicateEmail) {
          console.log(`   ⚠️  Email ${user.email} exists in profiles table but with different ID`);
        }
        
        // Ask for confirmation before deleting
        console.log(`   🗑️  Would delete this orphaned user`);
      }
    }

    if (orphanedCount === 0) {
      console.log('✅ No orphaned users found!');
      return;
    }

    console.log(`\n📊 Summary:`);
    console.log(`   - Total auth users: ${authUsers?.users?.length || 0}`);
    console.log(`   - Total profiles: ${profiles?.length || 0}`);
    console.log(`   - Orphaned users: ${orphanedCount}`);

    // For safety, we'll just report what would be cleaned up
    console.log('\n⚠️  This script is in report-only mode for safety.');
    console.log('   To actually clean up users, uncomment the deletion code below.');

    // Uncomment the following lines to actually delete orphaned users:
    /*
    console.log('\n🗑️  Cleaning up orphaned users...');
    for (const user of authUsers?.users || []) {
      if (!profileIds.has(user.id)) {
        try {
          await supabaseAdmin.auth.admin.deleteUser(user.id);
          cleanedCount++;
          console.log(`✅ Deleted orphaned user: ${user.email}`);
        } catch (deleteError) {
          console.error(`❌ Failed to delete user ${user.email}:`, deleteError);
        }
      }
    }
    console.log(`\n✅ Cleanup complete! Deleted ${cleanedCount} orphaned users.`);
    */

  } catch (error) {
    console.error('💥 Error during cleanup:', error);
  }
}

// Run the cleanup
cleanupOrphanedUsers().then(() => {
  console.log('\n🏁 Cleanup script completed!');
}).catch(error => {
  console.error('💥 Script crashed:', error);
});
