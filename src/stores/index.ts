/**
 * Store exports and composition
 * Central entry point for all Zustand stores
 */

// Core stores
export { useAuthStore, useAuthUser, useAuthSession, useAuthProfile, useAuthTenant, useAuthLoading, useAuthError, useIsAuthenticated, useIsEmailVerified, useAuthActions, useIsAdmin, useIsSuperAdmin, useIsTenantAdmin } from './authStore';
export { useTenantStore, useCurrentTenant, useTenants, useAvailableTenants, useTenantMetrics, useTenantLoading, useTenantError, useSelectedTenantId, useShowTenantSwitcher, useTenantActions, useCurrentTenantId, useCurrentTenantName, useCurrentTenantStatus, useIsTenantActive, useTenantSwitcherActions } from './tenantStore';

// Types
export type { BaseStore, StoreAction, StoreSelector, StoreMiddleware, PersistConfig, DevToolsConfig } from './types';

// Store composition for complex operations
export { useAppStore } from './appStore';
