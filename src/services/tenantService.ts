import { supabase } from "@/integrations/supabase/client";
import { supabaseAdmin, withAdminAuth } from "@/integrations/supabase/admin";
import { AuditLogService } from "./auditLogService";
import { BaseService, type ServiceResponse } from "./baseService";
import { logger } from "@/utils/logger";
import { env } from "@/utils/env";

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
      // Try with admin client first (for super admin operations)
      const { data, error } = await withAdminAuth(async () => {
        return await supabaseAdmin
          .from('tenants')
          .select('*')
          .order('created_at', { ascending: false });
      });

      if (error) {
        console.error('Admin client failed, trying regular client:', error);
        // Fallback to regular client
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('tenants')
          .select('*')
          .order('created_at', { ascending: false });

        if (fallbackError) {
          return this.handleError(fallbackError, 'TenantService.getAllTenants');
        }

        return {
          data: fallbackData || [],
          error: null,
          success: true,
        };
      }

      return {
        data: data || [],
        error: null,
        success: true,
      };
    } catch (error) {
      console.error('TenantService.getAllTenants error:', error);
      return this.handleError(error, 'TenantService.getAllTenants');
    }
  }

  /**
   * Update tenant status
   */
  static async updateTenantStatus(tenantId: string, status: 'active' | 'suspended' | 'pending' | 'cancelled'): Promise<ServiceResponse<Tenant>> {
    if (!this.validateId(tenantId)) {
      return {
        data: null,
        error: 'Invalid tenant ID',
        success: false,
      };
    }

    try {
      // Use admin client to bypass RLS policies for super admin operations
      const { data, error } = await withAdminAuth(async () => {
        return await supabaseAdmin
          .from('tenants')
          .update({ 
            status,
            updated_at: new Date().toISOString()
          })
          .eq('id', tenantId)
          .select()
          .single();
      });

      if (error) {
        return this.handleError(error, 'TenantService.updateTenantStatus');
      }

      // Log the status change
      await AuditLogService.logEvent(
        AuditLogService.ACTIONS.TENANT_STATUS_CHANGED,
        {
          tenant_id: tenantId,
          new_status: status,
        },
        {
          resource_type: 'tenant',
          resource_id: tenantId,
        }
      );

      return {
        data,
        error: null,
        success: true,
      };
    } catch (error) {
      return this.handleError(error, 'TenantService.updateTenantStatus');
    }
  }

  /**
   * Update tenant
   */
  static async updateTenant(tenantId: string, updateData: UpdateTenantData): Promise<ServiceResponse<Tenant>> {
    if (!this.validateId(tenantId)) {
      return {
        data: null,
        error: 'Invalid tenant ID',
        success: false,
      };
    }

    try {
      // Use admin client to bypass RLS policies for super admin operations
      const { data, error } = await withAdminAuth(async () => {
        return await supabaseAdmin
          .from('tenants')
          .update({ 
            ...updateData,
            updated_at: new Date().toISOString()
          })
          .eq('id', tenantId)
          .select()
          .single();
      });

      if (error) {
        return this.handleError(error, 'TenantService.updateTenant');
      }

      // Log the update
      await AuditLogService.logEvent(
        AuditLogService.ACTIONS.TENANT_UPDATED,
        {
          tenant_id: tenantId,
          updated_fields: Object.keys(updateData),
        },
        {
          resource_type: 'tenant',
          resource_id: tenantId,
        }
      );

      return {
        data,
        error: null,
        success: true,
      };
    } catch (error) {
      return this.handleError(error, 'TenantService.updateTenant');
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
      // Use admin client to bypass RLS policies for super admin operations
      const { data, error } = await withAdminAuth(async () => {
        return await supabaseAdmin
          .from('tenants')
          .select('*')
          .eq('id', id)
          .single();
      });

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
   * Get review form URL for a tenant
   */
  static async getReviewFormUrl(tenantId: string): Promise<ServiceResponse<string>> {
    try {
      if (!isAdminClientConfigured()) {
        return {
          data: null,
          error: 'Admin client not configured',
          success: false,
        };
      }

      const { data: tenant, error } = await supabaseAdmin
        .from('tenants')
        .select('id, settings')
        .eq('id', tenantId)
        .single();

      if (error) {
        return this.handleError(error, 'TenantService.getReviewFormUrl');
      }

      if (!tenant) {
        return {
          data: null,
          error: 'Tenant not found',
          success: false,
        };
      }

      // Generate review form URL if not exists
      const reviewFormUrl = tenant.settings?.review_form_url || `${env.frontend.url}/review/${tenantId}`;
      
      // Update the tenant with the review form URL if it doesn't exist
      if (!tenant.settings?.review_form_url) {
        await supabaseAdmin
          .from('tenants')
          .update({
            settings: {
              ...tenant.settings,
              review_form_url: reviewFormUrl,
            }
          })
          .eq('id', tenantId);
      }

      return {
        data: reviewFormUrl,
        error: null,
        success: true,
      };

    } catch (error) {
      return this.handleError(error, 'TenantService.getReviewFormUrl');
    }
  }

  /**
   * Delete a tenant (super admin only)
   */
  static async deleteTenant(tenantId: string): Promise<ServiceResponse<boolean>> {
    if (!this.validateId(tenantId)) {
      return {
        data: null,
        error: 'Invalid tenant ID',
        success: false,
      };
    }

    try {
      // Use admin client to bypass RLS policies for super admin operations
      await withAdminAuth(async () => {
        // First, delete all related data
        // Delete reviews
        await supabaseAdmin
          .from('reviews')
          .delete()
          .eq('tenant_id', tenantId);

        // Delete business settings
        await supabaseAdmin
          .from('business_settings')
          .delete()
          .eq('tenant_id', tenantId);

        // Delete user invitations
        await supabaseAdmin
          .from('user_invitations')
          .delete()
          .eq('tenant_id', tenantId);

        // Delete profiles (users)
        await supabaseAdmin
          .from('profiles')
          .delete()
          .eq('tenant_id', tenantId);

        // Delete usage metrics
        await supabaseAdmin
          .from('usage_metrics')
          .delete()
          .eq('tenant_id', tenantId);

        // Delete audit logs
        await supabaseAdmin
          .from('audit_logs')
          .delete()
          .eq('tenant_id', tenantId);

        // Finally, delete the tenant
        const { error: deleteError } = await supabaseAdmin
          .from('tenants')
          .delete()
          .eq('id', tenantId);

        if (deleteError) {
          throw deleteError;
        }
      });

      // Log the deletion
      await AuditLogService.logEvent(
        AuditLogService.ACTIONS.TENANT_DELETED,
        {
          tenant_id: tenantId,
        },
        {
          resource_type: 'tenant',
          resource_id: tenantId,
        }
      );

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
   * Create a new tenant (super admin only)
   */
  static async createTenant(tenantData: CreateTenantData): Promise<ServiceResponse<Tenant>> {
    try {
      // Generate review form URL for the tenant (will be updated after tenant creation)
      const reviewFormUrl = `${env.frontend.url}/review/`;

      // Use admin client to bypass RLS policies
      const { data, error } = await withAdminAuth(async () => {
        return await supabaseAdmin
          .from('tenants')
          .insert({
            name: tenantData.name,
            domain: tenantData.domain,
            plan_type: tenantData.plan_type || 'basic',
            status: 'active',
            settings: {
              ...tenantData.settings,
              review_form_url: reviewFormUrl,
            },
            billing_email: tenantData.billing_email,
          })
          .select()
          .single();
      });

      if (error) {
        return this.handleError(error, 'TenantService.createTenant');
      }

      // Update the review form URL with the actual tenant ID
      const finalReviewFormUrl = `${env.frontend.url}/review/${data.id}`;
      
      // Update the tenant with the correct review form URL
      await supabaseAdmin
        .from('tenants')
        .update({
          settings: {
            ...data.settings,
            review_form_url: finalReviewFormUrl,
          }
        })
        .eq('id', data.id);

      return {
        data: { ...data, review_form_url: finalReviewFormUrl },
        error: null,
        success: true,
      };
    } catch (error) {
      return this.handleError(error, 'TenantService.createTenant');
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
      // Use admin client to bypass RLS policies for super admin operations
      const { data, error } = await withAdminAuth(async () => {
        // Get reviews count
        const { count: reviewsCount } = await supabaseAdmin
          .from('reviews')
          .select('*', { count: 'exact', head: true })
          .eq('tenant_id', tenantId);

        // Get users count
        const { count: usersCount } = await supabaseAdmin
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('tenant_id', tenantId);

        // Get last activity
        const { data: lastReview } = await supabaseAdmin
          .from('reviews')
          .select('created_at')
          .eq('tenant_id', tenantId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        // Get API calls count (from audit logs)
        const { count: apiCallsCount } = await supabaseAdmin
          .from('audit_logs')
          .select('*', { count: 'exact', head: true })
          .eq('tenant_id', tenantId)
          .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()); // Last 30 days

        return {
          reviews_count: reviewsCount || 0,
          users_count: usersCount || 0,
          storage_used: 0, // TODO: Implement actual storage calculation
          api_calls_count: apiCallsCount || 0,
          last_activity: lastReview?.created_at || null,
        };
      });

      if (error) {
        return this.handleError(error, 'TenantService.getTenantUsageStats');
      }

      return {
        data: data,
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
      // First create the tenant
      const tenantResult = await this.createTenant(tenantData);
      if (!tenantResult.success || !tenantResult.data) {
        return {
          data: null,
          error: tenantResult.error || 'Failed to create tenant',
          success: false,
        };
      }

      const tenant = tenantResult.data;

      // Create invitation for the admin user
      const { data: invitation, error: invitationError } = await supabase
        .from('user_invitations')
        .insert({
          tenant_id: tenant.id,
          email: adminEmail,
          role: 'tenant_admin',
          status: 'pending',
          invited_by: 'system', // TODO: Get actual user ID
        })
        .select()
        .single();

      if (invitationError) {
        // If invitation creation fails, we should still return the tenant
        // but log the error
        console.warn('Failed to create invitation:', invitationError);
      }

      return {
        data: {
          tenant: tenant,
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