interface RequiredEnvVars {
  VITE_SUPABASE_URL: string;
  VITE_SUPABASE_ANON_KEY: string;
  VITE_SUPABASE_SERVICE_ROLE_KEY: string;
  VITE_FRONTEND_URL: string;
}

interface OptionalEnvVars {
  VITE_APP_NAME: string;
  VITE_SUPPORT_EMAIL: string;
  VITE_DEV_URL: string;
}

const requiredEnvVars: (keyof RequiredEnvVars)[] = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'VITE_SUPABASE_SERVICE_ROLE_KEY',
  'VITE_FRONTEND_URL'
];

const optionalEnvVars: (keyof OptionalEnvVars)[] = [
  'VITE_APP_NAME',
  'VITE_SUPPORT_EMAIL',
  'VITE_DEV_URL'
];

export function validateEnvironment(): { isValid: boolean; missingVars: string[] } {
  const missingVars: string[] = [];
  
  // Check only required environment variables
  for (const varName of requiredEnvVars) {
    const value = import.meta.env[varName];
    if (!value || value.includes('placeholder') || value.includes('your-')) {
      missingVars.push(varName);
    }
  }
  
  return {
    isValid: missingVars.length === 0,
    missingVars
  };
}

export function getOptionalEnvVars(): Record<string, string> {
  const optionalVars: Record<string, string> = {};
  
  for (const varName of optionalEnvVars) {
    const value = import.meta.env[varName];
    if (value && !value.includes('placeholder') && !value.includes('your-')) {
      optionalVars[varName] = value;
    }
  }
  
  return optionalVars;
}

export function getEnvironmentError(): string | null {
  const { isValid, missingVars } = validateEnvironment();
  
  if (!isValid) {
    return `Missing or invalid environment variables: ${missingVars.join(', ')}`;
  }
  
  return null;
}
