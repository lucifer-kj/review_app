import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TenantService } from '@/services/tenantService';
import type {
  Tenant,
  PlatformAnalytics,
  TenantFilters,
  CreateTenantData,
  AuditLogFilters
} from '@/types/tenant.types';

// Query keys for React Query
export const superAdminKeys = {
  all: ['super-admin'] as const,
  tenants: () => [...superAdminKeys.all, 'tenants'] as const,
  tenantsList: (filters: TenantFilters) => [...superAdminKeys.tenants(), 'list', filters] as const,
  tenant: (id: string) => [...superAdminKeys.tenants(), 'detail', id] as const,
  analytics: () => [...superAdminKeys.all, 'analytics'] as const,
  auditLogs: (filters: AuditLogFilters) => [...superAdminKeys.all, 'audit-logs', filters] as const,
  systemSettings: () => [...superAdminKeys.all, 'system-settings'] as const,
};

/**
 * Hook to get platform analytics (super admin only)
 */
export function usePlatformAnalytics() {
  return useQuery({
    queryKey: superAdminKeys.analytics(),
    queryFn: () => TenantService.getPlatformAnalytics(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
}

/**
 * Hook to get tenants list with filters
 */
export function useTenantsList(filters: TenantFilters = {}) {
  return useQuery({
    queryKey: superAdminKeys.tenantsList(filters),
    queryFn: () => TenantService.getTenants(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 2,
  });
}

/**
 * Hook to get specific tenant details
 */
export function useTenantDetails(tenantId: string) {
  return useQuery({
    queryKey: superAdminKeys.tenant(tenantId),
    queryFn: () => TenantService.getTenantById(tenantId),
    enabled: !!tenantId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
}

/**
 * Hook to get tenant usage statistics
 */
export function useTenantUsageStats(tenantId: string) {
  return useQuery({
    queryKey: [...superAdminKeys.tenant(tenantId), 'usage-stats'],
    queryFn: () => TenantService.getTenantUsageStats(tenantId),
    enabled: !!tenantId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
}

/**
 * Hook to get audit logs
 */
export function useAuditLogs(filters: AuditLogFilters = {}) {
  return useQuery({
    queryKey: superAdminKeys.auditLogs(filters),
    queryFn: () => TenantService.getAuditLogs(filters),
    staleTime: 1 * 60 * 1000, // 1 minute
    retry: 2,
  });
}

/**
 * Hook to get system settings
 */
export function useSystemSettings() {
  return useQuery({
    queryKey: superAdminKeys.systemSettings(),
    queryFn: () => TenantService.getSystemSettings(),
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
  });
}

/**
 * Hook to create a new tenant
 */
export function useCreateTenant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tenantData, adminEmail }: { tenantData: CreateTenantData; adminEmail: string }) =>
      TenantService.createTenant(tenantData, adminEmail),
    onSuccess: () => {
      // Invalidate tenants list to refresh data
      queryClient.invalidateQueries({ queryKey: superAdminKeys.tenants() });
      queryClient.invalidateQueries({ queryKey: superAdminKeys.analytics() });
    },
    onError: (error) => {
      console.error('Failed to create tenant:', error);
    },
  });
}

/**
 * Hook to update tenant
 */
export function useUpdateTenant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tenantId, updates }: { tenantId: string; updates: Partial<CreateTenantData> }) =>
      TenantService.updateTenant(tenantId, updates),
    onSuccess: (data, variables) => {
      // Update the specific tenant in cache
      queryClient.setQueryData(superAdminKeys.tenant(variables.tenantId), data);
      // Invalidate tenants list
      queryClient.invalidateQueries({ queryKey: superAdminKeys.tenants() });
    },
    onError: (error) => {
      console.error('Failed to update tenant:', error);
    },
  });
}

/**
 * Hook to suspend tenant
 */
export function useSuspendTenant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (tenantId: string) => TenantService.suspendTenant(tenantId),
    onSuccess: (data, tenantId) => {
      // Update tenant status in cache
      queryClient.setQueryData(superAdminKeys.tenant(tenantId), (old: any) => ({
        ...old,
        data: { ...old.data, status: 'suspended' }
      }));
      // Invalidate tenants list
      queryClient.invalidateQueries({ queryKey: superAdminKeys.tenants() });
      // Invalidate analytics
      queryClient.invalidateQueries({ queryKey: superAdminKeys.analytics() });
    },
    onError: (error) => {
      console.error('Failed to suspend tenant:', error);
    },
  });
}

/**
 * Hook to activate tenant
 */
export function useActivateTenant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (tenantId: string) => TenantService.activateTenant(tenantId),
    onSuccess: (data, tenantId) => {
      // Update tenant status in cache
      queryClient.setQueryData(superAdminKeys.tenant(tenantId), (old: any) => ({
        ...old,
        data: { ...old.data, status: 'active' }
      }));
      // Invalidate tenants list
      queryClient.invalidateQueries({ queryKey: superAdminKeys.tenants() });
      // Invalidate analytics
      queryClient.invalidateQueries({ queryKey: superAdminKeys.analytics() });
    },
    onError: (error) => {
      console.error('Failed to activate tenant:', error);
    },
  });
}

/**
 * Hook to create user invitation
 */
export function useCreateInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tenantId, email, role }: { tenantId: string; email: string; role: 'tenant_admin' | 'user' }) =>
      TenantService.createInvitation({ tenant_id: tenantId, email, role }),
    onSuccess: (data, variables) => {
      // Invalidate invitations for the tenant
      queryClient.invalidateQueries({ 
        queryKey: [...superAdminKeys.tenant(variables.tenantId), 'invitations'] 
      });
    },
    onError: (error) => {
      console.error('Failed to create invitation:', error);
    },
  });
}

/**
 * Hook to update system setting
 */
export function useUpdateSystemSetting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ key, value, description }: { key: string; value: Record<string, any>; description?: string }) =>
      TenantService.updateSystemSetting(key, value, description),
    onSuccess: () => {
      // Invalidate system settings
      queryClient.invalidateQueries({ queryKey: superAdminKeys.systemSettings() });
    },
    onError: (error) => {
      console.error('Failed to update system setting:', error);
    },
  });
}

/**
 * Hook to log audit event
 */
export function useLogAuditEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ 
      action, 
      details, 
      resourceType, 
      resourceId 
    }: { 
      action: string; 
      details: Record<string, any>; 
      resourceType?: string; 
      resourceId?: string; 
    }) => TenantService.logAuditEvent(action, details, resourceType, resourceId),
    onSuccess: () => {
      // Invalidate audit logs to show new entry
      queryClient.invalidateQueries({ queryKey: superAdminKeys.all });
    },
    onError: (error) => {
      console.error('Failed to log audit event:', error);
    },
  });
}

/**
 * Hook to record usage metric
 */
export function useRecordUsageMetric() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ 
      tenantId, 
      metricType, 
      metricValue, 
      metadata 
    }: { 
      tenantId: string; 
      metricType: string; 
      metricValue: number; 
      metadata?: Record<string, any>; 
    }) => TenantService.recordUsageMetric({
      tenant_id: tenantId,
      metric_type: metricType,
      metric_value: metricValue,
      metadata
    }),
    onSuccess: () => {
      // Invalidate analytics to reflect new metrics
      queryClient.invalidateQueries({ queryKey: superAdminKeys.analytics() });
    },
    onError: (error) => {
      console.error('Failed to record usage metric:', error);
    },
  });
}
