import { supabase } from "@/integrations/supabase/client";
import { BaseService, type ServiceResponse } from "./baseService";

export interface BusinessSettings {
  id: string;
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
      const { data, error } = await supabase
        .from('business_settings')
        .select('*')
        .maybeSingle();

      if (error) {
        return this.handleError(error, 'BusinessSettingsService.getBusinessSettings');
      }

      return {
        data: data || null,
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
      // First try to get existing settings
      const existingSettings = await this.getBusinessSettings();
      
      if (existingSettings.success && existingSettings.data) {
        // Update existing settings
        const { data, error } = await supabase
          .from('business_settings')
          .update(settings)
          .eq('id', existingSettings.data.id)
          .select()
          .single();

        if (error) {
          return this.handleError(error, 'BusinessSettingsService.updateBusinessSettings');
        }

        return {
          data,
          error: null,
          success: true,
        };
      } else {
        // Create new settings
        const { data, error } = await supabase
          .from('business_settings')
          .insert(settings)
          .select()
          .single();

        if (error) {
          return this.handleError(error, 'BusinessSettingsService.createBusinessSettings');
        }

        return {
          data,
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
}
