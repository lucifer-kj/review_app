#!/usr/bin/env node

/**
 * Debug script to test Vercel routing configuration
 * This will help identify if the issue is with Vercel routing or something else
 */

const https = require('https');
const http = require('http');

const BASE_URL = 'https://demo.alphabusinessdesigns.co.in';

// Test different URL patterns
const testUrls = [
  // Basic routes
  '/',
  '/accept-invitation',
  '/test-accept-invitation',
  '/dashboard',
  '/master',
  '/login',
  
  // Magic link patterns
  '/accept-invitation#access_token=test&refresh_token=test&type=invite',
  '/accept-invitation?token_hash=test&type=email',
  '/auth/callback?token_hash=test&type=email',
  
  // Static assets (should NOT be rewritten)
  '/favicon.ico',
  '/manifest.json',
  '/sw.js',
  '/web/icons8-logo-ios-17-outlined-32.ico',
  
  // API routes (should be redirected)
  '/api/test',
];

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const fullUrl = `${BASE_URL}${url}`;
    console.log(`\n🔍 Testing: ${fullUrl}`);
    
    const request = https.get(fullUrl, (response) => {
      let data = '';
      
      response.on('data', (chunk) => {
        data += chunk;
      });
      
      response.on('end', () => {
        const isHtml = data.includes('<html') && data.includes('<div id="root">');
        const is404 = response.statusCode === 404;
        const isRedirect = response.statusCode >= 300 && response.statusCode < 400;
        const isStaticAsset = url.includes('.') && !url.includes('?') && !url.includes('#');
        const isApiRoute = url.startsWith('/api/');
        
        console.log(`   Status: ${response.statusCode}`);
        console.log(`   Content-Type: ${response.headers['content-type'] || 'Not set'}`);
        console.log(`   Content-Length: ${response.headers['content-length'] || 'Not set'}`);
        console.log(`   Is HTML: ${isHtml ? '✅' : '❌'}`);
        console.log(`   Is 404: ${is404 ? '❌' : '✅'}`);
        console.log(`   Is Redirect: ${isRedirect ? '⚠️' : '✅'}`);
        
        // Check if this should be handled by SPA routing
        if (isStaticAsset && !is404) {
          console.log(`   ✅ Static asset served correctly`);
        } else if (isApiRoute && isRedirect) {
          console.log(`   ✅ API route redirected correctly`);
        } else if (!isStaticAsset && !isApiRoute && isHtml && !is404) {
          console.log(`   ✅ SPA route handled correctly`);
        } else if (is404) {
          console.log(`   ❌ Route returning 404 - SPA routing issue`);
        } else if (isRedirect) {
          console.log(`   ⚠️  Route redirecting (might be expected)`);
        }
        
        resolve({
          url: fullUrl,
          status: response.statusCode,
          isHtml,
          is404,
          isRedirect,
          contentType: response.headers['content-type'],
          contentLength: response.headers['content-length']
        });
      });
    });
    
    request.on('error', (error) => {
      console.log(`   ❌ Error: ${error.message}`);
      reject(error);
    });
    
    request.setTimeout(10000, () => {
      console.log(`   ⏰ Timeout`);
      request.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function runDebugTest() {
  console.log('🚀 Debugging Vercel SPA Routing Configuration');
  console.log('==============================================');
  console.log(`Testing against: ${BASE_URL}`);
  
  const results = [];
  
  for (const url of testUrls) {
    try {
      const result = await makeRequest(url);
      results.push(result);
    } catch (error) {
      console.log(`   ❌ Failed: ${error.message}`);
      results.push({
        url: `${BASE_URL}${url}`,
        status: 'ERROR',
        isHtml: false,
        is404: true,
        error: error.message
      });
    }
  }
  
  // Summary
  console.log('\n📊 Debug Summary:');
  console.log('==================');
  
  const working = results.filter(r => r.isHtml && !r.is404).length;
  const failing = results.filter(r => r.is404 || r.status === 'ERROR').length;
  const redirecting = results.filter(r => r.isRedirect).length;
  
  console.log(`✅ Working SPA routes: ${working}`);
  console.log(`❌ Failing routes: ${failing}`);
  console.log(`⚠️  Redirecting routes: ${redirecting}`);
  
  if (failing > 0) {
    console.log('\n❌ Failing routes that should work:');
    results.filter(r => r.is404 || r.status === 'ERROR').forEach(r => {
      console.log(`   - ${r.url} (${r.status})`);
    });
  }
  
  // Specific checks
  console.log('\n🔍 Specific Checks:');
  console.log('===================');
  
  const acceptInvitation = results.find(r => r.url.includes('/accept-invitation') && !r.url.includes('#') && !r.url.includes('?'));
  if (acceptInvitation) {
    if (acceptInvitation.is404) {
      console.log('❌ /accept-invitation route is returning 404 - This is the main issue!');
      console.log('   Possible causes:');
      console.log('   1. Vercel.json rewrite rule not working');
      console.log('   2. Build output missing index.html');
      console.log('   3. Vercel deployment cache issues');
      console.log('   4. Domain/DNS issues');
    } else if (acceptInvitation.isHtml) {
      console.log('✅ /accept-invitation route is working correctly');
    }
  }
  
  const staticAssets = results.filter(r => r.url.includes('.') && !r.url.includes('?') && !r.url.includes('#'));
  const staticWorking = staticAssets.filter(r => !r.is404).length;
  console.log(`📁 Static assets: ${staticWorking}/${staticAssets.length} working`);
  
  const apiRoutes = results.filter(r => r.url.includes('/api/'));
  const apiRedirecting = apiRoutes.filter(r => r.isRedirect).length;
  console.log(`🔗 API routes: ${apiRedirecting}/${apiRoutes.length} redirecting correctly`);
  
  console.log('\n💡 Next Steps:');
  if (failing > 0) {
    console.log('1. Check Vercel deployment logs for errors');
    console.log('2. Verify build output contains index.html');
    console.log('3. Try redeploying with: vercel --prod --force');
    console.log('4. Check Supabase redirect URL configuration');
    console.log('5. Test with a simple vercel.json configuration');
  } else {
    console.log('🎉 All routes are working correctly!');
    console.log('The issue might be with Supabase magic link configuration.');
  }
}

// Run the debug test
runDebugTest().catch(console.error);
