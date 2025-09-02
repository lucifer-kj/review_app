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
  const requiredVars = {
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
  };

  const missingVars = Object.entries(requiredVars)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}\n` +
      'Please check your .env file and ensure all required variables are set.'
    );
  }

  return {
    supabase: {
      url: import.meta.env.VITE_SUPABASE_URL!,
      anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY!,
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
