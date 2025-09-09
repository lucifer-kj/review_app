/**
 * Test Deployment Routing
 * Tests if the SPA routing is working correctly on the deployed site
 */

const frontendUrl = process.env.VITE_FRONTEND_URL || 'https://demo.alphabusinessdesigns.co.in';

async function testDeploymentRouting() {
  console.log('🧪 Testing Deployment Routing...\n');

  const testRoutes = [
    '/',
    '/test-accept-invitation',
    '/accept-invitation',
    '/auth/callback',
    '/dashboard',
    '/master',
    '/login',
    '/review'
  ];

  for (const route of testRoutes) {
    try {
      console.log(`Testing route: ${route}`);
      const response = await fetch(`${frontendUrl}${route}`);
      
      if (response.ok) {
        const html = await response.text();
        
        // Check if it's serving the React app
        if (html.includes('root') || html.includes('react') || html.includes('vite')) {
          console.log(`✅ ${route} - React app served correctly`);
        } else if (html.includes('404') || html.includes('NOT_FOUND')) {
          console.log(`❌ ${route} - 404 error (SPA routing not working)`);
        } else {
          console.log(`⚠️  ${route} - Unexpected response (${response.status})`);
        }
      } else {
        console.log(`❌ ${route} - HTTP ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ ${route} - Error: ${error.message}`);
    }
    console.log('');
  }

  // Test specific magic link scenario
  console.log('🔗 Testing Magic Link Scenario...');
  try {
    const magicLinkUrl = `${frontendUrl}/accept-invitation#access_token=test_token&refresh_token=test_refresh&type=invite`;
    console.log(`Magic Link URL: ${magicLinkUrl}`);
    
    const response = await fetch(magicLinkUrl);
    if (response.ok) {
      console.log('✅ Magic link URL is accessible');
    } else {
      console.log(`❌ Magic link URL failed: ${response.status}`);
    }
  } catch (error) {
    console.log(`❌ Magic link test failed: ${error.message}`);
  }

  console.log('\n📋 Summary:');
  console.log('If you see 404 errors for client-side routes, the SPA fallback is not working.');
  console.log('This means the vercel.json configuration needs to be updated and redeployed.');
  console.log('\n🔧 Next Steps:');
  console.log('1. Update vercel.json with correct rewrites');
  console.log('2. Redeploy the application');
  console.log('3. Test the routes again');
}

testDeploymentRouting().catch(console.error);
