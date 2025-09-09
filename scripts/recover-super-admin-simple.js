// Simple Super Admin Recovery Script
// Run this with: node scripts/recover-super-admin-simple.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables. Please check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function recoverSuperAdmin() {
  try {
    console.log('🔍 Starting super admin recovery...');
    
    // Your email - update this if different
    const yourEmail = '321arifali@gmail.com';
    
    // Step 1: Get your user from auth.users
    console.log('📋 Step 1: Finding your user in auth.users...');
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.error('❌ Error fetching users:', usersError.message);
      return;
    }
    
    const yourUser = users.users.find(user => user.email === yourEmail);
    if (!yourUser) {
      console.error(`❌ User with email ${yourEmail} not found.`);
      console.log('Available users:');
      users.users.forEach(user => console.log(`  - ${user.email}`));
      return;
    }
    
    console.log(`✅ Found user: ${yourUser.email} (${yourUser.id})`);
    
    // Step 2: Check if profile exists
    console.log('📋 Step 2: Checking if profile exists...');
    const { data: existingProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', yourUser.id)
      .single();
    
    if (profileError && profileError.code === 'PGRST116') {
      // Profile doesn't exist, create it
      console.log('📋 Step 3: Creating super admin profile...');
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          id: yourUser.id,
          email: yourUser.email,
          full_name: yourUser.user_metadata?.full_name || 'Super Admin',
          role: 'super_admin',
          tenant_id: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (createError) {
        console.error('❌ Error creating profile:', createError.message);
        return;
      }
      
      console.log('✅ Profile created successfully!');
      console.log('Profile details:', newProfile);
      
    } else if (profileError) {
      console.error('❌ Error checking profile:', profileError.message);
      return;
    } else {
      // Profile exists, update role if needed
      console.log('📋 Step 3: Profile exists, checking role...');
      if (existingProfile.role !== 'super_admin') {
        console.log('🔄 Updating role to super_admin...');
        const { data: updatedProfile, error: updateError } = await supabase
          .from('profiles')
          .update({ 
            role: 'super_admin',
            updated_at: new Date().toISOString()
          })
          .eq('id', yourUser.id)
          .select()
          .single();
        
        if (updateError) {
          console.error('❌ Error updating profile:', updateError.message);
          return;
        }
        
        console.log('✅ Profile updated successfully!');
        console.log('Updated profile:', updatedProfile);
      } else {
        console.log('✅ Profile already has super_admin role');
      }
    }
    
    // Step 4: Final verification
    console.log('📋 Step 4: Final verification...');
    const { data: finalProfile, error: finalError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', yourUser.id)
      .single();
    
    if (finalError) {
      console.error('❌ Error in final verification:', finalError.message);
      return;
    }
    
    console.log('🎉 Super admin access recovered successfully!');
    console.log('\n📊 Final Profile Details:');
    console.log(`  ID: ${finalProfile.id}`);
    console.log(`  Email: ${finalProfile.email}`);
    console.log(`  Role: ${finalProfile.role}`);
    console.log(`  Tenant ID: ${finalProfile.tenant_id || 'None (Super Admin)'}`);
    console.log(`  Created: ${finalProfile.created_at}`);
    console.log(`  Updated: ${finalProfile.updated_at}`);
    
    console.log('\n✅ You can now log in to the master dashboard!');
    console.log(`   Email: ${yourEmail}`);
    console.log('   Role: super_admin');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

// Run the recovery
recoverSuperAdmin();
