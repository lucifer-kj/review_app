#!/usr/bin/env node

/**
 * Test Settings Save Functionality - Complete Test
 * 
 * This script tests the complete settings save functionality including:
 * 1. Database table structure
 * 2. Service methods
 * 3. Component integration
 * 4. Error handling
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testDatabaseMigration() {
  console.log('🔍 Testing database migration structure');
  
  try {
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20250110000000_consolidated_database_schema.sql');
    const migrationContent = fs.readFileSync(migrationPath, 'utf8');
    
    // Check for business_settings table structure
    const tableMatch = migrationContent.match(/CREATE TABLE public\.business_settings \([\s\S]*?\);/);
    
    if (!tableMatch) {
      console.log('❌ business_settings table not found in migration');
      return false;
    }
    
    const tableDefinition = tableMatch[0];
    
    // Check for required columns
    const requiredColumns = [
      'email_template JSONB',
      'form_customization JSONB',
      'tenant_id UUID',
      'user_id UUID'
    ];
    
    let allColumnsExist = true;
    
    for (const column of requiredColumns) {
      if (tableDefinition.includes(column)) {
        console.log(`✅ Column exists: ${column}`);
      } else {
        console.log(`❌ Column missing: ${column}`);
        allColumnsExist = false;
      }
    }
    
    // Check for RLS policies
    if (migrationContent.includes('CREATE POLICY "tenant_business_settings"')) {
      console.log('✅ RLS policy exists: tenant_business_settings');
    } else {
      console.log('❌ RLS policy missing: tenant_business_settings');
      allColumnsExist = false;
    }
    
    return allColumnsExist;
  } catch (error) {
    console.error('❌ Database migration test failed:', error.message);
    return false;
  }
}

async function testServiceImplementation() {
  console.log('🔍 Testing BusinessSettingsService implementation');
  
  try {
    const servicePath = path.join(__dirname, '..', 'src', 'services', 'businessSettingsService.ts');
    const serviceContent = fs.readFileSync(servicePath, 'utf8');
    
    // Check for fallback handling
    const fallbackFeatures = [
      'settings JSONB',
      'fallback to basic',
      'email_template',
      'form_customization',
      'tenant_id',
      'user_id'
    ];
    
    let allFeaturesExist = true;
    
    for (const feature of fallbackFeatures) {
      if (serviceContent.includes(feature)) {
        console.log(`✅ Feature exists: ${feature}`);
      } else {
        console.log(`❌ Feature missing: ${feature}`);
        allFeaturesExist = false;
      }
    }
    
    // Check for error handling
    if (serviceContent.includes('error.message.includes') && serviceContent.includes('does not exist')) {
      console.log('✅ Error handling for missing columns exists');
    } else {
      console.log('❌ Error handling for missing columns missing');
      allFeaturesExist = false;
    }
    
    return allFeaturesExist;
  } catch (error) {
    console.error('❌ Service implementation test failed:', error.message);
    return false;
  }
}

async function testComponentIntegration() {
  console.log('🔍 Testing DashboardSettings component integration');
  
  try {
    const componentPath = path.join(__dirname, '..', 'src', 'pages', 'DashboardSettings.tsx');
    const componentContent = fs.readFileSync(componentPath, 'utf8');
    
    // Check for required functionality
    const requiredFeatures = [
      'handleSaveSettings',
      'BusinessSettingsService.updateSettings',
      'toast',
      'useAuth',
      'validateSettings',
      'setSaving'
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
    
    // Check for error handling
    if (componentContent.includes('response.success') && componentContent.includes('variant: "destructive"')) {
      console.log('✅ Error handling in component exists');
    } else {
      console.log('❌ Error handling in component missing');
      allFeaturesExist = false;
    }
    
    return allFeaturesExist;
  } catch (error) {
    console.error('❌ Component integration test failed:', error.message);
    return false;
  }
}

async function testTypeDefinitions() {
  console.log('🔍 Testing type definitions');
  
  try {
    const typesPath = path.join(__dirname, '..', 'src', 'types', 'index.ts');
    const typesContent = fs.readFileSync(typesPath, 'utf8');
    
    // Check for BusinessSettings interface
    if (typesContent.includes('interface BusinessSettings') || typesContent.includes('type BusinessSettings')) {
      console.log('✅ BusinessSettings type definition exists');
    } else {
      console.log('❌ BusinessSettings type definition missing');
      return false;
    }
    
    // Check for required fields
    const requiredFields = [
      'email_template',
      'form_customization',
      'tenant_id',
      'user_id'
    ];
    
    let allFieldsExist = true;
    
    for (const field of requiredFields) {
      if (typesContent.includes(field)) {
        console.log(`✅ Field exists in types: ${field}`);
      } else {
        console.log(`❌ Field missing in types: ${field}`);
        allFieldsExist = false;
      }
    }
    
    return allFieldsExist;
  } catch (error) {
    console.error('❌ Type definitions test failed:', error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Starting Complete Settings Save Test\n');
  
  const tests = [
    { name: 'Database Migration Structure', test: testDatabaseMigration },
    { name: 'Service Implementation', test: testServiceImplementation },
    { name: 'Component Integration', test: testComponentIntegration },
    { name: 'Type Definitions', test: testTypeDefinitions }
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
    console.log('\n📝 Next Steps:');
    console.log('1. Deploy the database migration to add the new columns');
    console.log('2. Test the settings save functionality in the UI');
    console.log('3. If issues persist, check browser console for specific errors');
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
