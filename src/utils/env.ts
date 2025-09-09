/**
 * Environment Configuration Utility
 * Centralized environment variable management with validation
 */

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
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const supabaseServiceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

  // Check if Supabase variables are missing
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
      'Missing Supabase environment variables. Please create a .env file with:\n' +
      'VITE_SUPABASE_URL=https://your-project.supabase.co\n' +
      'VITE_SUPABASE_ANON_KEY=your_supabase_anon_key\n' +
      'VITE_SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key\n\n' +
      'For now, using placeholder values. Review form submissions will not work.'
    );
  }

  // Get frontend URL with fallback
  const frontendUrl = import.meta.env.VITE_FRONTEND_URL || 
    (typeof window !== 'undefined' ? window.location.origin : 'https://demo.alphabusinessdesigns.co.in');

  return {
    supabase: {
      url: supabaseUrl || 'https://placeholder.supabase.co',
      anonKey: supabaseAnonKey || 'placeholder_key',
      serviceRoleKey: supabaseServiceRoleKey,
    },
    frontend: {
      url: frontendUrl,
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
        url: 'http://localhost:5173',
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
