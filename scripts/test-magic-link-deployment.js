#!/usr/bin/env node

/**
 * Test script to verify magic link routing after deployment
 * This script tests the SPA routing configuration
 */

const https = require('https');
const http = require('http');

const BASE_URL = 'https://demo.alphabusinessdesigns.co.in';

// Test URLs to verify
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

// Test magic link URLs with hash fragments
const magicLinkTests = [
  '/accept-invitation#access_token=test&refresh_token=test&type=invite',
  '/test-accept-invitation#access_token=test&refresh_token=test&type=invite',
  '/auth/callback?token_hash=test&type=email'
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
        
        console.log(`   Status: ${response.statusCode}`);
        console.log(`   Content-Type: ${response.headers['content-type']}`);
        console.log(`   Is HTML: ${isHtml ? '✅' : '❌'}`);
        console.log(`   Is 404: ${is404 ? '❌' : '✅'}`);
        console.log(`   Is Redirect: ${isRedirect ? '⚠️' : '✅'}`);
        
        if (isHtml && !is404) {
          console.log(`   ✅ Route working correctly`);
        } else if (is404) {
          console.log(`   ❌ Route returning 404`);
        } else if (isRedirect) {
          console.log(`   ⚠️  Route redirecting (might be expected)`);
        }
        
        resolve({
          url: fullUrl,
          status: response.statusCode,
          isHtml,
          is404,
          isRedirect,
          contentType: response.headers['content-type']
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

async function runTests() {
  console.log('🚀 Testing SPA Routing Configuration');
  console.log('=====================================');
  
  const results = [];
  
  // Test basic routes
  console.log('\n📋 Testing Basic Routes:');
  for (const route of testRoutes) {
    try {
      const result = await makeRequest(route);
      results.push(result);
    } catch (error) {
      console.log(`   ❌ Failed: ${error.message}`);
      results.push({
        url: `${BASE_URL}${route}`,
        status: 'ERROR',
        isHtml: false,
        is404: true,
        error: error.message
      });
    }
  }
  
  // Test magic link routes
  console.log('\n🔗 Testing Magic Link Routes:');
  for (const route of magicLinkTests) {
    try {
      const result = await makeRequest(route);
      results.push(result);
    } catch (error) {
      console.log(`   ❌ Failed: ${error.message}`);
      results.push({
        url: `${BASE_URL}${route}`,
        status: 'ERROR',
        isHtml: false,
        is404: true,
        error: error.message
      });
    }
  }
  
  // Summary
  console.log('\n📊 Test Summary:');
  console.log('================');
  
  const working = results.filter(r => r.isHtml && !r.is404).length;
  const failing = results.filter(r => r.is404 || r.status === 'ERROR').length;
  const redirecting = results.filter(r => r.isRedirect).length;
  
  console.log(`✅ Working routes: ${working}`);
  console.log(`❌ Failing routes: ${failing}`);
  console.log(`⚠️  Redirecting routes: ${redirecting}`);
  
  if (failing > 0) {
    console.log('\n❌ Failing routes:');
    results.filter(r => r.is404 || r.status === 'ERROR').forEach(r => {
      console.log(`   - ${r.url} (${r.status})`);
    });
  }
  
  if (working === results.length) {
    console.log('\n🎉 All routes are working correctly!');
  } else if (working > 0) {
    console.log('\n⚠️  Some routes are working, but there are issues to fix.');
  } else {
    console.log('\n❌ No routes are working. Check your deployment configuration.');
  }
  
  console.log('\n💡 Next steps:');
  console.log('1. Deploy the updated configuration to Vercel');
  console.log('2. Test the magic link flow with real Supabase tokens');
  console.log('3. Verify users land on their isolated dashboard');
}

// Run the tests
runTests().catch(console.error);
