import type { Tables } from "@/integrations/supabase/types";

// Database types
export type Review = Tables<'reviews'>;
export type Invoice = Tables<'invoices'>;
export type Profile = Tables<'profiles'>;

// Form data types
export interface ReviewFormData {
  name: string;
  phone: string;
  countryCode: string;
  rating: number;
}

export interface InvoiceFormData {
  invoice_number: string;
  customer_name: string;
  customer_email: string;
  customer_address?: string;
  customer_phone?: string;
  item_description: string;
  quantity: number;
  unit_price: number;
  total: number;
  currency: string;
  due_date?: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  notes?: string;
}

// Dashboard types
export interface DashboardStats {
  totalReviews: number;
  averageRating: number;
  totalInvoices: number;
  highRatingReviews: number;
}

// API response types
export interface ApiResponse<T> {
  data: T;
  error?: string;
}

// Filter types
export type RatingFilter = 'all' | 'high' | 'low';
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue';

// Share types
export interface ShareData {
  title: string;
  description: string;
  url: string;
}

// Auth types
export interface AuthState {
  user: any | null;
  session: any | null;
  loading: boolean;
  isAuthenticated: boolean;
}
