import { supabase } from "@/integrations/supabase/client";
import { AuditLogService } from "./auditLogService";
import { BaseService, type ServiceResponse } from "./baseService";
import { logger } from "@/utils/logger";

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

export interface PlatformAnalytics {
  total_tenants: number;
  active_tenants: number;
  suspended_tenants: number;
  total_users: number;
  active_users: number;
  total_reviews: number;
  reviews_this_month: number;
  reviews_last_month: number;
  average_rating: number;
  total_revenue: number;
  revenue_this_month: number;
  revenue_growth_rate: number;
  review_growth_rate: number;
  user_growth_rate: number;
  tenant_growth_rate: number;
  system_health_score: number;
  last_updated: string;
}

export interface CreateTenantData {
  name: string;
  domain?: string;
  plan_type?: 'basic' | 'pro' | 'enterprise';
  settings?: Record<string, any>;
  billing_email?: string;
}

export interface UpdateTenantData {
  name?: string;
  domain?: string;
  plan_type?: 'basic' | 'pro' | 'enterprise';
  status?: 'active' | 'suspended' | 'pending' | 'cancelled';
  settings?: Record<string, any>;
  billing_email?: string;
}

export class TenantService extends BaseService {
  /**
   * Get all tenants (super admin only)
   */
  static async getAllTenants(): Promise<ServiceResponse<Tenant[]>> {
    try {
      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        return this.handleError(error, 'TenantService.getAllTenants');
      }

      return {
        data: data || [],
        error: null,
        success: true,
      };
    } catch (error) {
      return this.handleError(error, 'TenantService.getAllTenants');
    }
  }

  /**
   * Get tenant by ID
   */
  static async getTenantById(id: string): Promise<ServiceResponse<Tenant>> {
    if (!this.validateId(id)) {
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
        .eq('id', id)
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
   * Create a new tenant (super admin only)
   */
  static async createTenant(tenantData: CreateTenantData): Promise<ServiceResponse<Tenant>> {
    try {
      const { data, error } = await supabase
        .from('tenants')
        .insert({
          name: tenantData.name,
          domain: tenantData.domain,
          plan_type: tenantData.plan_type || 'basic',
          settings: tenantData.settings || {},
          billing_email: tenantData.billing_email,
        })
        .select()
        .single();

      if (error) {
        return this.handleError(error, 'TenantService.createTenant');
      }

      // Log the action
      await AuditLogService.logEvent(
        AuditLogService.ACTIONS.TENANT_CREATED,
        {
          tenant_name: tenantData.name,
          plan_type: tenantData.plan_type || 'basic',
        },
        {
          resource_type: 'tenant',
          resource_id: data.id,
          tenant_id: data.id,
        }
      );

      return {
        data: data,
        error: null,
        success: true,
      };
    } catch (error) {
      return this.handleError(error, 'TenantService.createTenant');
    }
  }

  /**
   * Update tenant (super admin only)
   */
  static async updateTenant(id: string, updates: UpdateTenantData): Promise<ServiceResponse<Tenant>> {
    if (!this.validateId(id)) {
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
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return this.handleError(error, 'TenantService.updateTenant');
      }

      // Log the action
      await supabase
        .from('audit_logs')
        .insert({
          tenant_id: id,
          action: 'tenant_updated',
          resource_type: 'tenant',
          resource_id: id,
          details: updates,
        });

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
   * Delete tenant (super admin only)
   */
  static async deleteTenant(id: string): Promise<ServiceResponse<boolean>> {
    if (!this.validateId(id)) {
      return {
        data: false,
        error: 'Invalid tenant ID',
        success: false,
      };
    }

    try {
      // Log the action before deletion
      await supabase
        .from('audit_logs')
        .insert({
          tenant_id: id,
          action: 'tenant_deleted',
          resource_type: 'tenant',
          resource_id: id,
          details: { deleted_at: new Date().toISOString() },
        });

      const { error } = await supabase
        .from('tenants')
        .delete()
        .eq('id', id);

      if (error) {
        return this.handleError(error, 'TenantService.deleteTenant');
      }

      return {
        data: true,
        error: null,
        success: true,
      };
    } catch (error) {
      return this.handleError(error, 'TenantService.deleteTenant');
    }
  }

  /**
   * Suspend tenant
   */
  static async suspendTenant(id: string): Promise<ServiceResponse<Tenant>> {
    return this.updateTenant(id, { status: 'suspended' });
  }

  /**
   * Activate tenant
   */
  static async activateTenant(id: string): Promise<ServiceResponse<Tenant>> {
    return this.updateTenant(id, { status: 'active' });
  }

  /**
   * Get tenant usage statistics
   */
  static async getTenantUsageStats(tenantId: string): Promise<ServiceResponse<{
    reviews_count: number;
    users_count: number;
    storage_used: number;
    api_calls_count: number;
    last_activity: string | null;
  }>> {
    if (!this.validateId(tenantId)) {
      return {
        data: null,
        error: 'Invalid tenant ID',
        success: false,
      };
    }

    try {
      // Get reviews count
      const { count: reviewsCount } = await supabase
        .from('reviews')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId);

      // Get users count
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId);

      // Get last activity
      const { data: lastReview } = await supabase
        .from('reviews')
        .select('created_at')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      // Get API calls count (from audit logs)
      const { count: apiCallsCount } = await supabase
        .from('audit_logs')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()); // Last 30 days

      return {
        data: {
          reviews_count: reviewsCount || 0,
          users_count: usersCount || 0,
          storage_used: 0, // TODO: Implement actual storage calculation
          api_calls_count: apiCallsCount || 0,
          last_activity: lastReview?.created_at || null,
        },
        error: null,
        success: true,
      };
    } catch (error) {
      return this.handleError(error, 'TenantService.getTenantUsageStats');
    }
  }

  /**
   * Get platform analytics (super admin only)
   */
  static async getPlatformAnalytics(): Promise<ServiceResponse<PlatformAnalytics>> {
    try {
      const { data, error } = await supabase.rpc('get_platform_analytics');

      if (error) {
        // Fallback to manual calculation if function doesn't exist
        logger.warn('Platform analytics function not found, using fallback calculation', { error: error.message });
        
        const [tenantsResult, usersResult, reviewsResult] = await Promise.all([
          supabase.from('tenants').select('*', { count: 'exact', head: true }),
          supabase.from('profiles').select('*', { count: 'exact', head: true }),
          supabase.from('reviews').select('*', { count: 'exact', head: true }),
        ]);

        const activeTenantsResult = await supabase
          .from('tenants')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active');

        const suspendedTenantsResult = await supabase
          .from('tenants')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'suspended');

        return {
          data: {
            total_tenants: tenantsResult.count || 0,
            active_tenants: activeTenantsResult.count || 0,
            suspended_tenants: suspendedTenantsResult.count || 0,
            total_users: usersResult.count || 0,
            active_users: usersResult.count || 0,
            total_reviews: reviewsResult.count || 0,
            reviews_this_month: 0,
            reviews_last_month: 0,
            average_rating: 0,
            total_revenue: 0,
            revenue_this_month: 0,
            revenue_growth_rate: 0,
            review_growth_rate: 0,
            user_growth_rate: 0,
            tenant_growth_rate: 0,
            system_health_score: 90,
            last_updated: new Date().toISOString(),
          },
          error: null,
          success: true,
        };
      }

      // Transform the data to match our interface
      const analytics: PlatformAnalytics = {
        total_tenants: data?.[0]?.total_tenants || 0,
        active_tenants: data?.[0]?.active_tenants || 0,
        suspended_tenants: data?.[0]?.suspended_tenants || 0,
        total_users: data?.[0]?.total_users || 0,
        active_users: data?.[0]?.active_users || 0,
        total_reviews: data?.[0]?.total_reviews || 0,
        reviews_this_month: data?.[0]?.reviews_this_month || 0,
        reviews_last_month: data?.[0]?.reviews_last_month || 0,
        average_rating: data?.[0]?.average_rating || 0,
        total_revenue: data?.[0]?.total_revenue || 0,
        revenue_this_month: data?.[0]?.revenue_this_month || 0,
        revenue_growth_rate: data?.[0]?.revenue_growth_rate || 0,
        review_growth_rate: data?.[0]?.review_growth_rate || 0,
        user_growth_rate: data?.[0]?.user_growth_rate || 0,
        tenant_growth_rate: data?.[0]?.tenant_growth_rate || 0,
        system_health_score: data?.[0]?.system_health_score || 0,
        last_updated: data?.[0]?.last_updated || new Date().toISOString(),
      };

      return this.handleSuccess(analytics, 'Platform analytics retrieved successfully');
    } catch (error) {
      return this.handleError(error, 'TenantService.getPlatformAnalytics');
    }
  }

  /**
   * Create tenant with admin user
   */
  static async createTenantWithAdmin(
    tenantData: CreateTenantData,
    adminEmail: string
  ): Promise<ServiceResponse<{ tenant: Tenant; invitationId: string }>> {
    try {
      const { data, error } = await supabase.rpc('create_tenant_with_admin', {
        tenant_data: tenantData,
        admin_email: adminEmail,
      });

      if (error) {
        return this.handleError(error, 'TenantService.createTenantWithAdmin');
      }

      // Get the created tenant
      const tenantResult = await this.getTenantById(data);
      if (!tenantResult.success) {
        return {
          data: null,
          error: 'Failed to retrieve created tenant',
          success: false,
        };
      }

      // Get the invitation ID
      const { data: invitation } = await supabase
        .from('user_invitations')
        .select('id')
        .eq('tenant_id', data)
        .eq('email', adminEmail)
        .single();

      return {
        data: {
          tenant: tenantResult.data!,
          invitationId: invitation?.id || '',
        },
        error: null,
        success: true,
      };
    } catch (error) {
      return this.handleError(error, 'TenantService.createTenantWithAdmin');
    }
  }
}