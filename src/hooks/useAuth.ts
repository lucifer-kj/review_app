import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  role: 'super_admin' | 'tenant_admin' | 'user';
  tenant_id?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface TenantInfo {
  id: string;
  name: string;
  domain?: string;
  status: 'active' | 'suspended' | 'pending';
  settings?: {
    description?: string;
    features?: {
      analytics: boolean;
      custom_domain: boolean;
      api_access: boolean;
      priority_support: boolean;
    };
    limits?: {
      max_users: number;
      max_reviews: number;
      storage_limit: number;
    };
  };
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [tenant, setTenant] = useState<TenantInfo | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch user profile and tenant information
  const fetchUserProfile = useCallback(async (userId: string) => {
    try {
      // Get user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        return;
      }

      setProfile(profileData);

      // If user has a tenant, fetch tenant information
      if (profileData.tenant_id) {
        const { data: tenantData, error: tenantError } = await supabase
          .from('tenants')
          .select('*')
          .eq('id', profileData.tenant_id)
          .single();

        if (tenantError) {
          console.error('Error fetching tenant:', tenantError);
          setTenant(null);
        } else {
          setTenant(tenantData);
        }
      } else {
        setTenant(null);
      }
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
    }
  }, []);

  // Refresh user data (useful for real-time updates)
  const refreshUserData = useCallback(async () => {
    if (user?.id) {
      await fetchUserProfile(user.id);
    }
  }, [user?.id, fetchUserProfile]);

  useEffect(() => {
    // Set up auth state listener for authenticated users only
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await fetchUserProfile(session.user.id);
        } else {
          setProfile(null);
          setTenant(null);
        }
        
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await fetchUserProfile(session.user.id);
      } else {
        setProfile(null);
        setTenant(null);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchUserProfile]);

  const login = async (email: string, password: string) => {
    // First authenticate with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) throw error;
    
    if (!data.user) {
      throw new Error('Authentication failed');
    }

    // Get user profile to check role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profileError || !profile) {
      throw new Error('User profile not found. Please contact your administrator.');
    }

    // For super admins, skip invitation check
    if (profile.role === 'super_admin') {
      // Super admin can login directly
      return !!data.user;
    }

    // For regular users, check if they have a valid invitation
    const { data: invitation, error: invitationError } = await supabase
      .from('user_invitations')
      .select('*')
      .eq('email', email)
      .eq('status', 'pending')
      .single();

    if (invitationError || !invitation) {
      throw new Error('No valid invitation found for this email. Please contact your administrator.');
    }

    // Check if invitation is expired
    if (new Date(invitation.expires_at) < new Date()) {
      // Mark as expired
      await supabase
        .from('user_invitations')
        .update({ status: 'expired' })
        .eq('id', invitation.id);
      
      throw new Error('Your invitation has expired. Please contact your administrator for a new invitation.');
    }
    
    // The user profile will be fetched automatically by the auth state listener
    return !!data.user;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return { 
    user, 
    session, 
    profile,
    tenant,
    loading, 
    login,
    signOut,
    refreshUserData,
    isAuthenticated: !!user
  };
};
