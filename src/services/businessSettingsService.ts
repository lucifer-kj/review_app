import { supabase } from "@/integrations/supabase/client";
import { BaseService, type ServiceResponse } from "./baseService";
import { logger } from "@/utils/logger";
import { handleError } from "@/utils/errorHandler";

// Simple error class for this service
class ServiceError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'ServiceError';
  }
}

export interface BusinessSettings {
  id: string;
  user_id?: string; // Make optional since it might not be in DB types yet
  tenant_id?: string; // Add tenant_id for multi-tenancy
  google_business_url?: string;
  business_name?: string;
  business_email?: string;
  business_phone?: string;
  business_address?: string;
  review_form_url?: string;
  email_template?: {
    subject: string;
    body: string;
    footer?: string;
  };
  form_customization?: {
    primary_color?: string;
    secondary_color?: string;
    logo_url?: string;
    welcome_message?: string;
    thank_you_message?: string;
    required_fields?: string[];
    optional_fields?: string[];
  };
  created_at: string;
  updated_at: string;
}

export interface BusinessSettingsFormData {
  google_business_url?: string;
  business_name?: string;
  business_email?: string;
  business_phone?: string;
  business_address?: string;
  review_form_url?: string;
  email_template?: {
    subject: string;
    body: string;
    footer?: string;
  };
  form_customization?: {
    primary_color?: string;
    secondary_color?: string;
    logo_url?: string;
    welcome_message?: string;
    thank_you_message?: string;
    required_fields?: string[];
    optional_fields?: string[];
  };
}

export class BusinessSettingsService extends BaseService {
  /**
   * Check if user_id column exists in business_settings table
   */
  private static async checkUserIdColumnExists(): Promise<boolean> {
    try {
      // Try a simple query with user_id to see if it exists
      const { error } = await supabase
        .from('business_settings')
        .select('user_id')
        .limit(1);
      
      return !error || !error.message.includes('column "user_id" does not exist');
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if tenant_id column exists in business_settings table
   */
  private static async checkTenantIdColumnExists(): Promise<boolean> {
    try {
      // Try a simple query with tenant_id to see if it exists
      const { error } = await supabase
        .from('business_settings')
        .select('tenant_id')
        .limit(1);
      
      return !error || !error.message.includes('column "tenant_id" does not exist');
    } catch (error) {
      return false;
    }
  }

  /**
   * Get business settings for the current user with tenant context
   */
  static async getBusinessSettings(): Promise<ServiceResponse<BusinessSettings>> {
    try {
      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) {
        throw handleError(authError, 'BusinessSettingsService.getBusinessSettings');
      }
      
      if (!user) {
        throw new ServiceError(
          'User not authenticated',
          'USER_NOT_AUTHENTICATED'
        );
      }

      // Get tenant context
      const { data: tenantId } = await supabase.rpc('get_current_tenant_id');
      
      // Check if user_id and tenant_id columns exist
      const hasUserIdColumn = await this.checkUserIdColumnExists();
      const hasTenantIdColumn = await this.checkTenantIdColumnExists();
      
      let query = supabase.from('business_settings').select('*');
      
      if (hasTenantIdColumn && tenantId) {
        // Use tenant_id filter if column exists and tenant context is available
        query = query.eq('tenant_id', tenantId);
      } else if (hasUserIdColumn) {
        // Fallback to user_id filter if tenant_id not available
        query = query.eq('user_id', user.id);
      } else if (!tenantId && hasTenantIdColumn) {
        // If tenant_id column exists but no tenant context, return error
        return {
          data: null,
          error: 'No tenant context available. Please ensure you are properly assigned to a tenant. Contact support if this issue persists.',
          success: false,
        };
      } else {
        // Fallback: get first settings (temporary until migration is run)
        query = query.limit(1);
        logger.warn('Neither tenant_id nor user_id column found in business_settings table. Using fallback query.');
      }
      
      const { data, error } = await query.maybeSingle();

      if (error) {
        // If error is due to columns not existing, try without them
        if (error.message.includes('column') && error.message.includes('does not exist')) {
          logger.warn('Required columns not found, falling back to basic query');
          const fallbackResult = await supabase
            .from('business_settings')
            .select('*')
            .maybeSingle();
          
          if (fallbackResult.error) {
            return this.handleError(fallbackResult.error, 'BusinessSettingsService.getBusinessSettings');
          }
          
          // Handle fallback data - extract from settings JSONB if needed
          if (fallbackResult.data) {
            const fallbackData = fallbackResult.data as any;
            
            // If email_template and form_customization are in settings JSONB, extract them
            if (fallbackData.settings && typeof fallbackData.settings === 'object') {
              fallbackData.email_template = fallbackData.settings.email_template || {};
              fallbackData.form_customization = fallbackData.settings.form_customization || {};
            }
            
            return {
              data: fallbackData as BusinessSettings,
              error: null,
              success: true,
            };
          }
          
          return {
            data: null,
            error: null,
            success: true,
          };
        }
        return this.handleError(error, 'BusinessSettingsService.getBusinessSettings');
      }

      // Handle normal data - extract from settings JSONB if needed
      if (data) {
        const normalData = data as any;
        
        // If email_template and form_customization are in settings JSONB, extract them
        if (normalData.settings && typeof normalData.settings === 'object') {
          normalData.email_template = normalData.settings.email_template || {};
          normalData.form_customization = normalData.settings.form_customization || {};
        }
        
        // Ensure all required fields have default values
        const businessSettings: BusinessSettings = {
          id: normalData.id || '',
          user_id: normalData.user_id || '',
          tenant_id: normalData.tenant_id || '',
          business_name: normalData.business_name || '',
          business_email: normalData.business_email || '',
          business_phone: normalData.business_phone || '',
          business_address: normalData.business_address || '',
          google_business_url: normalData.google_business_url || '',
          review_form_url: normalData.review_form_url || '',
          email_template: normalData.email_template || {},
          form_customization: normalData.form_customization || {},
          created_at: normalData.created_at || new Date().toISOString(),
          updated_at: normalData.updated_at || new Date().toISOString()
        };
        
        return {
          data: businessSettings,
          error: null,
          success: true,
        };
      }

      return {
        data: null,
        error: null,
        success: true,
      };
    } catch (error) {
      return this.handleError(error, 'BusinessSettingsService.getBusinessSettings');
    }
  }

  /**
   * Create or update business settings with tenant context
   */
  static async upsertBusinessSettings(settings: BusinessSettingsFormData): Promise<ServiceResponse<BusinessSettings>> {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return {
          data: null,
          error: 'User not authenticated',
          success: false,
        };
      }

      // Get tenant context
      const { data: tenantId } = await supabase.rpc('get_current_tenant_id');

      // Check if user_id and tenant_id columns exist
      const hasUserIdColumn = await this.checkUserIdColumnExists();
      const hasTenantIdColumn = await this.checkTenantIdColumnExists();

      // Validate tenant context if tenant_id column exists
      if (hasTenantIdColumn && !tenantId) {
        return {
          data: null,
          error: 'No tenant context available. Please ensure you are properly assigned to a tenant. Contact support if this issue persists.',
          success: false,
        };
      }

      // First try to get existing settings
      const existingSettings = await this.getBusinessSettings();
      
      if (existingSettings.success && existingSettings.data) {
        // Update existing settings - use settings JSONB column for complex data
        const settingsData = {
          business_name: settings.business_name,
          business_email: settings.business_email,
          business_phone: settings.business_phone,
          business_address: settings.business_address,
          google_business_url: settings.google_business_url,
          review_form_url: settings.review_form_url,
          settings: {
            email_template: settings.email_template || {},
            form_customization: settings.form_customization || {}
          }
        };
        
        let query = supabase
          .from('business_settings')
          .update(settingsData)
          .eq('id', existingSettings.data.id);
        
        if (hasTenantIdColumn && tenantId) {
          query = query.eq('tenant_id', tenantId);
        } else if (hasUserIdColumn) {
          query = query.eq('user_id', user.id);
        }
        
        const { data, error } = await query.select().single();

        if (error) {
          return this.handleError(error, 'BusinessSettingsService.updateBusinessSettings');
        }

        return {
          data: data as BusinessSettings,
          error: null,
          success: true,
        };
      } else {
        // Create new settings - use settings JSONB column for complex data
        const insertData: any = {
          business_name: settings.business_name,
          business_email: settings.business_email,
          business_phone: settings.business_phone,
          business_address: settings.business_address,
          google_business_url: settings.google_business_url,
          review_form_url: settings.review_form_url,
          settings: {
            email_template: settings.email_template || {},
            form_customization: settings.form_customization || {}
          }
        };
        
        if (hasTenantIdColumn && tenantId) {
          insertData.tenant_id = tenantId;
        }
        if (hasUserIdColumn) {
          insertData.user_id = user.id;
        }

        const { data, error } = await supabase
          .from('business_settings')
          .insert(insertData)
          .select()
          .single();

        if (error) {
          return this.handleError(error, 'BusinessSettingsService.createBusinessSettings');
        }

        return {
          data: data as BusinessSettings,
          error: null,
          success: true,
        };
      }
    } catch (error) {
      return this.handleError(error, 'BusinessSettingsService.upsertBusinessSettings');
    }
  }

  /**
   * Get default business settings if none exist
   */
  static getDefaultBusinessSettings(): BusinessSettings {
    return {
      id: '',
      user_id: '',
      business_name: 'Crux',
      business_email: '',
      business_phone: '',
      business_address: '',
      google_business_url: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  /**
   * Get business settings with fallback to defaults
   */
  static async getBusinessSettingsWithDefaults(): Promise<BusinessSettings> {
    const response = await this.getBusinessSettings();
    
    if (response.success && response.data) {
      return {
        ...this.getDefaultBusinessSettings(),
        ...response.data
      };
    }
    
    return this.getDefaultBusinessSettings();
  }

  /**
   * Alias for getBusinessSettings - used by DashboardSettings component
   */
  static async getSettings(): Promise<ServiceResponse<BusinessSettings>> {
    return this.getBusinessSettings();
  }

  /**
   * Alias for upsertBusinessSettings - used by DashboardSettings component
   */
  static async updateSettings(settings: BusinessSettingsFormData): Promise<ServiceResponse<BusinessSettings>> {
    return this.upsertBusinessSettings(settings);
  }

  /**
   * Delete business settings for current user with tenant context
   */
  static async deleteBusinessSettings(): Promise<ServiceResponse<boolean>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return {
          data: false,
          error: 'User not authenticated',
          success: false,
        };
      }

      // Get tenant context
      const { data: tenantId } = await supabase.rpc('get_current_tenant_id');

      // Check if user_id and tenant_id columns exist
      const hasUserIdColumn = await this.checkUserIdColumnExists();
      const hasTenantIdColumn = await this.checkTenantIdColumnExists();
      
      let query = supabase.from('business_settings').delete();
      
      if (hasTenantIdColumn && tenantId) {
        query = query.eq('tenant_id', tenantId);
      } else if (hasUserIdColumn) {
        query = query.eq('user_id', user.id);
      }

      const { error } = await query;

      if (error) {
        // If error is due to columns not existing, try without them
        if (error.message.includes('column') && error.message.includes('does not exist')) {
          logger.warn('Required columns not found, falling back to basic delete');
          const fallbackResult = await supabase
            .from('business_settings')
            .delete();
          
          if (fallbackResult.error) {
            return this.handleError(fallbackResult.error, 'BusinessSettingsService.deleteBusinessSettings');
          }
          
          return {
            data: true,
            error: null,
            success: true,
          };
        }
        return this.handleError(error, 'BusinessSettingsService.deleteBusinessSettings');
      }

      return {
        data: true,
        error: null,
        success: true,
      };
    } catch (error) {
      return this.handleError(error, 'BusinessSettingsService.deleteBusinessSettings');
    }
  }
}
