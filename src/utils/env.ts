/**
 * Environment Configuration Utility
 * Centralized environment variable management with validation
 */

interface EnvironmentConfig {
  // Supabase Configuration
  supabase: {
    url: string;
    anonKey: string;
  };
  
  // Email Configuration
  email: {
    domain: string;
    fromName: string;
    template: string;
    primaryColor: string;
    buttonText: string;
    title: string;
  };
  
  // Frontend Configuration
  frontend: {
    url: string;
  };
  
  // Security Configuration
  security: {
    allowedOrigins: string[];
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

  // Check if Supabase variables are missing
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
      'Missing Supabase environment variables. Please create a .env file with:\n' +
      'VITE_SUPABASE_URL=your_supabase_project_url\n' +
      'VITE_SUPABASE_ANON_KEY=your_supabase_anon_key\n\n' +
      'For now, using placeholder values. Review form submissions will not work.'
    );
  }

  return {
    supabase: {
      url: supabaseUrl || 'https://placeholder.supabase.co',
      anonKey: supabaseAnonKey || 'placeholder_key',
    },
    email: {
      domain: import.meta.env.VITE_EMAIL_DOMAIN || 'alphabusiness.com',
      fromName: import.meta.env.VITE_EMAIL_FROM_NAME || 'noreply',
      template: import.meta.env.VITE_EMAIL_TEMPLATE || 'default',
      primaryColor: import.meta.env.VITE_EMAIL_PRIMARY_COLOR || '#007bff',
      buttonText: import.meta.env.VITE_EMAIL_BUTTON_TEXT || 'Leave a Review',
      title: import.meta.env.VITE_EMAIL_TITLE || "We'd love your feedback!",
    },
    frontend: {
      url: import.meta.env.VITE_FRONTEND_URL || window.location.origin,
    },
    security: {
      allowedOrigins: import.meta.env.VITE_ALLOWED_ORIGINS?.split(',') || [
        'http://localhost:3000',
        'http://localhost:5173',
        window.location.origin,
      ],
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
      email: {
        ...env.email,
        domain: 'localhost',
      },
    };
  }
  
  return env;
};
