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
        business_address: null,
        invoice_template_url: null
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

  static async uploadInvoiceTemplate(file: File): Promise<ServiceResponse<{ url: string; fileName: string }>> {
    try {
      // Validate file type
      if (!file.name.toLowerCase().endsWith('.odt')) {
        return {
          data: null,
          error: 'Invalid file type. Please upload only ODT files.',
          success: false,
        };
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        return {
          data: null,
          error: 'File too large. Please upload files smaller than 10MB.',
          success: false,
        };
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `invoice-template-${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('invoice-templates')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        return this.handleError(error, 'BusinessSettingsService.uploadInvoiceTemplate');
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('invoice-templates')
        .getPublicUrl(fileName);

      return {
        data: {
          url: urlData.publicUrl,
          fileName: fileName
        },
        error: null,
        success: true,
      };
    } catch (error) {
      return this.handleError(error, 'BusinessSettingsService.uploadInvoiceTemplate');
    }
  }

  static async deleteInvoiceTemplate(fileName: string): Promise<ServiceResponse<void>> {
    try {
      const { error } = await supabase.storage
        .from('invoice-templates')
        .remove([fileName]);

      if (error) {
        return this.handleError(error, 'BusinessSettingsService.deleteInvoiceTemplate');
      }

      return {
        data: undefined,
        error: null,
        success: true,
      };
    } catch (error) {
      return this.handleError(error, 'BusinessSettingsService.deleteInvoiceTemplate');
    }
  }
}
