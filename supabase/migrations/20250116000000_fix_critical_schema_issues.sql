-- Fix Critical Database Schema Issues
-- This migration fixes schema conflicts and missing tables for production readiness
-- Date: January 16, 2025

-- ============================================================================
-- STEP 1: REMOVE CONFLICTING OLD MIGRATION DATA
-- ============================================================================

-- Drop the old conflicting tables and policies from the old migration
-- This ensures we start with a clean state

-- Drop old policies that conflict with multi-tenant setup
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can insert reviews" ON public.reviews;
DROP POLICY IF EXISTS "Authenticated users can view reviews" ON public.reviews;
DROP POLICY IF EXISTS "Authenticated users can update reviews" ON public.reviews;

-- Drop old triggers that conflict
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;

-- Drop old function that conflicts
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- ============================================================================
-- STEP 2: ADD MISSING USER_INVITATIONS TABLE
-- ============================================================================

-- Create the user_invitations table that the application code expects
CREATE TABLE IF NOT EXISTS public.user_invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'tenant_admin', 'user')),
  tenant_id UUID REFERENCES tenants(id),
  invited_by UUID REFERENCES auth.users(id) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_invitations_email ON public.user_invitations(email);
CREATE INDEX IF NOT EXISTS idx_user_invitations_token ON public.user_invitations(token);
CREATE INDEX IF NOT EXISTS idx_user_invitations_status ON public.user_invitations(status);
CREATE INDEX IF NOT EXISTS idx_user_invitations_tenant_id ON public.user_invitations(tenant_id);

-- ============================================================================
-- STEP 3: ENABLE RLS FOR USER_INVITATIONS
-- ============================================================================

ALTER TABLE public.user_invitations ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 4: CREATE RLS POLICIES FOR USER_INVITATIONS
-- ============================================================================

-- Super admins can manage all invitations
CREATE POLICY "super_admin_user_invitations" ON public.user_invitations
  FOR ALL USING (public.is_super_admin(auth.uid()));

-- Tenant admins can manage invitations for their tenant
CREATE POLICY "tenant_admin_user_invitations" ON public.user_invitations
  FOR ALL USING (
    tenant_id = public.get_current_tenant_id() AND
    public.is_tenant_admin(auth.uid(), tenant_id)
  );

-- Users can view their own invitations (for invitation acceptance)
CREATE POLICY "users_own_invitations" ON public.user_invitations
  FOR SELECT USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- ============================================================================
-- STEP 5: VERIFY AND FIX CRITICAL FUNCTIONS
-- ============================================================================

-- Ensure get_current_tenant_id function exists and works correctly
CREATE OR REPLACE FUNCTION public.get_current_tenant_id()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT tenant_id 
    FROM public.profiles 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure is_super_admin function exists
CREATE OR REPLACE FUNCTION public.is_super_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT role = 'super_admin'
    FROM public.profiles
    WHERE id = user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure is_tenant_admin function exists
CREATE OR REPLACE FUNCTION public.is_tenant_admin(user_id UUID, tenant_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT role = 'tenant_admin' AND profiles.tenant_id = is_tenant_admin.tenant_id
    FROM public.profiles
    WHERE id = user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 6: FIX USER CREATION TRIGGER
-- ============================================================================

-- Create proper user creation trigger that handles tenant assignment
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, tenant_id, avatar_url, preferences)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user'),
    COALESCE((NEW.raw_user_meta_data->>'tenant_id')::UUID, NULL),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
    COALESCE(NEW.raw_user_meta_data, '{}')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- STEP 7: VERIFY AND FIX RLS POLICIES
-- ============================================================================

-- Ensure profiles table has correct RLS policies
DROP POLICY IF EXISTS "super_admin_profiles" ON public.profiles;
DROP POLICY IF EXISTS "tenant_admin_profiles" ON public.profiles;
DROP POLICY IF EXISTS "users_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "users_update_own_profile" ON public.profiles;

-- Recreate profiles policies with correct multi-tenant logic
CREATE POLICY "super_admin_profiles" ON public.profiles
  FOR ALL USING (public.is_super_admin(auth.uid()));

CREATE POLICY "tenant_admin_profiles" ON public.profiles
  FOR ALL USING (
    tenant_id = public.get_current_tenant_id() AND
    public.is_tenant_admin(auth.uid(), tenant_id)
  );

CREATE POLICY "users_own_profile" ON public.profiles
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "users_update_own_profile" ON public.profiles
  FOR UPDATE USING (id = auth.uid());

-- ============================================================================
-- STEP 8: VERIFY REVIEWS TABLE RLS POLICIES
-- ============================================================================

-- Ensure reviews table has correct RLS policies
DROP POLICY IF EXISTS "super_admin_reviews" ON public.reviews;
DROP POLICY IF EXISTS "tenant_reviews" ON public.reviews;
DROP POLICY IF EXISTS "anonymous_review_insert" ON public.reviews;

-- Recreate reviews policies
CREATE POLICY "super_admin_reviews" ON public.reviews
  FOR ALL USING (public.is_super_admin(auth.uid()));

CREATE POLICY "tenant_reviews" ON public.reviews
  FOR ALL USING (
    tenant_id = public.get_current_tenant_id()
  );

-- Allow anonymous users to insert reviews (for public review forms)
CREATE POLICY "anonymous_review_insert" ON public.reviews
  FOR INSERT TO anon WITH CHECK (true);

-- ============================================================================
-- STEP 9: VERIFY BUSINESS_SETTINGS TABLE RLS POLICIES
-- ============================================================================

-- Ensure business_settings table has correct RLS policies
DROP POLICY IF EXISTS "super_admin_business_settings" ON public.business_settings;
DROP POLICY IF EXISTS "tenant_business_settings" ON public.business_settings;

-- Recreate business_settings policies
CREATE POLICY "super_admin_business_settings" ON public.business_settings
  FOR ALL USING (public.is_super_admin(auth.uid()));

CREATE POLICY "tenant_business_settings" ON public.business_settings
  FOR ALL USING (
    tenant_id = public.get_current_tenant_id()
  );

-- ============================================================================
-- STEP 10: GRANT NECESSARY PERMISSIONS
-- ============================================================================

-- Grant permissions for user_invitations table
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_invitations TO authenticated;
GRANT SELECT ON public.user_invitations TO anon; -- For invitation acceptance

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION public.get_current_tenant_id() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_super_admin(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_tenant_admin(UUID, UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon, authenticated;

-- ============================================================================
-- STEP 11: ADD MISSING INDEXES FOR PERFORMANCE
-- ============================================================================

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_tenant_id ON public.profiles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_reviews_tenant_id ON public.reviews(tenant_id);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON public.reviews(created_at);
CREATE INDEX IF NOT EXISTS idx_business_settings_tenant_id ON public.business_settings(tenant_id);

-- ============================================================================
-- STEP 12: INSERT DEFAULT SYSTEM DATA
-- ============================================================================

-- Insert default system settings if they don't exist
INSERT INTO public.system_settings (key, value, description) VALUES
('app_name', '"Crux"', 'Application name'),
('support_email', '"support@alphabusinessdigital.com"', 'Support email address'),
('max_reviews_per_tenant', '10000', 'Maximum reviews per tenant'),
('invitation_expiry_days', '7', 'Invitation expiry in days'),
('enable_analytics', 'true', 'Enable analytics tracking'),
('enable_audit_logs', 'true', 'Enable audit logging')
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- STEP 13: VALIDATION QUERIES
-- ============================================================================

-- Add comments for documentation
COMMENT ON TABLE public.user_invitations IS 'User invitation system for invite-only authentication';
COMMENT ON FUNCTION public.get_current_tenant_id() IS 'Returns current user tenant ID for RLS policies';
COMMENT ON FUNCTION public.is_super_admin(UUID) IS 'Checks if user has super admin role';
COMMENT ON FUNCTION public.is_tenant_admin(UUID, UUID) IS 'Checks if user is admin of specific tenant';
COMMENT ON FUNCTION public.handle_new_user() IS 'Creates user profile on signup with proper tenant assignment';

-- ============================================================================
-- STEP 14: CLEANUP OLD MIGRATION FILE
-- ============================================================================

-- Note: The old migration file 20250829055203_9ea67a6a-9678-4382-93a2-1d73ddb44f08.sql
-- should be manually deleted from the migrations folder after this migration runs successfully
-- This migration has already handled the cleanup of conflicting data

-- ============================================================================
-- VALIDATION: Test that all required tables and functions exist
-- ============================================================================

-- This section can be used to validate the migration worked correctly
-- Run these queries after migration to verify everything is working:

/*
-- Test 1: Verify all tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('tenants', 'profiles', 'business_settings', 'reviews', 'user_invitations', 'audit_logs', 'usage_metrics', 'system_settings');

-- Test 2: Verify all functions exist
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('get_current_tenant_id', 'is_super_admin', 'is_tenant_admin', 'handle_new_user');

-- Test 3: Verify RLS is enabled on all tables
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('tenants', 'profiles', 'business_settings', 'reviews', 'user_invitations', 'audit_logs', 'usage_metrics', 'system_settings');

-- Test 4: Verify policies exist
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;
*/
