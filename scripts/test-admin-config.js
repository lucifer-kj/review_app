// Test script to verify admin client configuration
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://elhbthnvwcqewjpwulhq.supabase.co';
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || 'your_service_role_key_here';

console.log('🔧 Testing Admin Client Configuration...\n');

console.log('📋 Configuration:');
console.log(`   Supabase URL: ${supabaseUrl}`);
console.log(`   Service Key: ${supabaseServiceKey.substring(0, 20)}...`);

if (supabaseServiceKey === 'your_service_role_key_here') {
  console.log('❌ Service role key not configured!');
  console.log('   Please set VITE_SUPABASE_SERVICE_ROLE_KEY environment variable');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testAdminAccess() {
  try {
    console.log('\n🧪 Testing admin access...');
    
    // Test 1: List users
    console.log('1️⃣ Testing user listing...');
    const { data: users, error: usersError } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 5
    });

    if (usersError) {
      console.error('❌ User listing failed:', usersError);
      return;
    }

    console.log('✅ User listing successful');
    console.log(`   Found ${users?.users?.length || 0} users`);

    // Test 2: Check profiles table
    console.log('\n2️⃣ Testing profiles table access...');
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, role, tenant_id')
      .limit(5);

    if (profilesError) {
      console.error('❌ Profiles access failed:', profilesError);
      return;
    }

    console.log('✅ Profiles access successful');
    console.log(`   Found ${profiles?.length || 0} profiles`);

    // Test 3: Check tenants table
    console.log('\n3️⃣ Testing tenants table access...');
    const { data: tenants, error: tenantsError } = await supabaseAdmin
      .from('tenants')
      .select('id, name, status')
      .limit(5);

    if (tenantsError) {
      console.error('❌ Tenants access failed:', tenantsError);
      return;
    }

    console.log('✅ Tenants access successful');
    console.log(`   Found ${tenants?.length || 0} tenants`);

    console.log('\n🎯 Admin client configuration test: PASSED ✅');
    console.log('   The admin client is properly configured and can access all required resources.');

  } catch (error) {
    console.error('💥 Admin access test failed:', error);
  }
}

// Run the test
testAdminAccess().then(() => {
  console.log('\n🏁 Test completed!');
}).catch(error => {
  console.error('💥 Test script crashed:', error);
});
