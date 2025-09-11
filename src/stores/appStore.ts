/**
 * App Store - Composed store for complex operations
 * Combines multiple stores for cross-store operations
 */

import { useAuthStore } from './authStore';
import { useTenantStore } from './tenantStore';

// Composed store for complex operations that need multiple stores
export const useAppStore = () => {
  const authStore = useAuthStore();
  const tenantStore = useTenantStore();

  return {
    // Auth state
    user: authStore.user,
    session: authStore.session,
    profile: authStore.profile,
    isAuthenticated: authStore.isAuthenticated,
    isEmailVerified: authStore.isEmailVerified,
    
    // Tenant state
    currentTenant: tenantStore.currentTenant,
    tenants: tenantStore.tenants,
    metrics: tenantStore.metrics,
    
    // Combined loading state
    loading: authStore.loading || tenantStore.loading,
    
    // Combined error state
    error: authStore.error || tenantStore.error,
    
    // Combined actions
    actions: {
      // Auth actions
      signIn: authStore.signIn,
      signOut: authStore.signOut,
      signUp: authStore.signUp,
      refreshSession: authStore.refreshSession,
      refreshProfile: authStore.refreshProfile,
      
      // Tenant actions
      switchTenant: tenantStore.switchTenant,
      refreshTenants: tenantStore.refreshTenants,
      refreshMetrics: tenantStore.refreshMetrics,
      
      // Combined initialization
      initialize: async () => {
        await Promise.all([
          authStore.initialize(),
          tenantStore.initialize(),
        ]);
      },
      
      // Combined reset
      reset: () => {
        authStore.reset();
        tenantStore.reset();
      },
    },
    
    // Computed values
    computed: {
      isAdmin: authStore.profile?.role === 'super_admin' || authStore.profile?.role === 'tenant_admin',
      isSuperAdmin: authStore.profile?.role === 'super_admin',
      isTenantAdmin: authStore.profile?.role === 'tenant_admin',
      currentTenantId: tenantStore.currentTenant?.id,
      currentTenantName: tenantStore.currentTenant?.name,
      isTenantActive: tenantStore.currentTenant?.status === 'active',
    },
  };
};
