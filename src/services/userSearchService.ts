import { supabase } from '@/integrations/supabase/client';
import { supabaseAdmin, withAdminAuth } from '@/integrations/supabase/admin';
import { BaseService, type ServiceResponse } from './baseService';

export interface UserSearchResult {
  id: string;
  email: string;
  full_name: string;
  current_tenant_id: string | null;
  current_role: string | null;
  created_at: string;
  last_sign_in_at: string | null;
}

/**
 * User Search Service
 * Handles searching for users across profiles and auth.users
 */
export class UserSearchService extends BaseService {
  /**
   * Search for users by name or email
   */
  static async searchUsers(query: string, limit: number = 10): Promise<ServiceResponse<UserSearchResult[]>> {
    try {
      if (query.length < 2) {
        return {
          data: [],
          error: null,
          success: true,
        };
      }

      // Search profiles by name first
      // TODO: Update this after the migration is applied
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select(`
          id,
          role,
          created_at
        `)
        .limit(limit);

      if (profileError) {
        return this.handleError(profileError, 'UserSearchService.searchUsers');
      }

      // Get auth user data for each profile
      const searchResults: UserSearchResult[] = [];
      
      for (const profile of profiles || []) {
        try {
          const { data: authUser } = await withAdminAuth(async () => {
            return await supabaseAdmin.auth.admin.getUserById(profile.id);
          });
          
          if (authUser?.user?.email) {
            const fullName = authUser.user.user_metadata?.full_name || authUser.user.email.split('@')[0];
            const email = authUser.user.email;
            
            // Check if query matches name or email
            if (fullName.toLowerCase().includes(query.toLowerCase()) || 
                email.toLowerCase().includes(query.toLowerCase())) {
              searchResults.push({
                id: profile.id,
                email: email,
                full_name: fullName,
                current_tenant_id: null, // Will be updated after migration
                current_role: profile.role,
                created_at: profile.created_at,
                last_sign_in_at: authUser.user.last_sign_in_at || null,
              });
            }
          }
        } catch (authError) {
          console.warn(`Failed to fetch auth data for user ${profile.id}:`, authError);
          // Skip users without auth data
        }
      }

      // If we need more results, try searching by email
      if (searchResults.length < limit) {
        try {
          const additionalResults = await this.searchUsersByEmail(query, limit - searchResults.length);
          if (additionalResults.success && additionalResults.data) {
            // Merge results, avoiding duplicates
            const existingIds = new Set(searchResults.map(r => r.id));
            const newResults = additionalResults.data.filter(r => !existingIds.has(r.id));
            searchResults.push(...newResults);
          }
        } catch (emailError) {
          console.warn('Email search failed:', emailError);
        }
      }

      return {
        data: searchResults,
        error: null,
        success: true,
      };
    } catch (error) {
      return this.handleError(error, 'UserSearchService.searchUsers');
    }
  }

  /**
   * Search users by email (requires admin access)
   */
  private static async searchUsersByEmail(query: string, limit: number): Promise<ServiceResponse<UserSearchResult[]>> {
    try {
      // Get all users from auth.users (this is expensive, so we limit it)
      const { data: authUsers, error: authError } = await withAdminAuth(async () => {
        return await supabaseAdmin.auth.admin.listUsers({
          page: 1,
          perPage: 1000 // Adjust based on your user count
        });
      });

      if (authError) {
        return this.handleError(authError, 'UserSearchService.searchUsersByEmail');
      }

      // Filter users by email
      const matchingUsers = authUsers.users
        .filter(user => user.email?.toLowerCase().includes(query.toLowerCase()))
        .slice(0, limit);

      // Get profile data for matching users
      const searchResults: UserSearchResult[] = [];
      
      for (const authUser of matchingUsers) {
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select(`
              id,
              role,
              created_at
            `)
            .eq('id', authUser.id)
            .single();

          if (profile) {
            searchResults.push({
              id: profile.id,
              email: authUser.email || '',
              full_name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'Unknown',
              current_tenant_id: null, // Will be updated after migration
              current_role: profile.role,
              created_at: profile.created_at,
              last_sign_in_at: authUser.last_sign_in_at || null,
            });
          }
        } catch (profileError) {
          console.warn(`Failed to fetch profile for user ${authUser.id}:`, profileError);
        }
      }

      return {
        data: searchResults,
        error: null,
        success: true,
      };
    } catch (error) {
      return this.handleError(error, 'UserSearchService.searchUsersByEmail');
    }
  }

  /**
   * Get all users (for dropdown lists)
   */
  static async getAllUsers(limit: number = 50): Promise<ServiceResponse<UserSearchResult[]>> {
    try {
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select(`
          id,
          role,
          created_at
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (profileError) {
        return this.handleError(profileError, 'UserSearchService.getAllUsers');
      }

      // Get auth user data for each profile
      const users: UserSearchResult[] = [];
      
      for (const profile of profiles || []) {
        try {
          const { data: authUser } = await withAdminAuth(async () => {
            return await supabaseAdmin.auth.admin.getUserById(profile.id);
          });
          
          if (authUser?.user?.email) {
            users.push({
              id: profile.id,
              email: authUser.user.email,
              full_name: authUser.user.user_metadata?.full_name || authUser.user.email.split('@')[0],
              current_tenant_id: null, // Will be updated after migration
              current_role: profile.role,
              created_at: profile.created_at,
              last_sign_in_at: authUser.user.last_sign_in_at || null,
            });
          }
        } catch (authError) {
          console.warn(`Failed to fetch auth data for user ${profile.id}:`, authError);
        }
      }

      return {
        data: users,
        error: null,
        success: true,
      };
    } catch (error) {
      return this.handleError(error, 'UserSearchService.getAllUsers');
    }
  }
}
