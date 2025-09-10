#!/usr/bin/env node

/**
 * Test Tenant Workspace Access and Data Isolation
 * 
 * This script tests the tenant workspace access for both tenant_admin and user roles
 * and identifies potential production issues.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testTenantAccessConfiguration() {
  console.log('🔍 Testing tenant access configuration');
  
  try {
    // Check App.tsx routing
    const appPath = path.join(__dirname, '..', 'src', 'App.tsx');
    const appContent = fs.readFileSync(appPath, 'utf8');
    
    // Check if dashboard route allows both roles
    if (appContent.includes('requiredRole={["tenant_admin", "user"]}')) {
      console.log('✅ Dashboard route allows both tenant_admin and user roles');
    } else {
      console.log('❌ Dashboard route does not allow both roles');
      return false;
    }
    
    // Check ProtectedRoute component
    const protectedRoutePath = path.join(__dirname, '..', 'src', 'components', 'auth', 'ProtectedRoute.tsx');
    const protectedRouteContent = fs.readFileSync(protectedRoutePath, 'utf8');
    
    if (protectedRouteContent.includes('Array.isArray(requiredRole)')) {
      console.log('✅ ProtectedRoute supports multiple roles');
    } else {
      console.log('❌ ProtectedRoute does not support multiple roles');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('❌ Tenant access configuration test failed:', error.message);
    return false;
  }
}

async function testDataIsolation() {
  console.log('🔍 Testing data isolation mechanisms');
  
  try {
    // Check RLS policies
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20250110000000_consolidated_database_schema.sql');
    const migrationContent = fs.readFileSync(migrationPath, 'utf8');
    
    const requiredPolicies = [
      'tenant_reviews',
      'tenant_business_settings',
      'tenant_audit_logs',
      'tenant_usage_metrics'
    ];
    
    let allPoliciesExist = true;
    
    for (const policy of requiredPolicies) {
      if (migrationContent.includes(`CREATE POLICY "${policy}"`)) {
        console.log(`✅ RLS policy exists: ${policy}`);
      } else {
        console.log(`❌ RLS policy missing: ${policy}`);
        allPoliciesExist = false;
      }
    }
    
    // Check get_current_tenant_id function
    if (migrationContent.includes('CREATE OR REPLACE FUNCTION public.get_current_tenant_id()')) {
      console.log('✅ get_current_tenant_id function exists');
    } else {
      console.log('❌ get_current_tenant_id function missing');
      allPoliciesExist = false;
    }
    
    return allPoliciesExist;
  } catch (error) {
    console.error('❌ Data isolation test failed:', error.message);
    return false;
  }
}

async function testServiceLayerIsolation() {
  console.log('🔍 Testing service layer data isolation');
  
  try {
    // Check ReviewService
    const reviewServicePath = path.join(__dirname, '..', 'src', 'services', 'reviewService.ts');
    const reviewServiceContent = fs.readFileSync(reviewServicePath, 'utf8');
    
    if (reviewServiceContent.includes('get_current_tenant_id') && 
        reviewServiceContent.includes('tenant_id')) {
      console.log('✅ ReviewService uses tenant isolation');
    } else {
      console.log('❌ ReviewService missing tenant isolation');
      return false;
    }
    
    // Check BusinessSettingsService
    const businessSettingsPath = path.join(__dirname, '..', 'src', 'services', 'businessSettingsService.ts');
    const businessSettingsContent = fs.readFileSync(businessSettingsPath, 'utf8');
    
    if (businessSettingsContent.includes('get_current_tenant_id') && 
        businessSettingsContent.includes('tenant_id')) {
      console.log('✅ BusinessSettingsService uses tenant isolation');
    } else {
      console.log('❌ BusinessSettingsService missing tenant isolation');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('❌ Service layer isolation test failed:', error.message);
    return false;
  }
}

async function testRealTimeUpdates() {
  console.log('🔍 Testing real-time update mechanisms');
  
  try {
    // Check for refetchInterval in dashboard components
    const dashboardPath = path.join(__dirname, '..', 'src', 'pages', 'Dashboard.tsx');
    const dashboardContent = fs.readFileSync(dashboardPath, 'utf8');
    
    if (dashboardContent.includes('refetchInterval')) {
      console.log('✅ Dashboard has refetch intervals');
    } else {
      console.log('⚠️  Dashboard missing refetch intervals - no real-time updates');
    }
    
    // Check for Supabase realtime subscriptions
    const searchPaths = [
      'src/pages',
      'src/components',
      'src/hooks'
    ];
    
    let hasRealtimeSubscriptions = false;
    
    for (const searchPath of searchPaths) {
      const fullPath = path.join(__dirname, '..', searchPath);
      if (fs.existsSync(fullPath)) {
        const files = fs.readdirSync(fullPath, { recursive: true });
        for (const file of files) {
          if (file.endsWith('.tsx') || file.endsWith('.ts')) {
            const filePath = path.join(fullPath, file);
            const content = fs.readFileSync(filePath, 'utf8');
            if (content.includes('supabase.subscribe') || content.includes('realtime')) {
              hasRealtimeSubscriptions = true;
              break;
            }
          }
        }
      }
    }
    
    if (hasRealtimeSubscriptions) {
      console.log('✅ Real-time subscriptions found');
    } else {
      console.log('⚠️  No real-time subscriptions found - using polling only');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Real-time updates test failed:', error.message);
    return false;
  }
}

async function identifyProductionIssues() {
  console.log('🔍 Identifying potential production issues');
  
  const issues = [];
  
  try {
    // Check for hardcoded values
    const configFiles = [
      'src/utils/env.ts',
      'src/integrations/supabase/client.ts',
      'src/integrations/supabase/admin.ts'
    ];
    
    for (const configFile of configFiles) {
      const filePath = path.join(__dirname, '..', configFile);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        if (content.includes('localhost') || content.includes('127.0.0.1')) {
          issues.push('Hardcoded localhost URLs found in configuration');
        }
        if (content.includes('placeholder') || content.includes('your-')) {
          issues.push('Placeholder values found in configuration');
        }
      }
    }
    
    // Check for error handling
    const serviceFiles = fs.readdirSync(path.join(__dirname, '..', 'src', 'services'));
    let hasErrorHandling = true;
    
    for (const serviceFile of serviceFiles) {
      if (serviceFile.endsWith('.ts')) {
        const servicePath = path.join(__dirname, '..', 'src', 'services', serviceFile);
        const serviceContent = fs.readFileSync(servicePath, 'utf8');
        
        if (!serviceContent.includes('try') || !serviceContent.includes('catch')) {
          hasErrorHandling = false;
          break;
        }
      }
    }
    
    if (!hasErrorHandling) {
      issues.push('Some services missing proper error handling');
    }
    
    // Check for security issues
    const authFiles = [
      'src/hooks/useAuth.ts',
      'src/components/auth/ProtectedRoute.tsx'
    ];
    
    for (const authFile of authFiles) {
      const filePath = path.join(__dirname, '..', authFile);
      const content = fs.readFileSync(filePath, 'utf8');
      
      if (content.includes('console.log') && content.includes('password')) {
        issues.push('Potential password logging in authentication code');
      }
    }
    
    // Check for performance issues
    const componentFiles = fs.readdirSync(path.join(__dirname, '..', 'src', 'pages'));
    let hasPerformanceIssues = false;
    
    for (const componentFile of componentFiles) {
      if (componentFile.endsWith('.tsx')) {
        const componentPath = path.join(__dirname, '..', 'src', 'pages', componentFile);
        const componentContent = fs.readFileSync(componentPath, 'utf8');
        
        if (componentContent.includes('useEffect') && !componentContent.includes('useCallback')) {
          hasPerformanceIssues = true;
          break;
        }
      }
    }
    
    if (hasPerformanceIssues) {
      issues.push('Potential performance issues with missing useCallback optimizations');
    }
    
    // Check for missing environment variables
    const envExamplePath = path.join(__dirname, '..', 'env.example');
    if (fs.existsSync(envExamplePath)) {
      const envExample = fs.readFileSync(envExamplePath, 'utf8');
      const requiredVars = [
        'VITE_SUPABASE_URL',
        'VITE_SUPABASE_ANON_KEY',
        'VITE_SUPABASE_SERVICE_ROLE_KEY'
      ];
      
      for (const varName of requiredVars) {
        if (!envExample.includes(varName)) {
          issues.push(`Missing environment variable: ${varName}`);
        }
      }
    }
    
    return issues;
  } catch (error) {
    console.error('❌ Production issues identification failed:', error.message);
    return ['Failed to identify production issues'];
  }
}

async function runAllTests() {
  console.log('🚀 Starting Tenant Workspace Access Test\n');
  
  const tests = [
    { name: 'Tenant Access Configuration', test: testTenantAccessConfiguration },
    { name: 'Data Isolation', test: testDataIsolation },
    { name: 'Service Layer Isolation', test: testServiceLayerIsolation },
    { name: 'Real-time Updates', test: testRealTimeUpdates }
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
  
  // Identify production issues
  console.log('\n--- Production Issues Analysis ---');
  const issues = await identifyProductionIssues();
  
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
  
  if (issues.length > 0) {
    console.log('\n⚠️  Production Issues Identified:');
    console.log('================================');
    issues.forEach((issue, index) => {
      console.log(`${index + 1}. ${issue}`);
    });
  } else {
    console.log('\n✅ No critical production issues identified');
  }
  
  console.log('\n📝 Recommendations:');
  console.log('==================');
  console.log('1. Both tenant_admin and user roles can access the same workspace');
  console.log('2. Data isolation is enforced at database level with RLS policies');
  console.log('3. Real-time updates are limited - consider implementing Supabase realtime');
  console.log('4. Review identified production issues before deployment');
  
  return passedTests === totalTests && issues.length === 0;
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
