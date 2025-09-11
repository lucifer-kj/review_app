/**
 * Environment Configuration Utility
 * Centralized environment variable management with validation
 */

import { validateEnvironment as validateEnvVars, getEnvironmentError, getOptionalEnvVars } from './envValidation';

interface EnvironmentConfig {
  // Supabase Configuration
  supabase: {
    url: string;
    anonKey: string;
    serviceRoleKey?: string;
  };
  
  // Frontend Configuration
  frontend: {
    url: string;
  };
  
  // App Configuration
  app: {
    name: string;
    supportEmail?: string;
  };
  
  // Optional Services
  services: {
    sentryDsn?: string;
    gaTrackingId?: string;
  };
}

/**
 * Validate required environment variables
 */
const validateEnvironment = (): EnvironmentConfig => {
  // Validate environment variables
  const envError = getEnvironmentError();
  if (envError) {
    console.error('Environment validation failed:', envError);
    // Don't throw error in production, use fallback values
    if (import.meta.env.PROD) {
      console.warn('Using fallback environment configuration');
    } else {
      throw new Error(envError);
    }
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const supabaseServiceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

  // Get frontend URL with fallback
  const frontendUrl = import.meta.env.VITE_FRONTEND_URL || 
    (typeof window !== 'undefined' ? window.location.origin : 'https://crux.alphabusinessdigital.com');

  // Get optional environment variables
  const optionalVars = getOptionalEnvVars();

  return {
    supabase: {
      url: supabaseUrl || 'https://placeholder.supabase.co',
      anonKey: supabaseAnonKey || 'placeholder_key',
      serviceRoleKey: supabaseServiceRoleKey,
    },
    frontend: {
      url: frontendUrl,
    },
    app: {
      name: optionalVars.VITE_APP_NAME || 'Crux',
      supportEmail: optionalVars.VITE_SUPPORT_EMAIL,
    },
    services: {
      sentryDsn: import.meta.env.VITE_SENTRY_DSN,
      gaTrackingId: import.meta.env.VITE_GA_TRACKING_ID,
    },
  };
};

/**
 * Get validated environment configuration
 */
export const env = validateEnvironment();

/**
 * Check if running in development mode
 */
export const isDevelopment = import.meta.env.DEV;

/**
 * Check if running in production mode
 */
export const isProduction = import.meta.env.PROD;

/**
 * Get environment-specific configuration
 */
export const getEnvironmentConfig = () => {
  if (isDevelopment) {
    return {
      ...env,
      // Development-specific overrides
      frontend: {
        ...env.frontend,
        url: import.meta.env.VITE_DEV_URL || 'http://localhost:5173',
      },
    };
  }
  
  return env;
};

/**
 * Check if Supabase is properly configured
 */
export const isSupabaseConfigured = (): boolean => {
  return !!(env.supabase.url && 
    env.supabase.anonKey && 
    env.supabase.serviceRoleKey &&
    env.supabase.url !== 'https://placeholder.supabase.co' && 
    env.supabase.anonKey !== 'placeholder_key' &&
    env.supabase.serviceRoleKey !== 'placeholder_service_key');
};
