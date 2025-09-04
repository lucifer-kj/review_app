import { supabase } from "@/integrations/supabase/client";
import { BaseService, type ServiceResponse } from "./baseService";

export interface BusinessSettings {
  id: string;
  user_id?: string; // Make optional since it might not be in DB types yet
  google_business_url?: string;
  business_name?: string;
  business_email?: string;
  business_phone?: string;
  business_address?: string;
  created_at: string;
  updated_at: string;
}

export interface BusinessSettingsFormData {
  google_business_url?: string;
  business_name?: string;
  business_email?: string;
  business_phone?: string;
  business_address?: string;
}

export class BusinessSettingsService extends BaseService {
  /**
   * Get business settings for the current user
   */
  static async getBusinessSettings(): Promise<ServiceResponse<BusinessSettings>> {
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

      // Simple query without complex chaining
      const result = await supabase
        .from('business_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (result.error) {
        return this.handleError(result.error, 'BusinessSettingsService.getBusinessSettings');
      }

      return {
        data: result.data as BusinessSettings || null,
        error: null,
        success: true,
      };
    } catch (error) {
      return this.handleError(error, 'BusinessSettingsService.getBusinessSettings');
    }
  }

  /**
   * Create or update business settings
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

      // First try to get existing settings
      const existingSettings = await this.getBusinessSettings();
      
      if (existingSettings.success && existingSettings.data) {
        // Update existing settings
        const result = await supabase
          .from('business_settings')
          .update(settings)
          .eq('id', existingSettings.data.id)
          .eq('user_id', user.id)
          .select()
          .single();

        if (result.error) {
          return this.handleError(result.error, 'BusinessSettingsService.updateBusinessSettings');
        }

        return {
          data: result.data as BusinessSettings,
          error: null,
          success: true,
        };
      } else {
        // Create new settings with user_id
        const result = await supabase
          .from('business_settings')
          .insert({
            ...settings,
            user_id: user.id
          })
          .select()
          .single();

        if (result.error) {
          return this.handleError(result.error, 'BusinessSettingsService.createBusinessSettings');
        }

        return {
          data: result.data as BusinessSettings,
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
      business_name: 'Alpha Business Designs',
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
   * Delete business settings for current user
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

      const result = await supabase
        .from('business_settings')
        .delete()
        .eq('user_id', user.id);

      if (result.error) {
        return this.handleError(result.error, 'BusinessSettingsService.deleteBusinessSettings');
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
