import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

// Mock test user for bypassing authentication
const createTestUser = (): User => ({
  id: "test-user-id",
  email: "test@crux.com",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  aud: "authenticated",
  role: "authenticated",
  email_confirmed_at: new Date().toISOString(),
  phone: "",
  confirmation_sent_at: new Date().toISOString(),
  confirmed_at: new Date().toISOString(),
  recovery_sent_at: null,
  last_sign_in_at: new Date().toISOString(),
  app_metadata: {},
  user_metadata: {},
  identities: [],
  factors: []
});

// Mock user for specific bypass
const createBypassUser = (): User => ({
  id: "edd7c8bc-f167-43b0-8ef0-53120b5cd444",
  email: "bypass@crux.com",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  aud: "authenticated",
  role: "authenticated",
  email_confirmed_at: new Date().toISOString(),
  phone: "",
  confirmation_sent_at: new Date().toISOString(),
  confirmed_at: new Date().toISOString(),
  recovery_sent_at: null,
  last_sign_in_at: new Date().toISOString(),
  app_metadata: {},
  user_metadata: {},
  identities: [],
  factors: []
});

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isTestUser, setIsTestUser] = useState(false);
  const [isBypassUser, setIsBypassUser] = useState(false);

  useEffect(() => {
    // Check for test user in localStorage first
    const storedTestUser = localStorage.getItem('crux_test_user');
    if (storedTestUser === 'true') {
      setUser(createTestUser());
      setIsTestUser(true);
      setIsBypassUser(false);
      setLoading(false);
      return;
    }

    // Check for bypass user in localStorage
    const storedBypassUser = localStorage.getItem('crux_bypass_user');
    if (storedBypassUser === 'true') {
      setUser(createBypassUser());
      setIsTestUser(false);
      setIsBypassUser(true);
      setLoading(false);
      return;
    }

    // Set up auth state listener for real users
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsTestUser(false);
        setIsBypassUser(false);
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsTestUser(false);
      setIsBypassUser(false);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    // Clear test user from localStorage
    localStorage.removeItem('crux_test_user');
    localStorage.removeItem('crux_bypass_user');
    setIsTestUser(false);
    setIsBypassUser(false);
    
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return { 
    user, 
    session, 
    loading, 
    signOut,
    isAuthenticated: !!user,
    isTestUser,
    isBypassUser
  };
};
