/**
 * Base store types and interfaces for Zustand state management
 */

export interface BaseStore {
  loading: boolean;
  error: string | null;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export interface StoreAction {
  type: string;
  payload?: any;
}

// Common store selectors
export type StoreSelector<T> = (state: T) => any;

// Store middleware types
export interface StoreMiddleware {
  name: string;
  middleware: (config: any) => any;
}

// Persistence configuration
export interface PersistConfig {
  name: string;
  partialize?: (state: any) => any;
  version?: number;
  migrate?: (persistedState: any, version: number) => any;
}

// DevTools configuration
export interface DevToolsConfig {
  name: string;
  enabled?: boolean;
}
