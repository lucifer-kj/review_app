import { supabase } from "@/integrations/supabase/client";
import { BaseService, type ServiceResponse } from "./baseService";
import type {
  Tenant,
  UserInvitation,
  AuditLog,
  UsageMetric,
  SystemSetting,
  PlatformAnalytics,
  TenantUsageStats,
  CreateTenantData,
  CreateInvitationData,
  CreateUsageMetricData,
  CreateSystemSettingData,
  TenantFilters,
  AuditLogFilters,
  TenantListResponse,
  UserListResponse,
  AuditLogResponse,
  InvitationListResponse
} from "@/types/tenant.types";

export class TenantService extends BaseService {
  /**
   * Get current user's tenant context
   */
  static async getCurrentTenant(): Promise<ServiceResponse<Tenant>> {
    try {
      const { data, error } = await supabase
        .rpc('get_current_tenant_id');

      if (error) {
        return this.handleError(error, 'TenantService.getCurrentTenant');
      }

      if (!data) {
        return {
          data: null,
          error: 'No tenant found for current user',
          success: false,
        };
      }

      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', data)
        .single();

      if (tenantError) {
        return this.handleError(tenantError, 'TenantService.getCurrentTenant');
      }

      return {
        data: tenant,
        error: null,
        success: true,
      };
    } catch (error) {
      return this.handleError(error, 'TenantService.getCurrentTenant');
    }
  }

  /**
   * Create a new tenant with admin user
   */
  static async createTenant(
    tenantData: CreateTenantData,
    adminEmail: string
  ): Promise<ServiceResponse<Tenant>> {
    try {
      const { data, error } = await supabase
        .rpc('create_tenant_with_admin', {
          tenant_data: tenantData,
          admin_email: adminEmail
        });

      if (error) {
        return this.handleError(error, 'TenantService.createTenant');
      }

      // Get the created tenant
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', data)
        .single();

      if (tenantError) {
        return this.handleError(tenantError, 'TenantService.createTenant');
      }

      return {
        data: tenant,
        error: null,
        success: true,
      };
    } catch (error) {
      return this.handleError(error, 'TenantService.createTenant');
    }
  }

  /**
   * Get list of tenants (super admin only)
   */
  static async getTenants(filters: TenantFilters = {}): Promise<ServiceResponse<TenantListResponse>> {
    try {
      const { search, status, plan_type, page = 1, limit = 20 } = filters;
      
      let query = supabase
        .from('tenants')
        .select('*', { count: 'exact' });

      if (search) {
        query = query.or(`name.ilike.%${search}%,domain.ilike.%${search}%`);
      }

      if (status) {
        query = query.eq('status', status);
      }

      if (plan_type) {
        query = query.eq('plan_type', plan_type);
      }

      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) {
        return this.handleError(error, 'TenantService.getTenants');
      }

      return {
        data: {
          tenants: data || [],
          total: count || 0,
          page,
          limit,
          total_pages: Math.ceil((count || 0) / limit)
        },
        error: null,
        success: true,
      };
    } catch (error) {
      return this.handleError(error, 'TenantService.getTenants');
    }
  }

  /**
   * Get tenant by ID
   */
  static async getTenantById(tenantId: string): Promise<ServiceResponse<Tenant>> {
    if (!this.validateId(tenantId)) {
      return {
        data: null,
        error: 'Invalid tenant ID',
        success: false,
      };
    }

    try {
      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', tenantId)
        .single();

      if (error) {
        return this.handleError(error, 'TenantService.getTenantById');
      }

      return {
        data: data,
        error: null,
        success: true,
      };
    } catch (error) {
      return this.handleError(error, 'TenantService.getTenantById');
    }
  }

  /**
   * Update tenant
   */
  static async updateTenant(
    tenantId: string,
    updates: Partial<CreateTenantData>
  ): Promise<ServiceResponse<Tenant>> {
    if (!this.validateId(tenantId)) {
      return {
        data: null,
        error: 'Invalid tenant ID',
        success: false,
      };
    }

    try {
      const { data, error } = await supabase
        .from('tenants')
        .update(updates)
        .eq('id', tenantId)
        .select()
        .single();

      if (error) {
        return this.handleError(error, 'TenantService.updateTenant');
      }

      return {
        data: data,
        error: null,
        success: true,
      };
    } catch (error) {
      return this.handleError(error, 'TenantService.updateTenant');
    }
  }

  /**
   * Suspend tenant
   */
  static async suspendTenant(tenantId: string): Promise<ServiceResponse<boolean>> {
    if (!this.validateId(tenantId)) {
      return {
        data: false,
        error: 'Invalid tenant ID',
        success: false,
      };
    }

    try {
      const { error } = await supabase
        .from('tenants')
        .update({ status: 'suspended' })
        .eq('id', tenantId);

      if (error) {
        return this.handleError(error, 'TenantService.suspendTenant');
      }

      return {
        data: true,
        error: null,
        success: true,
      };
    } catch (error) {
      return this.handleError(error, 'TenantService.suspendTenant');
    }
  }

  /**
   * Activate tenant
   */
  static async activateTenant(tenantId: string): Promise<ServiceResponse<boolean>> {
    if (!this.validateId(tenantId)) {
      return {
        data: false,
        error: 'Invalid tenant ID',
        success: false,
      };
    }

    try {
      const { error } = await supabase
        .from('tenants')
        .update({ status: 'active' })
        .eq('id', tenantId);

      if (error) {
        return this.handleError(error, 'TenantService.activateTenant');
      }

      return {
        data: true,
        error: null,
        success: true,
      };
    } catch (error) {
      return this.handleError(error, 'TenantService.activateTenant');
    }
  }

  /**
   * Create user invitation
   */
  static async createInvitation(
    invitationData: CreateInvitationData
  ): Promise<ServiceResponse<UserInvitation>> {
    try {
      const { data, error } = await supabase
        .from('user_invitations')
        .insert({
          ...invitationData,
          token: crypto.randomUUID(),
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
        })
        .select()
        .single();

      if (error) {
        return this.handleError(error, 'TenantService.createInvitation');
      }

      return {
        data: data,
        error: null,
        success: true,
      };
    } catch (error) {
      return this.handleError(error, 'TenantService.createInvitation');
    }
  }

  /**
   * Get tenant invitations
   */
  static async getInvitations(
    tenantId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<ServiceResponse<InvitationListResponse>> {
    if (!this.validateId(tenantId)) {
      return {
        data: null,
        error: 'Invalid tenant ID',
        success: false,
      };
    }

    try {
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const { data, error, count } = await supabase
        .from('user_invitations')
        .select('*', { count: 'exact' })
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) {
        return this.handleError(error, 'TenantService.getInvitations');
      }

      return {
        data: {
          invitations: data || [],
          total: count || 0,
          page,
          limit,
          total_pages: Math.ceil((count || 0) / limit)
        },
        error: null,
        success: true,
      };
    } catch (error) {
      return this.handleError(error, 'TenantService.getInvitations');
    }
  }

  /**
   * Get platform analytics (super admin only)
   */
  static async getPlatformAnalytics(): Promise<ServiceResponse<PlatformAnalytics>> {
    try {
      const { data, error } = await supabase
        .rpc('get_platform_analytics');

      if (error) {
        return this.handleError(error, 'TenantService.getPlatformAnalytics');
      }

      return {
        data: data?.[0] || {
          total_tenants: 0,
          total_users: 0,
          total_reviews: 0,
          active_tenants: 0,
          revenue_current_month: 0,
          growth_rate: 0
        },
        error: null,
        success: true,
      };
    } catch (error) {
      return this.handleError(error, 'TenantService.getPlatformAnalytics');
    }
  }

  /**
   * Get tenant usage statistics
   */
  static async getTenantUsageStats(tenantId: string): Promise<ServiceResponse<TenantUsageStats>> {
    if (!this.validateId(tenantId)) {
      return {
        data: null,
        error: 'Invalid tenant ID',
        success: false,
      };
    }

    try {
      const { data, error } = await supabase
        .rpc('get_tenant_usage_stats', { p_tenant_id: tenantId });

      if (error) {
        return this.handleError(error, 'TenantService.getTenantUsageStats');
      }

      return {
        data: data?.[0] || {
          reviews_count: 0,
          users_count: 0,
          storage_used: 0,
          api_calls_count: 0,
          last_activity: new Date().toISOString()
        },
        error: null,
        success: true,
      };
    } catch (error) {
      return this.handleError(error, 'TenantService.getTenantUsageStats');
    }
  }

  /**
   * Log audit event
   */
  static async logAuditEvent(
    action: string,
    details: Record<string, any>,
    resourceType?: string,
    resourceId?: string
  ): Promise<ServiceResponse<boolean>> {
    try {
      const { error } = await supabase
        .from('audit_logs')
        .insert({
          action,
          details,
          resource_type: resourceType,
          resource_id: resourceId,
          ip_address: null, // Will be set by trigger
          user_agent: navigator.userAgent
        });

      if (error) {
        return this.handleError(error, 'TenantService.logAuditEvent');
      }

      return {
        data: true,
        error: null,
        success: true,
      };
    } catch (error) {
      return this.handleError(error, 'TenantService.logAuditEvent');
    }
  }

  /**
   * Get audit logs
   */
  static async getAuditLogs(
    filters: AuditLogFilters = {}
  ): Promise<ServiceResponse<AuditLogResponse>> {
    try {
      const { tenant_id, user_id, action, resource_type, date_from, date_to, page = 1, limit = 20 } = filters;
      
      let query = supabase
        .from('audit_logs')
        .select('*', { count: 'exact' });

      if (tenant_id) {
        query = query.eq('tenant_id', tenant_id);
      }

      if (user_id) {
        query = query.eq('user_id', user_id);
      }

      if (action) {
        query = query.eq('action', action);
      }

      if (resource_type) {
        query = query.eq('resource_type', resource_type);
      }

      if (date_from) {
        query = query.gte('created_at', date_from);
      }

      if (date_to) {
        query = query.lte('created_at', date_to);
      }

      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) {
        return this.handleError(error, 'TenantService.getAuditLogs');
      }

      return {
        data: {
          logs: data || [],
          total: count || 0,
          page,
          limit,
          total_pages: Math.ceil((count || 0) / limit)
        },
        error: null,
        success: true,
      };
    } catch (error) {
      return this.handleError(error, 'TenantService.getAuditLogs');
    }
  }

  /**
   * Record usage metric
   */
  static async recordUsageMetric(
    metricData: CreateUsageMetricData
  ): Promise<ServiceResponse<UsageMetric>> {
    try {
      const { data, error } = await supabase
        .from('usage_metrics')
        .insert(metricData)
        .select()
        .single();

      if (error) {
        return this.handleError(error, 'TenantService.recordUsageMetric');
      }

      return {
        data: data,
        error: null,
        success: true,
      };
    } catch (error) {
      return this.handleError(error, 'TenantService.recordUsageMetric');
    }
  }

  /**
   * Get system settings
   */
  static async getSystemSettings(): Promise<ServiceResponse<SystemSetting[]>> {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .order('key');

      if (error) {
        return this.handleError(error, 'TenantService.getSystemSettings');
      }

      return {
        data: data || [],
        error: null,
        success: true,
      };
    } catch (error) {
      return this.handleError(error, 'TenantService.getSystemSettings');
    }
  }

  /**
   * Update system setting
   */
  static async updateSystemSetting(
    key: string,
    value: Record<string, any>,
    description?: string
  ): Promise<ServiceResponse<SystemSetting>> {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .upsert({
          key,
          value,
          description,
          updated_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (error) {
        return this.handleError(error, 'TenantService.updateSystemSetting');
      }

      return {
        data: data,
        error: null,
        success: true,
      };
    } catch (error) {
      return this.handleError(error, 'TenantService.updateSystemSetting');
    }
  }
}
