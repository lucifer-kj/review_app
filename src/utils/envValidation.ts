interface RequiredEnvVars {
  VITE_SUPABASE_URL: string;
  VITE_SUPABASE_ANON_KEY: string;
  VITE_SUPABASE_SERVICE_ROLE_KEY: string;
  VITE_APP_NAME: string;
  VITE_FRONTEND_URL: string;
}

const requiredEnvVars: (keyof RequiredEnvVars)[] = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'VITE_SUPABASE_SERVICE_ROLE_KEY',
  'VITE_APP_NAME',
  'VITE_FRONTEND_URL'
];

export function validateEnvironment(): { isValid: boolean; missingVars: string[] } {
  const missingVars: string[] = [];
  
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

export function getEnvironmentError(): string | null {
  const { isValid, missingVars } = validateEnvironment();
  
  if (!isValid) {
    return `Missing or invalid environment variables: ${missingVars.join(', ')}`;
  }
  
  return null;
}
