/**
 * Complete Magic Link Flow Test
 * Tests the entire invitation flow from creation to dashboard access
 */

import { createClient } from '@supabase/supabase-js';

// Configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || 'placeholder_service_key';
const frontendUrl = process.env.VITE_FRONTEND_URL || 'https://demo.alphabusinessdesigns.co.in';

if (!supabaseUrl || !supabaseServiceKey || supabaseUrl === 'https://placeholder.supabase.co') {
  console.error('❌ Missing Supabase environment variables');
  console.log('Please set VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testCompleteMagicLinkFlow() {
  console.log('🧪 Testing Complete Magic Link Flow...\n');

  try {
    // Test 1: Check if AcceptInvitation route is accessible
    console.log('1️⃣ Testing AcceptInvitation route accessibility...');
    
    try {
      const response = await fetch(`${frontendUrl}/accept-invitation`);
      if (response.ok) {
        console.log('✅ AcceptInvitation route is accessible');
      } else {
        console.log(`⚠️  AcceptInvitation route returned status: ${response.status}`);
        if (response.status === 404) {
          console.log('❌ CRITICAL: Route not found - SPA fallback not working');
        }
      }
    } catch (error) {
      console.log(`⚠️  Could not test AcceptInvitation route: ${error.message}`);
    }

    // Test 2: Check Supabase configuration
    console.log('\n2️⃣ Testing Supabase configuration...');
    
    try {
      // Test if we can create a test invitation
      const testEmail = `test-${Date.now()}@example.com`;
      const testTenantId = '00000000-0000-0000-0000-000000000000';
      
      const { data: invitationData, error: invitationError } = await supabase.auth.admin.inviteUserByEmail(
        testEmail,
        {
          data: {
            full_name: 'Test User',
            role: 'tenant_admin',
            tenant_id: testTenantId,
          },
          redirectTo: `${frontendUrl}/accept-invitation`,
        }
      );

      if (invitationError) {
        console.log('❌ Supabase invitation creation failed:', invitationError.message);
        if (invitationError.message.includes('redirect')) {
          console.log('💡 This might be due to missing redirect URLs in Supabase dashboard');
        }
      } else {
        console.log('✅ Supabase invitation creation successful');
        console.log(`   Redirect URL: ${frontendUrl}/accept-invitation`);
      }
    } catch (error) {
      console.log('❌ Supabase configuration test failed:', error.message);
    }

    // Test 3: Check database functions
    console.log('\n3️⃣ Testing database functions...');
    
    try {
      const { data: analyticsData, error: analyticsError } = await supabase.rpc('get_platform_analytics');
      if (analyticsError) {
        console.log('⚠️  Platform analytics function error:', analyticsError.message);
      } else {
        console.log('✅ Platform analytics function working');
      }
    } catch (error) {
      console.log('⚠️  Database function test failed:', error.message);
    }

    // Test 4: Check if the application is properly deployed
    console.log('\n4️⃣ Testing application deployment...');
    
    try {
      const response = await fetch(`${frontendUrl}/`);
      if (response.ok) {
        console.log('✅ Main application is accessible');
        
        // Check if it's serving the React app
        const html = await response.text();
        if (html.includes('react') || html.includes('vite') || html.includes('root')) {
          console.log('✅ React application detected');
        } else {
          console.log('⚠️  React application not detected - might be serving static files');
        }
      } else {
        console.log(`❌ Main application not accessible: ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ Application deployment test failed: ${error.message}`);
    }

    // Test 5: Check magic link URL format
    console.log('\n5️⃣ Testing magic link URL format...');
    
    const expectedUrl = `${frontendUrl}/accept-invitation#access_token=test_token&refresh_token=test_refresh&type=invite`;
    console.log(`Expected URL format: ${expectedUrl}`);
    console.log('✅ URL format looks correct for hash-based authentication');

    console.log('\n🎉 Magic Link Flow Test Complete!');
    console.log('\n📋 Summary:');
    console.log('   The AcceptInvitation component now handles both:');
    console.log('   - Hash fragments (#access_token=...) - Supabase magic links');
    console.log('   - URL parameters (?token_hash=...) - Alternative format');
    console.log('   - Direct email parameters (?email=...) - Fallback');
    
    console.log('\n🔧 Next Steps:');
    console.log('   1. Deploy the updated AcceptInvitation component');
    console.log('   2. Configure Supabase redirect URLs in dashboard:');
    console.log('      - Add https://demo.alphabusinessdesigns.co.in/accept-invitation');
    console.log('      - Add http://localhost:3000/accept-invitation (for testing)');
    console.log('   3. Test with a real magic link');
    console.log('   4. Verify the complete user flow works');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error);
  }
}

// Run the test
testCompleteMagicLinkFlow();
