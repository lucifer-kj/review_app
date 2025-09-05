import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { TenantService } from '@/services/tenantService';
import type { Tenant } from '@/types/tenant.types';

interface TenantContextType {
  tenant: Tenant | null;
  loading: boolean;
  error: string | null;
  refreshTenant: () => Promise<void>;
  isSuperAdmin: boolean;
  isTenantAdmin: boolean;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

interface TenantProviderProps {
  children: ReactNode;
}

export function TenantProvider({ children }: TenantProviderProps) {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isTenantAdmin, setIsTenantAdmin] = useState(false);

  const refreshTenant = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await TenantService.getCurrentTenant();
      
      if (response.success && response.data) {
        setTenant(response.data);
        
        // Check user roles based on tenant context
        // This would typically come from the user's profile
        // For now, we'll determine this based on tenant access
        setIsSuperAdmin(false); // Would be determined by user profile
        setIsTenantAdmin(true); // Would be determined by user profile
      } else {
        setTenant(null);
        setIsSuperAdmin(false);
        setIsTenantAdmin(false);
        
        if (response.error) {
          setError(response.error);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tenant context');
      setTenant(null);
      setIsSuperAdmin(false);
      setIsTenantAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshTenant();
  }, []);

  const contextValue: TenantContextType = {
    tenant,
    loading,
    error,
    refreshTenant,
    isSuperAdmin,
    isTenantAdmin,
  };

  return React.createElement(
    TenantContext.Provider,
    { value: contextValue },
    children
  );
}

export function useTenantContext(): TenantContextType {
  const context = useContext(TenantContext);
  
  if (context === undefined) {
    throw new Error('useTenantContext must be used within a TenantProvider');
  }
  
  return context;
}

// Convenience hooks for specific tenant operations
export function useCurrentTenant() {
  const { tenant, loading, error } = useTenantContext();
  return { tenant, loading, error };
}

export function useTenantPermissions() {
  const { isSuperAdmin, isTenantAdmin } = useTenantContext();
  return { isSuperAdmin, isTenantAdmin };
}

export function useRefreshTenant() {
  const { refreshTenant } = useTenantContext();
  return refreshTenant;
}
