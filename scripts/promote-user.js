#!/usr/bin/env node

/**
 * User Promotion Script
 * This script promotes a user to super admin role
 * 
 * Usage:
 * node scripts/promote-user.js <user-email>
 * 
 * Environment Variables Required:
 * - SUPABASE_URL: Your Supabase project URL
 * - SUPABASE_SERVICE_ROLE_KEY: Your Supabase service role key
 */

import { createClient } from '@supabase/supabase-js';

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://elhbthnvwcqewjpwulhq.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  console.log('Please set your Supabase service role key:');
  console.log('export SUPABASE_SERVICE_ROLE_KEY=your_service_role_key');
  process.exit(1);
}

// Get user email from command line arguments
const userEmail = process.argv[2];

if (!userEmail) {
  console.error('❌ Error: User email is required');
  console.log('Usage: node scripts/promote-user.js <user-email>');
  console.log('Example: node scripts/promote-user.js admin@example.com');
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function promoteUser() {
  console.log('🔧 Crux User Promotion Tool');
  console.log('===========================');
  console.log(`📧 Promoting user: ${userEmail}`);
  console.log(`📡 Connecting to: ${SUPABASE_URL}`);

  try {
    // First, check if the user exists in auth.users
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserByEmail(userEmail);

    if (authError) {
      console.error('❌ Error finding user:', authError.message);
      process.exit(1);
    }

    if (!authUser.user) {
      console.error('❌ User not found in auth.users table');
      console.log('Please make sure the user has signed up first.');
      process.exit(1);
    }

    console.log('✅ User found in auth.users:', authUser.user.id);

    // Check if profile exists
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.user.id)
      .single();

    if (profileError) {
      console.error('❌ Error finding profile:', profileError.message);
      process.exit(1);
    }

    if (!profile) {
      console.error('❌ Profile not found for user');
      console.log('Creating profile...');
      
      // Create profile
      const { error: createError } = await supabase
        .from('profiles')
        .insert({
          id: authUser.user.id,
          role: 'super_admin',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (createError) {
        console.error('❌ Error creating profile:', createError.message);
        process.exit(1);
      }

      console.log('✅ Profile created with super_admin role');
    } else {
      console.log('✅ Profile found, current role:', profile.role);

      // Update existing profile to super_admin
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          role: 'super_admin',
          updated_at: new Date().toISOString()
        })
        .eq('id', authUser.user.id);

      if (updateError) {
        console.error('❌ Error updating profile:', updateError.message);
        process.exit(1);
      }

      console.log('✅ Profile updated to super_admin role');
    }

    // Log the action
    const { error: logError } = await supabase
      .from('audit_logs')
      .insert({
        user_id: authUser.user.id,
        action: 'user_promoted',
        resource_type: 'user',
        resource_id: authUser.user.id,
        details: {
          promoted_to: 'super_admin',
          promoted_by: 'system',
          user_email: userEmail
        }
      });

    if (logError) {
      console.warn('⚠️  Warning: Could not log the action:', logError.message);
    } else {
      console.log('✅ Action logged in audit_logs');
    }

    console.log('');
    console.log('🎉 User promotion completed successfully!');
    console.log('');
    console.log('User details:');
    console.log(`- Email: ${userEmail}`);
    console.log(`- User ID: ${authUser.user.id}`);
    console.log(`- Role: super_admin`);
    console.log('');
    console.log('The user can now:');
    console.log('- Access the master dashboard');
    console.log('- Create and manage tenants');
    console.log('- View platform analytics');
    console.log('- Manage system settings');

  } catch (error) {
    console.error('❌ Promotion failed:', error.message);
    process.exit(1);
  }
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});

// Run the promotion
promoteUser().catch((error) => {
  console.error('❌ Promotion failed:', error);
  process.exit(1);
});