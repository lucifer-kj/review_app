import type { Tables } from "@/integrations/supabase/types";

// Database types
export type Review = Tables<'reviews'>;
export type Profile = Tables<'profiles'>;

// Form data types
export interface ReviewFormData {
  name: string;
  phone: string;
  countryCode: string;
  rating: number;
}



// Dashboard types
export interface DashboardStats {
  totalReviews: number;
  averageRating: number;
  highRatingReviews: number;
}

// API response types
export interface ApiResponse<T> {
  data: T;
  error?: string;
}

// Filter types
export type RatingFilter = 'all' | 'high' | 'low';

// Share types
export interface ShareData {
  title: string;
  description: string;
  url: string;
}

// Auth types
export interface AuthState {
  user: {
    id: string;
    email?: string;
    phone?: string;
    [key: string]: unknown;
  } | null;
  session: {
    access_token: string;
    refresh_token: string;
    expires_at: number;
    [key: string]: unknown;
  } | null;
  loading: boolean;
  isAuthenticated: boolean;
}

// Business settings types
export interface BusinessSettings {
  id?: string;
  google_business_url: string | null;
  business_name: string | null;
  business_email: string | null;
  business_phone: string | null;
  business_address: string | null;
  created_at?: string;
  updated_at?: string;
}
