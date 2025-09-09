#!/usr/bin/env node

/**
 * Script to update existing user profiles with full_name and email data
 * This will populate the new columns from auth.users data
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please set VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function updateUserProfiles() {
  console.log('🔄 Updating user profiles with auth data...\n');

  try {
    // Get all profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, email');

    if (profilesError) {
      console.error('❌ Failed to fetch profiles:', profilesError.message);
      return;
    }

    console.log(`📊 Found ${profiles.length} profiles to update`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const profile of profiles) {
      try {
        // Get auth user data
        const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(profile.id);
        
        if (authError) {
          console.warn(`⚠️  Failed to fetch auth data for user ${profile.id}:`, authError.message);
          skippedCount++;
          continue;
        }

        if (!authUser?.user?.email) {
          console.warn(`⚠️  No email found for user ${profile.id}`);
          skippedCount++;
          continue;
        }

        const email = authUser.user.email;
        const fullName = authUser.user.user_metadata?.full_name || 
                        authUser.user.user_metadata?.name || 
                        email.split('@')[0];

        // Check if profile needs updating
        const needsUpdate = !profile.full_name || !profile.email || 
                           profile.full_name !== fullName || 
                           profile.email !== email;

        if (!needsUpdate) {
          console.log(`⏭️  Skipping ${email} - already up to date`);
          skippedCount++;
          continue;
        }

        // Update profile
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            full_name: fullName,
            email: email,
          })
          .eq('id', profile.id);

        if (updateError) {
          console.error(`❌ Failed to update profile for ${email}:`, updateError.message);
          skippedCount++;
          continue;
        }

        console.log(`✅ Updated profile for ${email} (${fullName})`);
        updatedCount++;

      } catch (error) {
        console.error(`❌ Error processing user ${profile.id}:`, error.message);
        skippedCount++;
      }
    }

    console.log('\n📊 Update Summary:');
    console.log(`  ✅ Updated: ${updatedCount} profiles`);
    console.log(`  ⏭️  Skipped: ${skippedCount} profiles`);
    console.log(`  📊 Total: ${profiles.length} profiles`);

    if (updatedCount > 0) {
      console.log('\n🎉 User profiles updated successfully!');
      console.log('The TenantUserManager should now display user names and emails properly.');
    } else {
      console.log('\nℹ️  No profiles needed updating.');
    }

  } catch (error) {
    console.error('❌ Error updating user profiles:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the update
updateUserProfiles().catch(console.error);
