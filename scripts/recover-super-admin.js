import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables:');
  console.error('VITE_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('VITE_SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌');
  process.exit(1);
}

// Create Supabase admin client
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function recoverSuperAdmin() {
  try {
    console.log('🔍 Checking current user...');
    
    // Get your user ID from auth.users
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.error('❌ Error fetching users:', usersError);
      return;
    }
    
    console.log(`📊 Found ${users.users.length} users in auth.users`);
    
    // Find your user by email
    const yourEmail = '321arifali@gmail.com'; // Update this with your email
    const yourUser = users.users.find(user => user.email === yourEmail);
    
    if (!yourUser) {
      console.error(`❌ User with email ${yourEmail} not found in auth.users`);
      console.log('Available users:');
      users.users.forEach(user => {
        console.log(`  - ${user.email} (${user.id})`);
      });
      return;
    }
    
    console.log(`✅ Found user: ${yourUser.email} (${yourUser.id})`);
    
    // Check if profile exists
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', yourUser.id)
      .single();
    
    if (profileError && profileError.code === 'PGRST116') {
      console.log('❌ Profile not found, creating one...');
      
      // Create profile with super_admin role
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          id: yourUser.id,
          email: yourUser.email,
          full_name: yourUser.user_metadata?.full_name || 'Super Admin',
          role: 'super_admin',
          tenant_id: null, // Super admin doesn't need tenant_id
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (createError) {
        console.error('❌ Error creating profile:', createError);
        return;
      }
      
      console.log('✅ Profile created successfully:', newProfile);
      
    } else if (profileError) {
      console.error('❌ Error checking profile:', profileError);
      return;
    } else {
      console.log('✅ Profile exists:', profile);
      
      // Update role to super_admin if not already
      if (profile.role !== 'super_admin') {
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
          console.error('❌ Error updating profile:', updateError);
          return;
        }
        
        console.log('✅ Profile updated successfully:', updatedProfile);
      } else {
        console.log('✅ User is already super_admin');
      }
    }
    
    // Verify the final state
    const { data: finalProfile, error: finalError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', yourUser.id)
      .single();
    
    if (finalError) {
      console.error('❌ Error verifying final profile:', finalError);
      return;
    }
    
    console.log('🎉 Super admin access recovered!');
    console.log('Final profile:', finalProfile);
    console.log('\nYou can now log in with:');
    console.log(`Email: ${yourUser.email}`);
    console.log('Role: super_admin');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the recovery
recoverSuperAdmin();
