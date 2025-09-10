// Script to check super admin user and fix authentication issues
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://elhbthnvwcqewjpwulhq.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsbGJ0aG52d2NxZXdqcHd1bGhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYwNzQ4MDAsImV4cCI6MjA1MTY1MDgwMH0.8QZqJqJqJqJqJqJqJqJqJqJqJqJqJqJqJqJqJqJqJq';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSuperAdmin() {
  console.log('🔍 Checking Super Admin Status...\n');

  try {
    // Check if the email exists in auth.users
    const email = 'info@alphabusinessdesigns.com';
    console.log(`📧 Checking user with email: ${email}`);

    // First, let's check all users in profiles table
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (profilesError) {
      console.error('❌ Error fetching profiles:', profilesError);
      return;
    }

    console.log(`\n📊 Found ${profiles.length} profiles:`);
    profiles.forEach((profile, index) => {
      console.log(`${index + 1}. ID: ${profile.id}, Role: ${profile.role}, Email: ${profile.email || 'N/A'}`);
    });

    // Check for super admins
    const superAdmins = profiles.filter(p => p.role === 'super_admin');
    console.log(`\n👑 Super Admins found: ${superAdmins.length}`);
    superAdmins.forEach((admin, index) => {
      console.log(`${index + 1}. ID: ${admin.id}, Email: ${admin.email || 'N/A'}`);
    });

    // Check if the specific email exists
    const targetProfile = profiles.find(p => p.email === email);
    if (targetProfile) {
      console.log(`\n✅ Found profile for ${email}:`);
      console.log(`   ID: ${targetProfile.id}`);
      console.log(`   Role: ${targetProfile.role}`);
      console.log(`   Created: ${targetProfile.created_at}`);
      
      if (targetProfile.role !== 'super_admin') {
        console.log(`\n⚠️  User exists but is not a super admin. Current role: ${targetProfile.role}`);
        console.log('🔧 Would you like to promote this user to super admin?');
      } else {
        console.log(`\n✅ User is already a super admin!`);
      }
    } else {
      console.log(`\n❌ No profile found for email: ${email}`);
      console.log('🔧 Would you like to create a super admin profile for this email?');
    }

    // Check auth.users table (this requires service role key)
    console.log('\n🔐 Note: To check auth.users table, you need the service role key.');
    console.log('   This script uses the anon key, so it can only check the profiles table.');

  } catch (error) {
    console.error('💥 Error:', error);
  }
}

// Run the check
checkSuperAdmin().then(() => {
  console.log('\n🏁 Check completed!');
}).catch(error => {
  console.error('💥 Script crashed:', error);
});
