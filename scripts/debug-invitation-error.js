/**
 * Debug Invitation Error Script
 * This script helps identify the exact cause of invitation creation failures
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

// Create clients
const supabase = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function debugInvitationError() {
  console.log('🔍 Debugging Invitation Error...\n');

  try {
    // Test 1: Check current user authentication
    console.log('1️⃣ Checking User Authentication...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.log('   ❌ Auth error:', authError.message);
    } else if (user) {
      console.log('   ✅ User authenticated:', user.email);
    } else {
      console.log('   ⚠️  No user authenticated');
    }

    // Test 2: Check if we can access user_invitations table
    console.log('\n2️⃣ Testing user_invitations table access...');
    try {
      const { data, error } = await supabase
        .from('user_invitations')
        .select('*')
        .limit(1);
      
      if (error) {
        console.log('   ❌ Table access error:', error.message);
        console.log('   📝 Error code:', error.code);
        console.log('   📝 Error details:', error.details);
      } else {
        console.log('   ✅ Table accessible');
      }
    } catch (err) {
      console.log('   ❌ Table access failed:', err.message);
    }

    // Test 3: Check if we can access tenants table
    console.log('\n3️⃣ Testing tenants table access...');
    try {
      const { data: tenants, error } = await supabase
        .from('tenants')
        .select('id, name')
        .limit(5);
      
      if (error) {
        console.log('   ❌ Tenants access error:', error.message);
      } else {
        console.log('   ✅ Tenants accessible, count:', tenants?.length || 0);
        if (tenants && tenants.length > 0) {
          console.log('   📋 Available tenants:');
          tenants.forEach(tenant => {
            console.log(`      - ${tenant.name} (${tenant.id})`);
          });
        }
      }
    } catch (err) {
      console.log('   ❌ Tenants access failed:', err.message);
    }

    // Test 4: Try to create a test invitation (dry run)
    console.log('\n4️⃣ Testing invitation creation...');
    const testEmail = `debug-test-${Date.now()}@example.com`;
    const testTenantId = '00000000-0000-0000-0000-000000000000'; // Dummy UUID
    
    try {
      // First check if tenant exists
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .select('id, name')
        .eq('id', testTenantId)
        .single();

      if (tenantError) {
        console.log('   ⚠️  Test tenant not found (expected)');
        // Use first available tenant
        const { data: firstTenant } = await supabase
          .from('tenants')
          .select('id, name')
          .limit(1)
          .single();
        
        if (firstTenant) {
          console.log('   📝 Using first available tenant:', firstTenant.name);
          testTenantId = firstTenant.id;
        }
      }

      // Try to create invitation
      const { data: invitation, error: invitationError } = await supabase
        .from('user_invitations')
        .insert({
          tenant_id: testTenantId,
          email: testEmail,
          role: 'user',
          invited_by: user?.id || null,
          token: 'debug-token-' + Date.now(),
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .select()
        .single();

      if (invitationError) {
        console.log('   ❌ Invitation creation failed:');
        console.log('   📝 Error message:', invitationError.message);
        console.log('   📝 Error code:', invitationError.code);
        console.log('   📝 Error details:', invitationError.details);
        console.log('   📝 Error hint:', invitationError.hint);
      } else {
        console.log('   ✅ Invitation created successfully');
        
        // Clean up test invitation
        await supabase
          .from('user_invitations')
          .delete()
          .eq('id', invitation.id);
        console.log('   🧹 Test invitation cleaned up');
      }
    } catch (err) {
      console.log('   ❌ Invitation test failed:', err.message);
    }

    // Test 5: Check RLS policies
    console.log('\n5️⃣ Checking RLS policies...');
    try {
      const { data: policies, error: policyError } = await supabaseAdmin
        .from('pg_policies')
        .select('*')
        .eq('tablename', 'user_invitations');

      if (policyError) {
        console.log('   ⚠️  Could not check RLS policies:', policyError.message);
      } else {
        console.log('   📋 RLS policies for user_invitations:');
        policies.forEach(policy => {
          console.log(`      - ${policy.policyname}: ${policy.cmd}`);
        });
      }
    } catch (err) {
      console.log('   ⚠️  RLS policy check failed:', err.message);
    }

    // Test 6: Check admin client configuration
    console.log('\n6️⃣ Testing admin client...');
    try {
      const { data: adminUsers, error: adminError } = await supabaseAdmin.auth.admin.listUsers();
      
      if (adminError) {
        console.log('   ❌ Admin client error:', adminError.message);
      } else {
        console.log('   ✅ Admin client working, users count:', adminUsers?.users?.length || 0);
      }
    } catch (err) {
      console.log('   ❌ Admin client failed:', err.message);
    }

    console.log('\n🎯 Debug Summary:');
    console.log('   Check the errors above to identify the root cause.');
    console.log('   Common issues:');
    console.log('   - RLS policies blocking access');
    console.log('   - Missing or invalid tenant_id');
    console.log('   - Authentication issues');
    console.log('   - Database schema problems');

  } catch (error) {
    console.error('❌ Debug script failed:', error);
  }
}

// Run the debug
debugInvitationError().then(() => {
  console.log('\n🏁 Debug completed!');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Debug script crashed:', error);
  process.exit(1);
});
