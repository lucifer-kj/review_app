// Multi-tenancy type definitions for Alpha Business Designs

export interface Tenant {
  id: string;
  name: string;
  domain?: string;
  plan_type: 'basic' | 'pro' | 'enterprise';
  status: 'active' | 'suspended' | 'pending' | 'cancelled';
  settings: Record<string, any>;
  billing_email?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface UserInvitation {
  id: string;
  tenant_id: string;
  email: string;
  role: 'super_admin' | 'tenant_admin' | 'user';
  invited_by?: string;
  token: string;
  expires_at: string;
  used_at?: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  tenant_id?: string;
  user_id?: string;
  action: string;
  resource_type?: string;
  resource_id?: string;
  details: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface UsageMetric {
  id: string;
  tenant_id: string;
  metric_type: string;
  metric_value: number;
  metadata: Record<string, any>;
  recorded_at: string;
}

export interface SystemSetting {
  id: string;
  key: string;
  value: Record<string, any>;
  description?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
}

// Extended profile with tenant context
export interface TenantProfile {
  id: string;
  tenant_id: string;
  role: 'super_admin' | 'tenant_admin' | 'user';
  created_at: string;
  updated_at: string;
}

// Platform analytics for master dashboard
export interface PlatformAnalytics {
  total_tenants: number;
  total_users: number;
  total_reviews: number;
  active_tenants: number;
  revenue_current_month: number;
  growth_rate: number;
}

// Tenant usage statistics
export interface TenantUsageStats {
  reviews_count: number;
  users_count: number;
  storage_used: number;
  api_calls_count: number;
  last_activity: string;
}

// Create tenant data
export interface CreateTenantData {
  name: string;
  domain?: string;
  plan_type?: 'basic' | 'pro' | 'enterprise';
  settings?: Record<string, any>;
  billing_email?: string;
}

// Tenant filters for listing
export interface TenantFilters {
  search?: string;
  status?: 'active' | 'suspended' | 'pending' | 'cancelled';
  plan_type?: 'basic' | 'pro' | 'enterprise';
  page?: number;
  limit?: number;
}

// User invitation data
export interface CreateInvitationData {
  email: string;
  role: 'tenant_admin' | 'user';
  tenant_id: string;
}

// Audit log filters
export interface AuditLogFilters {
  tenant_id?: string;
  user_id?: string;
  action?: string;
  resource_type?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
}

// Usage metric data
export interface CreateUsageMetricData {
  tenant_id: string;
  metric_type: string;
  metric_value: number;
  metadata?: Record<string, any>;
}

// System setting data
export interface CreateSystemSettingData {
  key: string;
  value: Record<string, any>;
  description?: string;
}

// Role hierarchy
export type UserRole = 'super_admin' | 'tenant_admin' | 'user';

// Tenant status
export type TenantStatus = 'active' | 'suspended' | 'pending' | 'cancelled';

// Plan types
export type PlanType = 'basic' | 'pro' | 'enterprise';

// API response types
export interface TenantListResponse {
  tenants: Tenant[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface UserListResponse {
  users: TenantProfile[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface AuditLogResponse {
  logs: AuditLog[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface InvitationListResponse {
  invitations: UserInvitation[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}
