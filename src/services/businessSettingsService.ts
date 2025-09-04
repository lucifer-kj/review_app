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

      // Check if user_id column exists
      const hasUserIdColumn = await this.checkUserIdColumnExists();
      
      let query = supabase.from('business_settings').select('*');
      
      if (hasUserIdColumn) {
        // Use user_id filter if column exists
        query = query.eq('user_id', user.id);
      } else {
        // Fallback: get first settings (temporary until migration is run)
        // No additional filter; just select the first row
        query = query.limit(1);
        console.warn('user_id column not found in business_settings table. Using fallback query.');
      }
      
      const { data, error } = await query.maybeSingle();

      if (error) {
        // If error is due to user_id column not existing, try without it
        if (error.message.includes('column "user_id" does not exist')) {
          console.warn('user_id column not found, falling back to basic query');
          const fallbackResult = await supabase
            .from('business_settings')
            .select('*')
            .maybeSingle();
          
          if (fallbackResult.error) {
            return this.handleError(fallbackResult.error, 'BusinessSettingsService.getBusinessSettings');
          }
          
          return {
            data: fallbackResult.data as BusinessSettings || null,
            error: null,
            success: true,
          };
        }
        return this.handleError(error, 'BusinessSettingsService.getBusinessSettings');
      }

      return {
        data: data as BusinessSettings || null,
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

      // Check if user_id column exists
      const hasUserIdColumn = await this.checkUserIdColumnExists();

      // First try to get existing settings
      const existingSettings = await this.getBusinessSettings();
      
      if (existingSettings.success && existingSettings.data) {
        // Update existing settings
        let query = supabase
          .from('business_settings')
          .update(settings)
          .eq('id', existingSettings.data.id);
        
        if (hasUserIdColumn) {
          query = query.eq('user_id', user.id);
        }
        
        const { data, error } = await query.select().single();

        if (error) {
          // If error is due to user_id column not existing, try without it
          if (error.message.includes('column "user_id" does not exist')) {
            console.warn('user_id column not found, falling back to basic update');
            const fallbackResult = await supabase
              .from('business_settings')
              .update(settings)
              .eq('id', existingSettings.data.id)
              .select()
              .single();
            
            if (fallbackResult.error) {
              return this.handleError(fallbackResult.error, 'BusinessSettingsService.updateBusinessSettings');
            }
            
            return {
              data: fallbackResult.data as BusinessSettings,
              error: null,
              success: true,
            };
          }
          return this.handleError(error, 'BusinessSettingsService.updateBusinessSettings');
        }

        return {
          data: data as BusinessSettings,
          error: null,
          success: true,
        };
      } else {
        // Create new settings
        const insertData = hasUserIdColumn 
          ? { ...settings, user_id: user.id }
          : settings;

        const { data, error } = await supabase
          .from('business_settings')
          .insert(insertData)
          .select()
          .single();

        if (error) {
          // If error is due to user_id column not existing, try without it
          if (error.message.includes('column "user_id" does not exist')) {
            console.warn('user_id column not found, falling back to basic insert');
            const fallbackResult = await supabase
              .from('business_settings')
              .insert(settings)
              .select()
              .single();
            
            if (fallbackResult.error) {
              return this.handleError(fallbackResult.error, 'BusinessSettingsService.createBusinessSettings');
            }
            
            return {
              data: fallbackResult.data as BusinessSettings,
              error: null,
              success: true,
            };
          }
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

      // Check if user_id column exists
      const hasUserIdColumn = await this.checkUserIdColumnExists();
      
      let query = supabase.from('business_settings').delete();
      
      if (hasUserIdColumn) {
        query = query.eq('user_id', user.id);
      }

      const { error } = await query;

      if (error) {
        // If error is due to user_id column not existing, try without it
        if (error.message.includes('column "user_id" does not exist')) {
          console.warn('user_id column not found, falling back to basic delete');
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
