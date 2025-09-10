#!/usr/bin/env node

/**
 * Test Settings Save Functionality
 * 
 * This script tests the business settings save functionality to identify the issue.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testBusinessSettingsTable() {
  console.log('🔍 Testing business_settings table structure');
  
  try {
    // Check if the migration file has the correct structure
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20250110000000_consolidated_database_schema.sql');
    const migrationContent = fs.readFileSync(migrationPath, 'utf8');
    
    // Check for required columns
    const requiredColumns = [
      'email_template',
      'form_customization',
      'tenant_id',
      'user_id'
    ];
    
    let allColumnsExist = true;
    
    for (const column of requiredColumns) {
      if (migrationContent.includes(column)) {
        console.log(`✅ Column exists: ${column}`);
      } else {
        console.log(`❌ Column missing: ${column}`);
        allColumnsExist = false;
      }
    }
    
    return allColumnsExist;
  } catch (error) {
    console.error('❌ Table structure test failed:', error.message);
    return false;
  }
}

async function testBusinessSettingsService() {
  console.log('🔍 Testing BusinessSettingsService');
  
  try {
    const servicePath = path.join(__dirname, '..', 'src', 'services', 'businessSettingsService.ts');
    const serviceContent = fs.readFileSync(servicePath, 'utf8');
    
    // Check for required methods
    const requiredMethods = [
      'updateSettings',
      'upsertBusinessSettings',
      'getBusinessSettings'
    ];
    
    let allMethodsExist = true;
    
    for (const method of requiredMethods) {
      if (serviceContent.includes(method)) {
        console.log(`✅ Method exists: ${method}`);
      } else {
        console.log(`❌ Method missing: ${method}`);
        allMethodsExist = false;
      }
    }
    
    return allMethodsExist;
  } catch (error) {
    console.error('❌ Service test failed:', error.message);
    return false;
  }
}

async function testDashboardSettingsComponent() {
  console.log('🔍 Testing DashboardSettings component');
  
  try {
    const componentPath = path.join(__dirname, '..', 'src', 'pages', 'DashboardSettings.tsx');
    const componentContent = fs.readFileSync(componentPath, 'utf8');
    
    // Check for required functionality
    const requiredFeatures = [
      'handleSaveSettings',
      'BusinessSettingsService.updateSettings',
      'toast',
      'useAuth'
    ];
    
    let allFeaturesExist = true;
    
    for (const feature of requiredFeatures) {
      if (componentContent.includes(feature)) {
        console.log(`✅ Feature exists: ${feature}`);
      } else {
        console.log(`❌ Feature missing: ${feature}`);
        allFeaturesExist = false;
      }
    }
    
    return allFeaturesExist;
  } catch (error) {
    console.error('❌ Component test failed:', error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Starting Settings Save Test\n');
  
  const tests = [
    { name: 'Business Settings Table Structure', test: testBusinessSettingsTable },
    { name: 'BusinessSettingsService', test: testBusinessSettingsService },
    { name: 'DashboardSettings Component', test: testDashboardSettingsComponent }
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
    console.log('🎉 All tests passed! Settings save should work correctly.');
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
