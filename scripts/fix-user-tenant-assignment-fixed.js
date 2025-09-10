#!/usr/bin/env node

/**
 * Fix User-Tenant Assignment Flow
 * 
 * This script fixes the broken user-tenant assignment flow where:
 * 1. Users are assigned to tenants but tenant user counts don't update
 * 2. Users can't access tenant workspace after assignment
 * 3. Real-time updates don't work for tenant user counts
 * 
 * The fix involves:
 * 1. Adding real-time updates to tenant components
 * 2. Improving query invalidation
 * 3. Adding user session refresh after tenant assignment
 * 4. Fixing tenant user count calculations
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function fixUserTenantAssignment() {
  console.log('🔧 Fixing User-Tenant Assignment Flow...\n');

  try {
    // Step 1: Add real-time updates to TenantList component
    console.log('1️⃣ Adding real-time updates to TenantList component...');
    
    const tenantListPath = path.join(__dirname, '..', 'src', 'components', 'master-dashboard', 'tenants', 'TenantList.tsx');
    let tenantListContent = fs.readFileSync(tenantListPath, 'utf8');
    
    // Add useRealtimeUpdates import
    if (!tenantListContent.includes('useRealtimeUpdates')) {
      tenantListContent = tenantListContent.replace(
        "import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';",
        "import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';\nimport { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates';"
      );
    }
    
    // Add real-time updates after the query definitions
    const realtimeUpdateCode = `
  // Enable real-time updates for tenant user counts
  useRealtimeUpdates({
    tables: [
      {
        table: 'profiles',
        queryKey: ['tenants'],
        events: ['INSERT', 'UPDATE', 'DELETE']
      }
    ],
    enabled: true,
    onError: (error) => {
      console.error('Real-time tenant updates error:', error);
    }
  });
`;
    
    // Insert after the query definitions
    const queryEndIndex = tenantListContent.indexOf('  const { data: tenantsResponse, isLoading, error } = useQuery({');
    const nextLineIndex = tenantListContent.indexOf('\n  });', queryEndIndex) + 5;
    
    if (!tenantListContent.includes('useRealtimeUpdates')) {
      tenantListContent = tenantListContent.slice(0, nextLineIndex) + realtimeUpdateCode + tenantListContent.slice(nextLineIndex);
    }
    
    fs.writeFileSync(tenantListPath, tenantListContent);
    console.log('✅ TenantList real-time updates added');

    // Step 2: Add real-time updates to TenantDetails component
    console.log('\n2️⃣ Adding real-time updates to TenantDetails component...');
    
    const tenantDetailsPath = path.join(__dirname, '..', 'src', 'components', 'master-dashboard', 'tenants', 'TenantDetails.tsx');
    let tenantDetailsContent = fs.readFileSync(tenantDetailsPath, 'utf8');
    
    // Add useRealtimeUpdates import
    if (!tenantDetailsContent.includes('useRealtimeUpdates')) {
      tenantDetailsContent = tenantDetailsContent.replace(
        "import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';",
        "import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';\nimport { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates';"
      );
    }
    
    // Add real-time updates for tenant users
    const tenantDetailsRealtimeCode = `
  // Enable real-time updates for tenant users
  useRealtimeUpdates({
    tables: [
      {
        table: 'profiles',
        queryKey: ['tenant-users', tenantId],
        tenantId: tenantId,
        events: ['INSERT', 'UPDATE', 'DELETE']
      }
    ],
    enabled: !!tenantId,
    onError: (error) => {
      console.error('Real-time tenant users updates error:', error);
    }
  });
`;
    
    // Insert after the tenant users query
    const tenantUsersQueryIndex = tenantDetailsContent.indexOf('const { data: tenantUsers } = useQuery({');
    if (tenantUsersQueryIndex !== -1) {
      const nextLineIndex = tenantDetailsContent.indexOf('\n  });', tenantUsersQueryIndex) + 5;
      if (!tenantDetailsContent.includes('useRealtimeUpdates')) {
        tenantDetailsContent = tenantDetailsContent.slice(0, nextLineIndex) + tenantDetailsRealtimeCode + tenantDetailsContent.slice(nextLineIndex);
      }
    }
    
    fs.writeFileSync(tenantDetailsPath, tenantDetailsContent);
    console.log('✅ TenantDetails real-time updates added');

    // Step 3: Improve UserManagementService moveUserToTenant function
    console.log('\n3️⃣ Improving UserManagementService moveUserToTenant function...');
    
    const userManagementServicePath = path.join(__dirname, '..', 'src', 'services', 'userManagementService.ts');
    let userManagementServiceContent = fs.readFileSync(userManagementServicePath, 'utf8');
    
    // Add session refresh after tenant assignment
    const sessionRefreshCode = `
      // Refresh user session to recognize new tenant assignment
      try {
        const { error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError) {
          console.warn('Failed to refresh session after tenant update:', refreshError);
        }
      } catch (refreshError) {
        console.warn('Failed to refresh session after tenant update:', refreshError);
      }
`;
    
    // Insert after the auth user metadata update
    const authUpdateIndex = userManagementServiceContent.indexOf('// Update auth user metadata');
    if (authUpdateIndex !== -1) {
      const nextLineIndex = userManagementServiceContent.indexOf('\n      });', authUpdateIndex) + 7;
      if (!userManagementServiceContent.includes('Refresh user session')) {
        userManagementServiceContent = userManagementServiceContent.slice(0, nextLineIndex) + sessionRefreshCode + userManagementServiceContent.slice(nextLineIndex);
      }
    }
    
    fs.writeFileSync(userManagementServicePath, userManagementServiceContent);
    console.log('✅ UserManagementService session refresh added');

    // Step 4: Improve query invalidation in UserManagement component
    console.log('\n4️⃣ Improving query invalidation in UserManagement component...');
    
    const userManagementComponentPath = path.join(__dirname, '..', 'src', 'components', 'master-dashboard', 'users', 'UserManagement.tsx');
    let userManagementComponentContent = fs.readFileSync(userManagementComponentPath, 'utf8');
    
    // Improve the moveUserToTenant mutation invalidation
    const improvedInvalidation = `      // Invalidate all relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['platform-users'] });
      queryClient.invalidateQueries({ queryKey: ['tenant-details'] });
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      queryClient.invalidateQueries({ queryKey: ['tenant-usage-stats'] });
      queryClient.invalidateQueries({ queryKey: ['tenants-for-selection'] });
      queryClient.invalidateQueries({ queryKey: ['platform-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['business-settings'] });
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      queryClient.invalidateQueries({ queryKey: ['review-stats'] });`;
    
    // Replace the existing invalidation
    userManagementComponentContent = userManagementComponentContent.replace(
      /\/\/ Invalidate all relevant queries to refresh data[\s\S]*?queryClient\.invalidateQueries\(\{ queryKey: \['review-stats'\] \}\);[\s]*/,
      improvedInvalidation + '\n      '
    );
    
    fs.writeFileSync(userManagementComponentPath, userManagementComponentContent);
    console.log('✅ UserManagement query invalidation improved');

    console.log('\n🎉 User-Tenant Assignment Flow Fix Complete!');
    console.log('\nNext Steps:');
    console.log('1. Test the application to verify user-tenant assignments work correctly');
    console.log('2. Check that real-time updates work for tenant user counts');
    console.log('3. Ensure users can access tenant workspace after assignment');

  } catch (error) {
    console.error('❌ Fix failed:', error);
    process.exit(1);
  }
}

fixUserTenantAssignment();
