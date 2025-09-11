// Supabase client configuration for Crux
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { env } from '@/utils/env';

// Single Supabase client instance to prevent multiple instances warning
// Use fallback values if environment variables are not set
const supabaseUrl = env.supabase.url || 'https://placeholder.supabase.co';
const supabaseAnonKey = env.supabase.anonKey || 'placeholder_key';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'X-Client-Info': 'supabase-js/2.0.0'
    }
  }
});

// Alias for backward compatibility (same instance)
export const supabasePublic = supabase;

// Helper function to check if Supabase is properly configured
export const isSupabaseConfigured = () => {
  return env.supabase.url !== 'https://elhbthnvwcqewjpwulhq.supabase.co' && 
         env.supabase.anonKey !== 'placeholder_key';
};