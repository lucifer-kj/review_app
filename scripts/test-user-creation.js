// Test script to verify user creation functionality
import { createClient } from '@supabase/supabase-js';

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

async function testUserCreation() {
  console.log('🧪 Testing User Creation Functionality...\n');

  try {
    // Test 1: Check if we can access the profiles table
    console.log('1️⃣ Testing database access...');
    const { data: profiles, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, role, tenant_id')
      .limit(5);

    if (profileError) {
      console.error('❌ Database access failed:', profileError);
      return;
    }

    console.log('✅ Database access successful');
    console.log(`   Found ${profiles?.length || 0} existing profiles`);

    // Test 2: Check if we can access auth users
    console.log('\n2️⃣ Testing auth access...');
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 5
    });

    if (authError) {
      console.error('❌ Auth access failed:', authError);
      return;
    }

    console.log('✅ Auth access successful');
    console.log(`   Found ${authUsers?.users?.length || 0} auth users`);

    // Test 3: Check if we can access tenants
    console.log('\n3️⃣ Testing tenant access...');
    const { data: tenants, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .select('id, name, status')
      .limit(5);

    if (tenantError) {
      console.error('❌ Tenant access failed:', tenantError);
      return;
    }

    console.log('✅ Tenant access successful');
    console.log(`   Found ${tenants?.length || 0} tenants`);
    if (tenants && tenants.length > 0) {
      console.log('   Available tenants:');
      tenants.forEach(tenant => {
        console.log(`     - ${tenant.name} (${tenant.id}) - ${tenant.status}`);
      });
    }

    // Test 4: Simulate user creation (without actually creating)
    console.log('\n4️⃣ Testing user creation simulation...');
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';
    const testFullName = 'Test User';
    const testRole = 'user';
    const testTenantId = tenants && tenants.length > 0 ? tenants[0].id : null;

    console.log('   Test data:');
    console.log(`     Email: ${testEmail}`);
    console.log(`     Full Name: ${testFullName}`);
    console.log(`     Role: ${testRole}`);
    console.log(`     Tenant ID: ${testTenantId || 'None'}`);

    // Check if user already exists
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id, email')
      .eq('email', testEmail)
      .single();

    if (existingProfile) {
      console.log('   ⚠️  Test user already exists, skipping creation test');
    } else {
      console.log('   ✅ Test user does not exist, ready for creation');
    }

    console.log('\n🎯 Test Summary:');
    console.log('   ✅ Database access: Working');
    console.log('   ✅ Auth access: Working');
    console.log('   ✅ Tenant access: Working');
    console.log('   ✅ User creation simulation: Ready');
    
    console.log('\n💡 Next Steps:');
    console.log('   1. Try creating a user through the master dashboard');
    console.log('   2. Check the browser console for detailed logs');
    console.log('   3. Verify the user appears in both auth.users and profiles tables');

  } catch (error) {
    console.error('💥 Test failed:', error);
  }
}

// Run the test
testUserCreation().then(() => {
  console.log('\n🏁 Test completed!');
}).catch(error => {
  console.error('💥 Test script crashed:', error);
});