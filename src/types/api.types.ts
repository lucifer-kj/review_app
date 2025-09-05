/**
 * Comprehensive API types for Crux application
 * Provides strict typing for all service responses and data structures
 */

// Base API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Error Types
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: string;
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

// Service Response Types
export interface ServiceResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  statusCode?: number;
}

// User and Authentication Types
export interface User {
  id: string;
  email: string;
  role: 'super_admin' | 'tenant_admin' | 'user';
  tenant_id?: string;
  created_at: string;
  updated_at: string;
  last_sign_in_at?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  role: 'super_admin' | 'tenant_admin' | 'user';
  tenant_id?: string;
  created_at: string;
  updated_at: string;
}

// Tenant Types
export interface Tenant {
  id: string;
  name: string;
  slug: string;
  status: 'active' | 'suspended' | 'pending';
  plan: 'free' | 'pro' | 'enterprise';
  created_at: string;
  updated_at: string;
  settings?: TenantSettings;
}

export interface TenantSettings {
  max_users: number;
  max_reviews: number;
  features: string[];
  custom_domain?: string;
  branding?: {
    logo_url?: string;
    primary_color?: string;
    secondary_color?: string;
  };
}

// Review Types
export interface Review {
  id: string;
  tenant_id: string;
  customer_name: string;
  customer_email?: string;
  rating: number;
  review_text: string;
  status: 'pending' | 'approved' | 'rejected';
  source: 'website' | 'email' | 'api';
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
}

export interface ReviewStats {
  total_reviews: number;
  average_rating: number;
  high_rating_reviews: number;
  recent_reviews: number;
  rating_distribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

// Business Settings Types
export interface BusinessSettings {
  id: string;
  user_id?: string;
  tenant_id?: string;
  business_name: string;
  business_email: string;
  business_phone?: string;
  business_address?: string;
  google_business_url?: string;
  website_url?: string;
  social_media?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
  };
  created_at: string;
  updated_at: string;
}

// Invitation Types
export interface UserInvitation {
  id: string;
  tenant_id: string;
  email: string;
  role: 'user' | 'tenant_admin';
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  invited_by: string;
  token: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
  accepted_at?: string;
}

// Analytics Types
export interface PlatformAnalytics {
  total_tenants: number;
  total_users: number;
  total_reviews: number;
  active_tenants: number;
  revenue_current_month: number;
  growth_rate: number;
  top_performing_tenants: Array<{
    tenant_id: string;
    tenant_name: string;
    review_count: number;
    average_rating: number;
  }>;
}

export interface TenantAnalytics {
  tenant_id: string;
  reviews_count: number;
  users_count: number;
  storage_used: number;
  api_calls_count: number;
  last_activity: string;
  monthly_growth: number;
  top_review_sources: Array<{
    source: string;
    count: number;
    percentage: number;
  }>;
}

// Audit Log Types
export interface AuditLog {
  id: string;
  tenant_id?: string;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  details: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

// Usage Metrics Types
export interface UsageMetric {
  id: string;
  tenant_id: string;
  metric_type: 'reviews' | 'users' | 'storage' | 'api_calls' | 'revenue';
  metric_value: number;
  recorded_at: string;
  metadata?: Record<string, any>;
}

// System Settings Types
export interface SystemSetting {
  id: string;
  key: string;
  value: string;
  description?: string;
  category: 'email' | 'security' | 'features' | 'billing' | 'general';
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

// Email Types
export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  html_content: string;
  text_content: string;
  variables: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EmailCampaign {
  id: string;
  tenant_id: string;
  name: string;
  template_id: string;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed';
  scheduled_at?: string;
  sent_at?: string;
  recipient_count: number;
  success_count: number;
  failure_count: number;
  created_at: string;
  updated_at: string;
}

// Form Validation Types
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'select' | 'textarea' | 'checkbox';
  required: boolean;
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    custom?: (value: any) => string | null;
  };
}

export interface FormState<T = Record<string, unknown>> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isSubmitting: boolean;
  isValid: boolean;
}

// Component Props Types
export interface ComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface LoadingProps extends ComponentProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

export interface ErrorProps extends ComponentProps {
  error?: Error;
  message?: string;
  onRetry?: () => void;
}

// Hook Return Types
export interface UseQueryResult<T> {
  data: T | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
}

export interface UseMutationResult<T, V> {
  mutate: (variables: V) => Promise<T>;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  isSuccess: boolean;
}

// Event Types
export interface CustomEvent<T = any> {
  type: string;
  payload: T;
  timestamp: string;
  source: string;
}

// Configuration Types
export interface AppConfig {
  name: string;
  version: string;
  environment: 'development' | 'staging' | 'production';
  apiUrl: string;
  features: {
    emailService: boolean;
    analytics: boolean;
    multiTenancy: boolean;
    auditLogs: boolean;
  };
  limits: {
    maxFileSize: number;
    maxUsersPerTenant: number;
    maxReviewsPerTenant: number;
  };
}

// Export all types as a namespace for easier imports
export namespace CruxTypes {
  export type ApiResponse<T = any> = ApiResponse<T>;
  export type PaginatedResponse<T> = PaginatedResponse<T>;
  export type ServiceResponse<T = any> = ServiceResponse<T>;
  export type User = User;
  export type UserProfile = UserProfile;
  export type Tenant = Tenant;
  export type Review = Review;
  export type ReviewStats = ReviewStats;
  export type BusinessSettings = BusinessSettings;
  export type UserInvitation = UserInvitation;
  export type PlatformAnalytics = PlatformAnalytics;
  export type TenantAnalytics = TenantAnalytics;
  export type AuditLog = AuditLog;
  export type UsageMetric = UsageMetric;
  export type SystemSetting = SystemSetting;
  export type EmailTemplate = EmailTemplate;
  export type EmailCampaign = EmailCampaign;
  export type FormField = FormField;
  export type FormState<T = Record<string, any>> = FormState<T>;
  export type ComponentProps = ComponentProps;
  export type LoadingProps = LoadingProps;
  export type ErrorProps = ErrorProps;
  export type UseQueryResult<T> = UseQueryResult<T>;
  export type UseMutationResult<T, V> = UseMutationResult<T, V>;
  export type CustomEvent<T = any> = CustomEvent<T>;
  export type AppConfig = AppConfig;
}
