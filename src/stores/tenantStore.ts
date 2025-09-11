/**
 * Tenant Store - Zustand implementation
 * Replaces TenantProvider context and useTenantContext hook
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { supabase } from '@/integrations/supabase/client';
import { TenantService } from '@/services/tenantService';
import { env } from '@/utils/env';
import type { BaseStore } from './types';

export interface Tenant {
  id: string;
  name: string;
  domain?: string;
  status: 'active' | 'suspended' | 'pending';
  plan_type: 'basic' | 'premium' | 'enterprise';
  settings?: {
    description?: string;
    features?: {
      analytics: boolean;
      custom_domain: boolean;
      api_access: boolean;
      priority_support: boolean;
    };
    limits?: {
      max_users: number;
      max_reviews: number;
      storage_limit: number;
    };
    review_form_url?: string;
  };
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface TenantMetrics {
  total_users: number;
  total_reviews: number;
  active_users: number;
  storage_used: number;
  api_calls_count: number;
  last_activity: string;
}

export interface TenantState extends BaseStore {
  // Core tenant state
  currentTenant: Tenant | null;
  tenants: Tenant[];
  availableTenants: Tenant[];
  
  // Tenant metrics
  metrics: TenantMetrics | null;
  
  // UI state
  selectedTenantId: string | null;
  showTenantSwitcher: boolean;
  
  // Cache state
  lastFetch: number;
  cacheExpiry: number;
}

export interface TenantActions {
  // Core tenant actions
  setCurrentTenant: (tenant: Tenant | null) => void;
  setTenants: (tenants: Tenant[]) => void;
  setAvailableTenants: (tenants: Tenant[]) => void;
  
  // Tenant management
  switchTenant: (tenantId: string) => Promise<{ success: boolean; error?: string }>;
  refreshTenants: () => Promise<void>;
  refreshCurrentTenant: () => Promise<void>;
  refreshMetrics: () => Promise<void>;
  
  // Tenant operations
  createTenant: (tenantData: Partial<Tenant>) => Promise<{ success: boolean; data?: Tenant; error?: string }>;
  updateTenant: (tenantId: string, updates: Partial<Tenant>) => Promise<{ success: boolean; error?: string }>;
  deleteTenant: (tenantId: string) => Promise<{ success: boolean; error?: string }>;
  
  // Tenant settings
  updateTenantSettings: (tenantId: string, settings: Partial<Tenant['settings']>) => Promise<{ success: boolean; error?: string }>;
  
  // UI actions
  setSelectedTenantId: (tenantId: string | null) => void;
  toggleTenantSwitcher: () => void;
  setShowTenantSwitcher: (show: boolean) => void;
  
  // Cache management
  clearCache: () => void;
  isCacheValid: () => boolean;
  
  // Initialization
  initialize: () => Promise<void>;
  reset: () => void;
}

export type TenantStore = TenantState & TenantActions;

const initialState: TenantState = {
  // Base store state
  loading: true,
  error: null,
  setLoading: () => {},
  setError: () => {},
  clearError: () => {},
  
  // Tenant state
  currentTenant: null,
  tenants: [],
  availableTenants: [],
  
  // Metrics
  metrics: null,
  
  // UI state
  selectedTenantId: null,
  showTenantSwitcher: false,
  
  // Cache state
  lastFetch: 0,
  cacheExpiry: 5 * 60 * 1000, // 5 minutes
};

export const useTenantStore = create<TenantStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        // Base store actions
        setLoading: (loading: boolean) => set({ loading }),
        setError: (error: string | null) => set({ error }),
        clearError: () => set({ error: null }),

        // Core tenant actions
        setCurrentTenant: (tenant: Tenant | null) => {
          set({ currentTenant: tenant });
          if (tenant) {
            get().setSelectedTenantId(tenant.id);
          }
        },

        setTenants: (tenants: Tenant[]) => {
          set({ tenants, lastFetch: Date.now() });
        },

        setAvailableTenants: (tenants: Tenant[]) => {
          set({ availableTenants: tenants });
        },

        // Tenant management
        switchTenant: async (tenantId: string) => {
          try {
            set({ loading: true, error: null });
            
            const { tenants } = get();
            const tenant = tenants.find(t => t.id === tenantId);
            
            if (!tenant) {
              set({ error: 'Tenant not found', loading: false });
              return { success: false, error: 'Tenant not found' };
            }

            // Update current tenant
            get().setCurrentTenant(tenant);
            
            // Refresh tenant-specific data
            await get().refreshMetrics();
            
            set({ loading: false });
            return { success: true };
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to switch tenant';
            set({ error: errorMessage, loading: false });
            return { success: false, error: errorMessage };
          }
        },

        refreshTenants: async () => {
          try {
            set({ loading: true, error: null });
            
            const response = await TenantService.getCurrentTenant();
            
            if (response.success && response.data) {
              const currentTenant = response.data;
              get().setCurrentTenant(currentTenant);
              
              // For super admins, fetch all tenants
              const { data: { user } } = await supabase.auth.getUser();
              if (user) {
                const { data: profile } = await supabase
                  .from('profiles')
                  .select('role')
                  .eq('id', user.id)
                  .single();
                
                if (profile?.role === 'super_admin') {
                  const allTenantsResponse = await TenantService.getAllTenants();
                  if (allTenantsResponse.success && allTenantsResponse.data) {
                    get().setTenants(allTenantsResponse.data);
                    get().setAvailableTenants(allTenantsResponse.data);
                  }
                } else {
                  // Regular users only see their current tenant
                  get().setTenants([currentTenant]);
                  get().setAvailableTenants([currentTenant]);
                }
              }
            } else if (response.error === 'User not assigned to any tenant') {
              // Handle case where user doesn't have a tenant assigned
              set({ 
                currentTenant: null,
                tenants: [],
                availableTenants: [],
                error: null,
                loading: false 
              });
              return;
            } else {
              set({ error: response.error || 'Failed to fetch tenant', loading: false });
            }
            
            set({ loading: false });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to refresh tenants';
            set({ error: errorMessage, loading: false });
          }
        },

        refreshCurrentTenant: async () => {
          try {
            const { currentTenant } = get();
            if (!currentTenant) return;

            const response = await TenantService.getTenantById(currentTenant.id);
            
            if (response.success && response.data) {
              get().setCurrentTenant(response.data);
            }
          } catch (error) {
            console.error('Failed to refresh current tenant:', error);
          }
        },

        refreshMetrics: async () => {
          try {
            const { currentTenant } = get();
            if (!currentTenant) return;

            const response = await TenantService.getTenantMetrics(currentTenant.id);
            
            if (response.success && response.data) {
              set({ metrics: response.data });
            }
          } catch (error) {
            console.error('Failed to refresh tenant metrics:', error);
          }
        },

        // Tenant operations
        createTenant: async (tenantData: Partial<Tenant>) => {
          try {
            set({ loading: true, error: null });
            
            const response = await TenantService.createTenant(tenantData);
            
            if (response.success && response.data) {
              const newTenant = response.data;
              const { tenants } = get();
              get().setTenants([...tenants, newTenant]);
              get().setAvailableTenants([...get().availableTenants, newTenant]);
              
              set({ loading: false });
              return { success: true, data: newTenant };
            } else {
              set({ error: response.error || 'Failed to create tenant', loading: false });
              return { success: false, error: response.error || 'Failed to create tenant' };
            }
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to create tenant';
            set({ error: errorMessage, loading: false });
            return { success: false, error: errorMessage };
          }
        },

        updateTenant: async (tenantId: string, updates: Partial<Tenant>) => {
          try {
            set({ loading: true, error: null });
            
            const response = await TenantService.updateTenant(tenantId, updates);
            
            if (response.success) {
              // Update local state
              const { tenants, currentTenant } = get();
              const updatedTenants = tenants.map(t => 
                t.id === tenantId ? { ...t, ...updates } : t
              );
              
              get().setTenants(updatedTenants);
              get().setAvailableTenants(updatedTenants);
              
              if (currentTenant?.id === tenantId) {
                get().setCurrentTenant({ ...currentTenant, ...updates });
              }
              
              set({ loading: false });
              return { success: true };
            } else {
              set({ error: response.error || 'Failed to update tenant', loading: false });
              return { success: false, error: response.error || 'Failed to update tenant' };
            }
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to update tenant';
            set({ error: errorMessage, loading: false });
            return { success: false, error: errorMessage };
          }
        },

        deleteTenant: async (tenantId: string) => {
          try {
            set({ loading: true, error: null });
            
            const response = await TenantService.deleteTenant(tenantId);
            
            if (response.success) {
              // Remove from local state
              const { tenants, currentTenant } = get();
              const updatedTenants = tenants.filter(t => t.id !== tenantId);
              
              get().setTenants(updatedTenants);
              get().setAvailableTenants(updatedTenants);
              
              if (currentTenant?.id === tenantId) {
                get().setCurrentTenant(null);
              }
              
              set({ loading: false });
              return { success: true };
            } else {
              set({ error: response.error || 'Failed to delete tenant', loading: false });
              return { success: false, error: response.error || 'Failed to delete tenant' };
            }
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to delete tenant';
            set({ error: errorMessage, loading: false });
            return { success: false, error: errorMessage };
          }
        },

        // Tenant settings
        updateTenantSettings: async (tenantId: string, settings: Partial<Tenant['settings']>) => {
          try {
            const { currentTenant } = get();
            if (!currentTenant || currentTenant.id !== tenantId) {
              return { success: false, error: 'Invalid tenant' };
            }

            const updatedSettings = { ...currentTenant.settings, ...settings };
            const result = await get().updateTenant(tenantId, { settings: updatedSettings });
            
            return result;
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to update tenant settings';
            return { success: false, error: errorMessage };
          }
        },

        // UI actions
        setSelectedTenantId: (tenantId: string | null) => {
          set({ selectedTenantId: tenantId });
        },

        toggleTenantSwitcher: () => {
          set({ showTenantSwitcher: !get().showTenantSwitcher });
        },

        setShowTenantSwitcher: (show: boolean) => {
          set({ showTenantSwitcher: show });
        },

        // Cache management
        clearCache: () => {
          set({ lastFetch: 0 });
        },

        isCacheValid: () => {
          const { lastFetch, cacheExpiry } = get();
          return Date.now() - lastFetch < cacheExpiry;
        },

        // Initialization
        initialize: async () => {
          try {
            set({ loading: true, error: null });
            
            // Check if Supabase is properly configured
            if (!env.supabase.url || env.supabase.url.includes('placeholder') || 
                !env.supabase.anonKey || env.supabase.anonKey.includes('placeholder')) {
              console.warn('Supabase not properly configured, skipping tenant initialization');
              set({
                currentTenant: null,
                tenants: [],
                availableTenants: [],
                error: 'Supabase not configured',
                loading: false
              });
              return;
            }
            
            // Check if cache is valid
            if (get().isCacheValid() && get().tenants.length > 0) {
              set({ loading: false });
              return;
            }
            
            await get().refreshTenants();
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Initialization failed';
            set({ error: errorMessage, loading: false });
          }
        },

        reset: () => {
          set(initialState);
        },
      }),
      {
        name: 'tenant-storage',
        partialize: (state) => ({
          currentTenant: state.currentTenant,
          selectedTenantId: state.selectedTenantId,
          lastFetch: state.lastFetch,
        }),
        version: 1,
      }
    ),
    { 
      name: 'tenant-store',
      enabled: process.env.NODE_ENV === 'development'
    }
  )
);

// Selector hooks for performance optimization
export const useCurrentTenant = () => useTenantStore((state) => state.currentTenant);
export const useTenants = () => useTenantStore((state) => state.tenants);
export const useAvailableTenants = () => useTenantStore((state) => state.availableTenants);
export const useTenantMetrics = () => useTenantStore((state) => state.metrics);
export const useTenantLoading = () => useTenantStore((state) => state.loading);
export const useTenantError = () => useTenantStore((state) => state.error);
export const useSelectedTenantId = () => useTenantStore((state) => state.selectedTenantId);
export const useShowTenantSwitcher = () => useTenantStore((state) => state.showTenantSwitcher);

// Action selectors
export const useTenantActions = () => useTenantStore((state) => ({
  switchTenant: state.switchTenant,
  refreshTenants: state.refreshTenants,
  refreshCurrentTenant: state.refreshCurrentTenant,
  refreshMetrics: state.refreshMetrics,
  createTenant: state.createTenant,
  updateTenant: state.updateTenant,
  deleteTenant: state.deleteTenant,
  updateTenantSettings: state.updateTenantSettings,
  toggleTenantSwitcher: state.toggleTenantSwitcher,
  setShowTenantSwitcher: state.setShowTenantSwitcher,
  clearCache: state.clearCache,
  initialize: state.initialize,
  reset: state.reset,
}));

// Computed selectors
export const useCurrentTenantId = () => useTenantStore((state) => state.currentTenant?.id);
export const useCurrentTenantName = () => useTenantStore((state) => state.currentTenant?.name);
export const useCurrentTenantStatus = () => useTenantStore((state) => state.currentTenant?.status);
export const useIsTenantActive = () => useTenantStore((state) => state.currentTenant?.status === 'active');

// Tenant switcher selectors
export const useTenantSwitcherActions = () => useTenantStore((state) => ({
  switchTenant: state.switchTenant,
  toggleTenantSwitcher: state.toggleTenantSwitcher,
  setShowTenantSwitcher: state.setShowTenantSwitcher,
}));
