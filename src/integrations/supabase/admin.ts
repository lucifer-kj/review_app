// Supabase Admin Client Configuration for Crux
// This client uses the service role key for admin operations
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { env } from '@/utils/env';

// Admin client with service role key for admin operations
export const supabaseAdmin = createClient<Database>(
  env.supabase.url, 
  env.supabase.serviceRoleKey!, // Service role key
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    db: {
      schema: 'public'
    },
    global: {
      headers: {
        'X-Client-Info': 'supabase-js/2.0.0-admin'
      }
    }
  }
);

// Helper function to check if admin client is properly configured
export const isAdminClientConfigured = () => {
  return !!(env.supabase.serviceRoleKey && 
    env.supabase.serviceRoleKey !== 'placeholder_service_key');
};

// Helper function for admin operations with error handling
export const withAdminAuth = async <T>(
  operation: () => Promise<T>
): Promise<T> => {
  if (!isAdminClientConfigured()) {
    throw new Error('Admin client not properly configured. Please check your service role key.');
  }
  
  try {
    return await operation();
  } catch (error) {
    console.error('Admin operation failed:', error);
    throw error;
  }
};
