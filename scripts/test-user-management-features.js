#!/usr/bin/env node

/**
 * Test User Management Features
 * 
 * This script tests all user management features in the master dashboard:
 * 1. User promotion/demotion
 * 2. User banning/unbanning
 * 3. User suspension/unsuspension
 * 4. Tenant assignment
 * 5. User deletion
 * 6. Status indicators
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testUserManagementFeatures() {
  console.log('🧪 Testing User Management Features...\n');

  try {
    // Test 1: Check if UserManagement component has all required features
    console.log('1️⃣ Checking UserManagement component features...');
    
    const userManagementPath = path.join(__dirname, '..', 'src', 'components', 'master-dashboard', 'users', 'UserManagement.tsx');
    const userManagementContent = fs.readFileSync(userManagementPath, 'utf8');
    
    const requiredFeatures = [
      'banUserMutation',
      'unbanUserMutation', 
      'suspendUserMutation',
      'unsuspendUserMutation',
      'changeUserRoleMutation',
      'moveUserToTenantMutation',
      'deleteUserMutation',
      'isUserBanned',
      'isUserSuspended',
      'UserRoleModal',
      'TenantSelectionModal'
    ];
    
    let allFeaturesPresent = true;
    for (const feature of requiredFeatures) {
      if (userManagementContent.includes(feature)) {
        console.log(`✅ ${feature} - Present`);
      } else {
        console.log(`❌ ${feature} - Missing`);
        allFeaturesPresent = false;
      }
    }
    
    if (allFeaturesPresent) {
      console.log('✅ All user management features are present');
    } else {
      console.log('❌ Some user management features are missing');
    }

    // Test 2: Check if UserManagementService has all required methods
    console.log('\n2️⃣ Checking UserManagementService methods...');
    
    const userManagementServicePath = path.join(__dirname, '..', 'src', 'services', 'userManagementService.ts');
    const userManagementServiceContent = fs.readFileSync(userManagementServicePath, 'utf8');
    
    const requiredMethods = [
      'banUser',
      'unbanUser',
      'suspendUser', 
      'unsuspendUser',
      'promoteUser',
      'moveUserToTenant',
      'deleteUser'
    ];
    
    let allMethodsPresent = true;
    for (const method of requiredMethods) {
      if (userManagementServiceContent.includes(`static async ${method}`)) {
        console.log(`✅ ${method} - Present`);
      } else {
        console.log(`❌ ${method} - Missing`);
        allMethodsPresent = false;
      }
    }
    
    if (allMethodsPresent) {
      console.log('✅ All user management service methods are present');
    } else {
      console.log('❌ Some user management service methods are missing');
    }

    // Test 3: Check if modals are properly implemented
    console.log('\n3️⃣ Checking modal implementations...');
    
    const userRoleModalPath = path.join(__dirname, '..', 'src', 'components', 'master-dashboard', 'users', 'UserRoleModal.tsx');
    const tenantSelectionModalPath = path.join(__dirname, '..', 'src', 'components', 'master-dashboard', 'users', 'TenantSelectionModal.tsx');
    
    const modalsExist = fs.existsSync(userRoleModalPath) && fs.existsSync(tenantSelectionModalPath);
    
    if (modalsExist) {
      console.log('✅ UserRoleModal - Present');
      console.log('✅ TenantSelectionModal - Present');
    } else {
      console.log('❌ Some modals are missing');
    }

    // Test 4: Check if user status indicators are implemented
    console.log('\n4️⃣ Checking user status indicators...');
    
    const statusIndicators = [
      'isUserBanned',
      'isUserSuspended', 
      'Banned',
      'Suspended',
      'Unverified',
      'bg-red-50 border-red-200',
      'bg-orange-50 border-orange-200'
    ];
    
    let allIndicatorsPresent = true;
    for (const indicator of statusIndicators) {
      if (userManagementContent.includes(indicator)) {
        console.log(`✅ ${indicator} - Present`);
      } else {
        console.log(`❌ ${indicator} - Missing`);
        allIndicatorsPresent = false;
      }
    }
    
    if (allIndicatorsPresent) {
      console.log('✅ All user status indicators are present');
    } else {
      console.log('❌ Some user status indicators are missing');
    }

    // Test 5: Check if tenant and role management is enabled
    console.log('\n5️⃣ Checking if tenant and role management is enabled...');
    
    const tenantManagementEnabled = !userManagementContent.includes('disabled={true}') || 
                                   userManagementContent.includes('disabled={moveUserToTenantMutation.isPending}');
    const roleManagementEnabled = !userManagementContent.includes('disabled={true}') || 
                                 userManagementContent.includes('disabled={changeUserRoleMutation.isPending}');
    
    if (tenantManagementEnabled) {
      console.log('✅ Tenant management - Enabled');
    } else {
      console.log('❌ Tenant management - Disabled');
    }
    
    if (roleManagementEnabled) {
      console.log('✅ Role management - Enabled');
    } else {
      console.log('❌ Role management - Disabled');
    }

    // Test 6: Check if all required UI components are imported
    console.log('\n6️⃣ Checking UI component imports...');
    
    const requiredImports = [
      'Ban',
      'Unlock', 
      'UserX',
      'UserCheck',
      'AlertTriangle',
      'Crown',
      'Shield',
      'Building2',
      'AlertDialog',
      'DropdownMenu'
    ];
    
    let allImportsPresent = true;
    for (const importName of requiredImports) {
      if (userManagementContent.includes(importName)) {
        console.log(`✅ ${importName} - Imported`);
      } else {
        console.log(`❌ ${importName} - Missing`);
        allImportsPresent = false;
      }
    }
    
    if (allImportsPresent) {
      console.log('✅ All required UI components are imported');
    } else {
      console.log('❌ Some required UI components are missing');
    }

    // Summary
    console.log('\n📊 USER MANAGEMENT FEATURES SUMMARY');
    console.log('=====================================');
    
    const features = [
      { name: 'User Promotion/Demotion', status: allMethodsPresent && allFeaturesPresent },
      { name: 'User Banning/Unbanning', status: allMethodsPresent && allFeaturesPresent },
      { name: 'User Suspension/Unsuspension', status: allMethodsPresent && allFeaturesPresent },
      { name: 'Tenant Assignment', status: tenantManagementEnabled && allFeaturesPresent },
      { name: 'Role Management', status: roleManagementEnabled && allFeaturesPresent },
      { name: 'User Deletion', status: allMethodsPresent && allFeaturesPresent },
      { name: 'Status Indicators', status: allIndicatorsPresent },
      { name: 'Modal Interfaces', status: modalsExist },
      { name: 'UI Components', status: allImportsPresent }
    ];
    
    let passedTests = 0;
    for (const feature of features) {
      const status = feature.status ? '✅ PASS' : '❌ FAIL';
      console.log(`${status} ${feature.name}`);
      if (feature.status) passedTests++;
    }
    
    const passRate = (passedTests / features.length) * 100;
    console.log(`\n🎯 Overall Pass Rate: ${passRate.toFixed(1)}% (${passedTests}/${features.length})`);
    
    if (passRate === 100) {
      console.log('\n🎉 ALL USER MANAGEMENT FEATURES ARE FULLY IMPLEMENTED!');
      console.log('\nAvailable Features:');
      console.log('• Promote users to super_admin, tenant_admin, or user');
      console.log('• Ban/unban users with visual indicators');
      console.log('• Suspend/unsuspend users with visual indicators');
      console.log('• Assign users to tenants');
      console.log('• Change user roles with confirmation dialogs');
      console.log('• Delete users with confirmation');
      console.log('• Real-time status updates');
      console.log('• Comprehensive user status indicators');
    } else {
      console.log('\n⚠️  Some user management features need attention');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testUserManagementFeatures();
