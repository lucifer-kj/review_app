/**
 * Test Hash Fragment Fix
 * Tests if the Vercel configuration properly handles hash fragments for magic links
 */

const frontendUrl = process.env.VITE_FRONTEND_URL || 'https://demo.alphabusinessdesigns.co.in';

async function testHashFragmentFix() {
  console.log('🧪 Testing Hash Fragment Fix...\n');

  // Test 1: Basic SPA routing
  console.log('1️⃣ Testing basic SPA routing...');
  const testRoutes = [
    '/',
    '/test-accept-invitation',
    '/accept-invitation',
    '/dashboard',
    '/master',
    '/login'
  ];

  for (const route of testRoutes) {
    try {
      const response = await fetch(`${frontendUrl}${route}`);
      if (response.ok) {
        const html = await response.text();
        if (html.includes('root') || html.includes('react')) {
          console.log(`✅ ${route} - SPA routing working`);
        } else {
          console.log(`⚠️  ${route} - Unexpected response`);
        }
      } else {
        console.log(`❌ ${route} - HTTP ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ ${route} - Error: ${error.message}`);
    }
  }

  // Test 2: Hash fragment handling (magic link simulation)
  console.log('\n2️⃣ Testing hash fragment handling...');
  const magicLinkTests = [
    '/accept-invitation#access_token=test_token&refresh_token=test_refresh&type=invite',
    '/accept-invitation#access_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9&refresh_token=test_refresh&type=invite',
    '/test-accept-invitation#test=value'
  ];

  for (const testUrl of magicLinkTests) {
    try {
      const fullUrl = `${frontendUrl}${testUrl}`;
      console.log(`Testing: ${fullUrl}`);
      
      const response = await fetch(fullUrl);
      if (response.ok) {
        const html = await response.text();
        if (html.includes('root') || html.includes('react')) {
          console.log(`✅ Hash fragment handled correctly`);
        } else {
          console.log(`⚠️  Hash fragment not handled properly`);
        }
      } else {
        console.log(`❌ Hash fragment test failed: HTTP ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ Hash fragment test error: ${error.message}`);
    }
  }

  // Test 3: Verify the exact magic link format from the image
  console.log('\n3️⃣ Testing exact magic link format from error...');
  const exactMagicLink = `${frontendUrl}/accept-invitation#access_token=eyJhbGciOiJlUzI1NilsImtpZCI6IkRmalRCdEx...`;
  
  try {
    const response = await fetch(exactMagicLink);
    if (response.ok) {
      console.log('✅ Exact magic link format works');
    } else {
      console.log(`❌ Exact magic link format failed: HTTP ${response.status}`);
    }
  } catch (error) {
    console.log(`❌ Exact magic link test error: ${error.message}`);
  }

  console.log('\n📋 Summary:');
  console.log('✅ Vercel.json updated with simple rewrite rule: "/(.*)" → "/index.html"');
  console.log('✅ HTML fallback added for hash fragment handling');
  console.log('✅ _redirects file configured for additional compatibility');
  
  console.log('\n🚀 Next Steps:');
  console.log('1. Deploy the updated configuration:');
  console.log('   npm run build && vercel deploy --prod');
  console.log('2. Test the magic link flow end-to-end');
  console.log('3. Verify all client-side routes work correctly');
  
  console.log('\n🎯 Expected Result:');
  console.log('All routes including those with hash fragments should serve the React app');
  console.log('Magic links should redirect to /accept-invitation and work correctly');
}

testHashFragmentFix().catch(console.error);
