import { supabase } from "@/integrations/supabase/client";
import { BaseService, type ServiceResponse } from "./baseService";
import type { BusinessSettings } from "@/types";

export class BusinessSettingsService extends BaseService {
  static async getSettings(): Promise<ServiceResponse<BusinessSettings>> {
    try {
      const { data, error } = await supabase
        .from('business_settings')
        .select('*')
        .maybeSingle();

      if (error) {
        return this.handleError(error, 'BusinessSettingsService.getSettings');
      }

      if (data) {
        return {
          data,
          error: null,
          success: true,
        };
      } else {
        // No settings found, create default settings
        return await this.createDefaultSettings();
      }
    } catch (error) {
      return this.handleError(error, 'BusinessSettingsService.getSettings');
    }
  }

  static async updateSettings(settings: Partial<BusinessSettings>): Promise<ServiceResponse<BusinessSettings>> {
    try {
      const { data, error } = await supabase
        .from('business_settings')
        .upsert({
          ...settings,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        return this.handleError(error, 'BusinessSettingsService.updateSettings');
      }

      return {
        data,
        error: null,
        success: true,
      };
    } catch (error) {
      return this.handleError(error, 'BusinessSettingsService.updateSettings');
    }
  }

  private static async createDefaultSettings(): Promise<ServiceResponse<BusinessSettings>> {
    try {
      const defaultSettings: BusinessSettings = {
        google_business_url: null,
        business_name: null,
        business_email: null,
        business_phone: null,
        business_address: null
      };

      const { data, error } = await supabase
        .from('business_settings')
        .insert(defaultSettings)
        .select()
        .single();

      if (error) {
        return this.handleError(error, 'BusinessSettingsService.createDefaultSettings');
      }

      return {
        data,
        error: null,
        success: true,
      };
    } catch (error) {
      return this.handleError(error, 'BusinessSettingsService.createDefaultSettings');
    }
  }


}
