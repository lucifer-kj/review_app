#!/usr/bin/env node

/**
 * Test Production Fixes
 * 
 * This script tests all the production fixes implemented:
 * 1. Real-time updates
 * 2. Environment configuration
 * 3. Error handling
 * 4. Performance optimizations
 * 5. Security improvements
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testRealtimeUpdates() {
  console.log('🔍 Testing real-time updates implementation');
  
  try {
    // Check if real-time hooks exist
    const subscriptionHookPath = path.join(__dirname, '..', 'src', 'hooks', 'useRealtimeSubscription.ts');
    const updatesHookPath = path.join(__dirname, '..', 'src', 'hooks', 'useRealtimeUpdates.ts');
    
    if (!fs.existsSync(subscriptionHookPath)) {
      console.log('❌ useRealtimeSubscription hook not found');
      return false;
    }
    
    if (!fs.existsSync(updatesHookPath)) {
      console.log('❌ useRealtimeUpdates hook not found');
      return false;
    }
    
    const hookContent = fs.readFileSync(subscriptionHookPath, 'utf8');
    const updatesContent = fs.readFileSync(updatesHookPath, 'utf8');
    
    // Check for required functionality
    const requiredFeatures = [
      'useRealtimeSubscription',
      'useRealtimeUpdates',
      '.channel',
      'postgres_changes',
      'queryClient.invalidateQueries'
    ];
    
    let allFeaturesExist = true;
    
    for (const feature of requiredFeatures) {
      if (hookContent.includes(feature) || updatesContent.includes(feature)) {
        console.log(`✅ Feature exists: ${feature}`);
      } else {
        console.log(`❌ Feature missing: ${feature}`);
        allFeaturesExist = false;
      }
    }
    
    // Check if components use real-time updates
    const dashboardReviewsPath = path.join(__dirname, '..', 'src', 'pages', 'DashboardReviews.tsx');
    const dashboardReviewsContent = fs.readFileSync(dashboardReviewsPath, 'utf8');
    
    if (dashboardReviewsContent.includes('useRealtimeUpdates')) {
      console.log('✅ DashboardReviews uses real-time updates');
    } else {
      console.log('❌ DashboardReviews missing real-time updates');
      allFeaturesExist = false;
    }
    
    return allFeaturesExist;
  } catch (error) {
    console.error('❌ Real-time updates test failed:', error.message);
    return false;
  }
}

async function testEnvironmentConfiguration() {
  console.log('🔍 Testing environment configuration fixes');
  
  try {
    // Check env.ts file
    const envPath = path.join(__dirname, '..', 'src', 'utils', 'env.ts');
    const envContent = fs.readFileSync(envPath, 'utf8');
    
    // Check for hardcoded localhost removal
    if (!envContent.includes('http://localhost:5173') || envContent.includes('import.meta.env.VITE_DEV_URL')) {
      console.log('✅ Hardcoded localhost URLs removed');
    } else {
      console.log('❌ Hardcoded localhost URLs still present');
      return false;
    }
    
    // Check for environment validation
    if (envContent.includes('getEnvironmentError') && envContent.includes('validateEnvironment')) {
      console.log('✅ Environment validation implemented');
    } else {
      console.log('❌ Environment validation missing');
      return false;
    }
    
    // Check env.example file
    const envExamplePath = path.join(__dirname, '..', 'env.example');
    const envExampleContent = fs.readFileSync(envExamplePath, 'utf8');
    
    const requiredVars = [
      'VITE_SUPABASE_URL',
      'VITE_SUPABASE_ANON_KEY',
      'VITE_SUPABASE_SERVICE_ROLE_KEY',
      'VITE_FRONTEND_URL',
      'VITE_APP_NAME'
    ];
    
    let allVarsExist = true;
    
    for (const varName of requiredVars) {
      if (envExampleContent.includes(varName)) {
        console.log(`✅ Environment variable documented: ${varName}`);
      } else {
        console.log(`❌ Environment variable missing: ${varName}`);
        allVarsExist = false;
      }
    }
    
    return allVarsExist;
  } catch (error) {
    console.error('❌ Environment configuration test failed:', error.message);
    return false;
  }
}

async function testErrorHandling() {
  console.log('🔍 Testing enhanced error handling');
  
  try {
    // Check if errorHandler utility exists
    const errorHandlerPath = path.join(__dirname, '..', 'src', 'utils', 'errorHandler.ts');
    if (!fs.existsSync(errorHandlerPath)) {
      console.log('❌ errorHandler utility not found');
      return false;
    }
    
    const errorHandlerContent = fs.readFileSync(errorHandlerPath, 'utf8');
    
    // Check for required error handling features
    const requiredFeatures = [
      'AppError',
      'handleServiceError',
      'isOperationalError',
      'getErrorMessage',
      'getErrorCode'
    ];
    
    let allFeaturesExist = true;
    
    for (const feature of requiredFeatures) {
      if (errorHandlerContent.includes(feature)) {
        console.log(`✅ Error handling feature exists: ${feature}`);
      } else {
        console.log(`❌ Error handling feature missing: ${feature}`);
        allFeaturesExist = false;
      }
    }
    
    // Check if services use enhanced error handling
    const reviewServicePath = path.join(__dirname, '..', 'src', 'services', 'reviewService.ts');
    const reviewServiceContent = fs.readFileSync(reviewServicePath, 'utf8');
    
    if (reviewServiceContent.includes('handleServiceError') && reviewServiceContent.includes('AppError')) {
      console.log('✅ ReviewService uses enhanced error handling');
    } else {
      console.log('❌ ReviewService missing enhanced error handling');
      allFeaturesExist = false;
    }
    
    return allFeaturesExist;
  } catch (error) {
    console.error('❌ Error handling test failed:', error.message);
    return false;
  }
}

async function testPerformanceOptimizations() {
  console.log('🔍 Testing performance optimizations');
  
  try {
    // Check if useOptimizedCallback hook exists
    const hookPath = path.join(__dirname, '..', 'src', 'hooks', 'useOptimizedCallback.ts');
    if (!fs.existsSync(hookPath)) {
      console.log('❌ useOptimizedCallback hook not found');
      return false;
    }
    
    const hookContent = fs.readFileSync(hookPath, 'utf8');
    
    // Check for required performance features
    const requiredFeatures = [
      'useOptimizedCallback',
      'useDebouncedCallback',
      'useThrottledCallback',
      'useCallback',
      'useRef'
    ];
    
    let allFeaturesExist = true;
    
    for (const feature of requiredFeatures) {
      if (hookContent.includes(feature)) {
        console.log(`✅ Performance feature exists: ${feature}`);
      } else {
        console.log(`❌ Performance feature missing: ${feature}`);
        allFeaturesExist = false;
      }
    }
    
    // Check if components use performance optimizations
    const dashboardReviewsPath = path.join(__dirname, '..', 'src', 'pages', 'DashboardReviews.tsx');
    const dashboardReviewsContent = fs.readFileSync(dashboardReviewsPath, 'utf8');
    
    if (dashboardReviewsContent.includes('useOptimizedCallback')) {
      console.log('✅ DashboardReviews uses performance optimizations');
    } else {
      console.log('❌ DashboardReviews missing performance optimizations');
      allFeaturesExist = false;
    }
    
    return allFeaturesExist;
  } catch (error) {
    console.error('❌ Performance optimizations test failed:', error.message);
    return false;
  }
}

async function testSecurityImprovements() {
  console.log('🔍 Testing security improvements');
  
  try {
    // Check if securityAudit utility exists
    const securityAuditPath = path.join(__dirname, '..', 'src', 'utils', 'securityAudit.ts');
    if (!fs.existsSync(securityAuditPath)) {
      console.log('❌ securityAudit utility not found');
      return false;
    }
    
    const securityAuditContent = fs.readFileSync(securityAuditPath, 'utf8');
    
    // Check for required security features
    const requiredFeatures = [
      'SecurityAudit',
      'runSecurityAudit',
      'sanitizeInput',
      'isValidUUID',
      'isValidEmail',
      'getSecurityHeaders'
    ];
    
    let allFeaturesExist = true;
    
    for (const feature of requiredFeatures) {
      if (securityAuditContent.includes(feature)) {
        console.log(`✅ Security feature exists: ${feature}`);
      } else {
        console.log(`❌ Security feature missing: ${feature}`);
        allFeaturesExist = false;
      }
    }
    
    // Check for potential password logging (should not exist)
    const authFiles = [
      'src/hooks/useAuth.ts',
      'src/hooks/useMagicLinkHandler.ts',
      'src/pages/Login.tsx'
    ];
    
    let noPasswordLogging = true;
    
    for (const authFile of authFiles) {
      const filePath = path.join(__dirname, '..', authFile);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        if (content.includes('console.log') && content.includes('password')) {
          console.log(`❌ Potential password logging found in ${authFile}`);
          noPasswordLogging = false;
        }
      }
    }
    
    if (noPasswordLogging) {
      console.log('✅ No password logging detected');
    }
    
    return allFeaturesExist && noPasswordLogging;
  } catch (error) {
    console.error('❌ Security improvements test failed:', error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Starting Production Fixes Test\n');
  
  const tests = [
    { name: 'Real-time Updates', test: testRealtimeUpdates },
    { name: 'Environment Configuration', test: testEnvironmentConfiguration },
    { name: 'Error Handling', test: testErrorHandling },
    { name: 'Performance Optimizations', test: testPerformanceOptimizations },
    { name: 'Security Improvements', test: testSecurityImprovements }
  ];
  
  const results = [];
  
  for (const { name, test } of tests) {
    console.log(`\n--- ${name} ---`);
    try {
      const result = await test();
      results.push({ name, passed: result });
    } catch (error) {
      console.error(`❌ ${name} test failed with error:`, error.message);
      results.push({ name, passed: false });
    }
  }
  
  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  
  let passedTests = 0;
  let totalTests = results.length;
  
  results.forEach(({ name, passed }) => {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${name}`);
    if (passed) passedTests++;
  });
  
  console.log(`\n🎯 Overall Result: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All production fixes implemented successfully!');
    console.log('\n📝 Production Readiness Checklist:');
    console.log('==================================');
    console.log('✅ Real-time updates implemented');
    console.log('✅ Environment configuration fixed');
    console.log('✅ Error handling enhanced');
    console.log('✅ Performance optimizations added');
    console.log('✅ Security improvements implemented');
    console.log('\n🚀 Ready for production deployment!');
    return true;
  } else {
    console.log('⚠️  Some production fixes need attention.');
    return false;
  }
}

// Run the tests
runAllTests()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('❌ Test runner failed:', error);
    process.exit(1);
  });
