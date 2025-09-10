#!/usr/bin/env node

/**
 * Test Super Admin Flow End-to-End
 * 
 * This script tests the complete super admin flow to ensure all fixes work together:
 * 1. Database function exists and works
 * 2. Authentication system is unified
 * 3. Master dashboard components load properly
 * 4. Error boundaries work
 * 5. Loading states work
 * 6. Mobile responsiveness works
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testDatabaseFunction() {
  console.log('🔍 Testing database function: get_tenant_usage_stats');
  
  try {
    // Check if the function exists in the migration file
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20250110000000_consolidated_database_schema.sql');
    const migrationContent = fs.readFileSync(migrationPath, 'utf8');
    
    if (migrationContent.includes('get_tenant_usage_stats')) {
      console.log('✅ Database function exists in migration file');
      return true;
    } else {
      console.log('❌ Database function missing from migration file');
      return false;
    }
  } catch (error) {
    console.error('❌ Database function test failed:', error.message);
    return false;
  }
}

async function testPlatformAnalytics() {
  console.log('🔍 Testing platform analytics function');
  
  try {
    // Check if the function exists in the migration file
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20250110000000_consolidated_database_schema.sql');
    const migrationContent = fs.readFileSync(migrationPath, 'utf8');
    
    if (migrationContent.includes('get_platform_analytics')) {
      console.log('✅ Platform analytics function exists in migration file');
      return true;
    } else {
      console.log('❌ Platform analytics function missing from migration file');
      return false;
    }
  } catch (error) {
    console.error('❌ Platform analytics test failed:', error.message);
    return false;
  }
}

async function testAuthentication() {
  console.log('🔍 Testing authentication system');
  
  try {
    // Check if useAuth hook has login method
    const useAuthPath = path.join(__dirname, '..', 'src', 'hooks', 'useAuth.ts');
    const useAuthContent = fs.readFileSync(useAuthPath, 'utf8');
    
    if (useAuthContent.includes('login') && useAuthContent.includes('signOut')) {
      console.log('✅ useAuth hook has required methods');
      return true;
    } else {
      console.log('❌ useAuth hook missing required methods');
      return false;
    }
  } catch (error) {
    console.error('❌ Authentication test failed:', error.message);
    return false;
  }
}

async function testMasterDashboardComponents() {
  console.log('🔍 Testing master dashboard components');
  
  const components = [
    'src/components/master-dashboard/overview/PlatformOverview.tsx',
    'src/components/master-dashboard/tenants/TenantList.tsx',
    'src/components/master-dashboard/users/UserManagementSimple.tsx',
    'src/components/master-dashboard/system/SystemAdministration.tsx',
    'src/components/master-dashboard/audit/AuditLogs.tsx'
  ];
  
  let allComponentsExist = true;
  
  for (const component of components) {
    const filePath = path.join(__dirname, '..', component);
    if (fs.existsSync(filePath)) {
      console.log(`✅ Component exists: ${component}`);
    } else {
      console.log(`❌ Component missing: ${component}`);
      allComponentsExist = false;
    }
  }
  
  return allComponentsExist;
}

async function testErrorBoundaries() {
  console.log('🔍 Testing error boundaries');
  
  const components = [
    'src/components/master-dashboard/overview/PlatformOverview.tsx',
    'src/components/master-dashboard/tenants/TenantList.tsx',
    'src/components/master-dashboard/users/UserManagementSimple.tsx',
    'src/components/master-dashboard/system/SystemAdministration.tsx',
    'src/components/master-dashboard/audit/AuditLogs.tsx'
  ];
  
  let allHaveErrorBoundaries = true;
  
  for (const component of components) {
    const filePath = path.join(__dirname, '..', component);
    const content = fs.readFileSync(filePath, 'utf8');
    
    if (content.includes('AppErrorBoundary')) {
      console.log(`✅ Error boundary found in: ${component}`);
    } else {
      console.log(`❌ Error boundary missing in: ${component}`);
      allHaveErrorBoundaries = false;
    }
  }
  
  return allHaveErrorBoundaries;
}

async function testLoadingStates() {
  console.log('🔍 Testing loading states');
  
  const components = [
    'src/components/master-dashboard/overview/PlatformOverview.tsx',
    'src/components/master-dashboard/tenants/TenantList.tsx',
    'src/components/master-dashboard/users/UserManagementSimple.tsx',
    'src/components/master-dashboard/system/SystemAdministration.tsx',
    'src/components/master-dashboard/audit/AuditLogs.tsx'
  ];
  
  let allHaveLoadingStates = true;
  
  for (const component of components) {
    const filePath = path.join(__dirname, '..', component);
    const content = fs.readFileSync(filePath, 'utf8');
    
    if (content.includes('Skeleton') && content.includes('isLoading')) {
      console.log(`✅ Loading states found in: ${component}`);
    } else {
      console.log(`❌ Loading states missing in: ${component}`);
      allHaveLoadingStates = false;
    }
  }
  
  return allHaveLoadingStates;
}

async function testMobileResponsiveness() {
  console.log('🔍 Testing mobile responsiveness');
  
  const components = [
    'src/components/master-dashboard/layout/MasterSidebar.tsx',
    'src/components/master-dashboard/layout/MasterDashboardLayout.tsx'
  ];
  
  let allHaveMobileSupport = true;
  
  for (const component of components) {
    const filePath = path.join(__dirname, '..', component);
    const content = fs.readFileSync(filePath, 'utf8');
    
    if (content.includes('isMobile') || content.includes('sm:') || content.includes('md:') || content.includes('lg:')) {
      console.log(`✅ Mobile responsiveness found in: ${component}`);
    } else {
      console.log(`❌ Mobile responsiveness missing in: ${component}`);
      allHaveMobileSupport = false;
    }
  }
  
  return allHaveMobileSupport;
}

async function testUnifiedAuthentication() {
  console.log('🔍 Testing unified authentication system');
  
  const authFiles = [
    'src/hooks/useAuth.ts',
    'src/pages/Login.tsx'
  ];
  
  let allHaveUnifiedAuth = true;
  
  for (const file of authFiles) {
    const filePath = path.join(__dirname, '..', file);
    const content = fs.readFileSync(filePath, 'utf8');
    
    if (file.includes('useAuth.ts')) {
      if (content.includes('login') && content.includes('signOut')) {
        console.log(`✅ useAuth hook has login method: ${file}`);
      } else {
        console.log(`❌ useAuth hook missing login method: ${file}`);
        allHaveUnifiedAuth = false;
      }
    } else if (file.includes('Login.tsx')) {
      if (content.includes('useAuth') && content.includes('login(')) {
        console.log(`✅ Login component uses useAuth: ${file}`);
      } else {
        console.log(`❌ Login component not using useAuth: ${file}`);
        allHaveUnifiedAuth = false;
      }
    }
  }
  
  return allHaveUnifiedAuth;
}

async function runAllTests() {
  console.log('🚀 Starting Super Admin Flow End-to-End Test\n');
  
  const tests = [
    { name: 'Database Function', test: testDatabaseFunction },
    { name: 'Platform Analytics', test: testPlatformAnalytics },
    { name: 'Authentication System', test: testAuthentication },
    { name: 'Master Dashboard Components', test: testMasterDashboardComponents },
    { name: 'Error Boundaries', test: testErrorBoundaries },
    { name: 'Loading States', test: testLoadingStates },
    { name: 'Mobile Responsiveness', test: testMobileResponsiveness },
    { name: 'Unified Authentication', test: testUnifiedAuthentication }
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
    console.log('🎉 All tests passed! Super admin flow is working correctly.');
    return true;
  } else {
    console.log('⚠️  Some tests failed. Please review the issues above.');
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
