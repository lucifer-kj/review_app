-- Fix RLS Validation Issues
-- This migration fixes the specific issues identified by the validation script
-- Date: January 16, 2025

-- ============================================================================
-- STEP 1: FIX USER_INVITATIONS TABLE SCHEMA
-- ============================================================================

-- First, let's check if the user_invitations table has the correct schema
-- If it doesn't have a status column, we need to add it
DO $$
BEGIN
    -- Check if status column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_invitations' 
        AND column_name = 'status'
        AND table_schema = 'public'
    ) THEN
        -- Add status column if it doesn't exist
        ALTER TABLE public.user_invitations 
        ADD COLUMN status VARCHAR(20) DEFAULT 'pending' NOT NULL;
        
        -- Add check constraint for status values
        ALTER TABLE public.user_invitations 
        ADD CONSTRAINT check_status 
        CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled'));
    END IF;
END $$;

-- ============================================================================
-- STEP 2: DROP ALL EXISTING POLICIES AND RECREATE THEM CORRECTLY
-- ============================================================================

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "system_settings_super_admin_only" ON public.system_settings;
DROP POLICY IF EXISTS "tenants_super_admin_all" ON public.tenants;
DROP POLICY IF EXISTS "tenants_tenant_admin_read_own" ON public.tenants;
DROP POLICY IF EXISTS "tenants_tenant_admin_update_own" ON public.tenants;
DROP POLICY IF EXISTS "tenants_public_read_active" ON public.tenants;
DROP POLICY IF EXISTS "tenants_authenticated_read_access" ON public.tenants;
DROP POLICY IF EXISTS "profiles_super_admin_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_tenant_admin_tenant" ON public.profiles;
DROP POLICY IF EXISTS "profiles_users_view_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_users_update_own" ON public.profiles;
DROP POLICY IF EXISTS "user_invitations_super_admin_all" ON public.user_invitations;
DROP POLICY IF EXISTS "user_invitations_tenant_admin_tenant" ON public.user_invitations;
DROP POLICY IF EXISTS "user_invitations_users_view_own" ON public.user_invitations;
DROP POLICY IF EXISTS "business_settings_super_admin_all" ON public.business_settings;
DROP POLICY IF EXISTS "business_settings_tenant_users" ON public.business_settings;
DROP POLICY IF EXISTS "business_settings_public_read_active" ON public.business_settings;
DROP POLICY IF EXISTS "reviews_super_admin_all" ON public.reviews;
DROP POLICY IF EXISTS "reviews_tenant_users" ON public.reviews;
DROP POLICY IF EXISTS "reviews_anonymous_insert" ON public.reviews;
DROP POLICY IF EXISTS "audit_logs_super_admin_all" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_tenant_read" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_tenant_insert" ON public.audit_logs;
DROP POLICY IF EXISTS "usage_metrics_super_admin_all" ON public.usage_metrics;
DROP POLICY IF EXISTS "usage_metrics_tenant_read" ON public.usage_metrics;
DROP POLICY IF EXISTS "usage_metrics_tenant_insert" ON public.usage_metrics;

-- ============================================================================
-- STEP 3: ENSURE ALL REQUIRED FUNCTIONS EXIST AND WORK CORRECTLY
-- ============================================================================

-- Fix get_current_tenant_id function
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

-- Fix is_super_admin function
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

-- Fix is_tenant_admin function
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
-- STEP 4: CREATE CORRECTED RLS POLICIES
-- ============================================================================

-- ============================================================================
-- SYSTEM_SETTINGS POLICIES
-- ============================================================================

-- Only super admins can access system settings
CREATE POLICY "system_settings_super_admin_only" ON public.system_settings
  FOR ALL USING (public.is_super_admin(auth.uid()));

-- ============================================================================
-- TENANTS POLICIES
-- ============================================================================

-- Super admins can manage all tenants
CREATE POLICY "tenants_super_admin_all" ON public.tenants
  FOR ALL USING (public.is_super_admin(auth.uid()));

-- Tenant admins can view and update their own tenant
CREATE POLICY "tenants_tenant_admin_read_own" ON public.tenants
  FOR SELECT USING (
    public.is_tenant_admin(auth.uid(), id)
  );

CREATE POLICY "tenants_tenant_admin_update_own" ON public.tenants
  FOR UPDATE USING (
    public.is_tenant_admin(auth.uid(), id)
  );

-- Public can read active tenants (for review forms)
CREATE POLICY "tenants_public_read_active" ON public.tenants
  FOR SELECT TO anon USING (status = 'active');

-- Authenticated users can read tenants they have access to
CREATE POLICY "tenants_authenticated_read_access" ON public.tenants
  FOR SELECT TO authenticated USING (
    public.is_super_admin(auth.uid()) OR
    public.is_tenant_admin(auth.uid(), id) OR
    id = public.get_current_tenant_id()
  );

-- ============================================================================
-- PROFILES POLICIES
-- ============================================================================

-- Super admins can manage all profiles
CREATE POLICY "profiles_super_admin_all" ON public.profiles
  FOR ALL USING (public.is_super_admin(auth.uid()));

-- Tenant admins can manage profiles in their tenant
CREATE POLICY "profiles_tenant_admin_tenant" ON public.profiles
  FOR ALL USING (
    tenant_id = public.get_current_tenant_id() AND
    public.is_tenant_admin(auth.uid(), tenant_id)
  );

-- Users can view their own profile
CREATE POLICY "profiles_users_view_own" ON public.profiles
  FOR SELECT USING (id = auth.uid());

-- Users can update their own profile
CREATE POLICY "profiles_users_update_own" ON public.profiles
  FOR UPDATE USING (id = auth.uid());

-- ============================================================================
-- USER_INVITATIONS POLICIES
-- ============================================================================

-- Super admins can manage all invitations
CREATE POLICY "user_invitations_super_admin_all" ON public.user_invitations
  FOR ALL USING (public.is_super_admin(auth.uid()));

-- Tenant admins can manage invitations for their tenant
CREATE POLICY "user_invitations_tenant_admin_tenant" ON public.user_invitations
  FOR ALL USING (
    tenant_id = public.get_current_tenant_id() AND
    public.is_tenant_admin(auth.uid(), tenant_id)
  );

-- Users can view their own invitations (for invitation acceptance)
CREATE POLICY "user_invitations_users_view_own" ON public.user_invitations
  FOR SELECT USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- ============================================================================
-- BUSINESS_SETTINGS POLICIES
-- ============================================================================

-- Super admins can manage all business settings
CREATE POLICY "business_settings_super_admin_all" ON public.business_settings
  FOR ALL USING (public.is_super_admin(auth.uid()));

-- Tenant users can manage their own business settings
CREATE POLICY "business_settings_tenant_users" ON public.business_settings
  FOR ALL USING (
    tenant_id = public.get_current_tenant_id()
  );

-- Public can read business settings for active tenants (for review forms)
CREATE POLICY "business_settings_public_read_active" ON public.business_settings
  FOR SELECT TO anon USING (
    tenant_id IN (
      SELECT id FROM public.tenants WHERE status = 'active'
    )
  );

-- ============================================================================
-- REVIEWS POLICIES
-- ============================================================================

-- Super admins can manage all reviews
CREATE POLICY "reviews_super_admin_all" ON public.reviews
  FOR ALL USING (public.is_super_admin(auth.uid()));

-- Tenant users can manage their own reviews
CREATE POLICY "reviews_tenant_users" ON public.reviews
  FOR ALL USING (
    tenant_id = public.get_current_tenant_id()
  );

-- Anonymous users can insert reviews (for public review forms)
CREATE POLICY "reviews_anonymous_insert" ON public.reviews
  FOR INSERT TO anon WITH CHECK (true);

-- ============================================================================
-- AUDIT_LOGS POLICIES
-- ============================================================================

-- Super admins can manage all audit logs
CREATE POLICY "audit_logs_super_admin_all" ON public.audit_logs
  FOR ALL USING (public.is_super_admin(auth.uid()));

-- Tenant users can read audit logs for their tenant
CREATE POLICY "audit_logs_tenant_read" ON public.audit_logs
  FOR SELECT USING (
    tenant_id = public.get_current_tenant_id()
  );

-- Tenant users can insert audit logs for their tenant
CREATE POLICY "audit_logs_tenant_insert" ON public.audit_logs
  FOR INSERT WITH CHECK (
    tenant_id = public.get_current_tenant_id()
  );

-- ============================================================================
-- USAGE_METRICS POLICIES
-- ============================================================================

-- Super admins can manage all usage metrics
CREATE POLICY "usage_metrics_super_admin_all" ON public.usage_metrics
  FOR ALL USING (public.is_super_admin(auth.uid()));

-- Tenant users can read usage metrics for their tenant
CREATE POLICY "usage_metrics_tenant_read" ON public.usage_metrics
  FOR SELECT USING (
    tenant_id = public.get_current_tenant_id()
  );

-- Tenant users can insert usage metrics for their tenant
CREATE POLICY "usage_metrics_tenant_insert" ON public.usage_metrics
  FOR INSERT WITH CHECK (
    tenant_id = public.get_current_tenant_id()
  );

-- ============================================================================
-- STEP 5: GRANT NECESSARY PERMISSIONS
-- ============================================================================

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION public.get_current_tenant_id() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_super_admin(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_tenant_admin(UUID, UUID) TO authenticated, anon;

-- Grant table permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.system_settings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tenants TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_invitations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.business_settings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reviews TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.audit_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.usage_metrics TO authenticated;

-- Grant anonymous access for public review forms
GRANT SELECT ON public.tenants TO anon;
GRANT SELECT ON public.business_settings TO anon;
GRANT INSERT ON public.reviews TO anon;

-- ============================================================================
-- STEP 6: CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

-- Create indexes for user_invitations if they don't exist
CREATE INDEX IF NOT EXISTS idx_user_invitations_email ON public.user_invitations(email);
CREATE INDEX IF NOT EXISTS idx_user_invitations_token ON public.user_invitations(token);
CREATE INDEX IF NOT EXISTS idx_user_invitations_status ON public.user_invitations(status);
CREATE INDEX IF NOT EXISTS idx_user_invitations_tenant_id ON public.user_invitations(tenant_id);

-- Create indexes for profiles
CREATE INDEX IF NOT EXISTS idx_profiles_tenant_id ON public.profiles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- Create indexes for business_settings
CREATE INDEX IF NOT EXISTS idx_business_settings_tenant_id ON public.business_settings(tenant_id);

-- Create indexes for reviews
CREATE INDEX IF NOT EXISTS idx_reviews_tenant_id ON public.reviews(tenant_id);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON public.reviews(created_at);

-- ============================================================================
-- STEP 7: VALIDATION QUERIES
-- ============================================================================

-- These queries can be used to validate the policies are working correctly
-- Uncomment and run these after migration to verify everything works:

/*
-- Test 1: Verify all policies exist
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;

-- Test 2: Verify RLS is enabled on all tables
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('tenants', 'profiles', 'business_settings', 'reviews', 'user_invitations', 'audit_logs', 'usage_metrics', 'system_settings');

-- Test 3: Test tenant isolation
-- This should only return data for the current user's tenant
SELECT * FROM business_settings;

-- Test 4: Test super admin access
-- This should work for super admin users
SELECT * FROM system_settings;

-- Test 5: Test user profile access
-- This should work for authenticated users
SELECT * FROM profiles WHERE id = auth.uid();
*/
