-- Resolve RLS Policy Conflicts
-- This migration consolidates all RLS policies and removes conflicts
-- Date: January 16, 2025

-- ============================================================================
-- STEP 1: DROP ALL EXISTING POLICIES TO START CLEAN
-- ============================================================================

-- Drop all profiles policies
DROP POLICY IF EXISTS "super_admin_profiles" ON public.profiles;
DROP POLICY IF EXISTS "tenant_admin_profiles" ON public.profiles;
DROP POLICY IF EXISTS "users_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "users_update_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Tenant admins can view tenant profiles" ON public.profiles;
DROP POLICY IF EXISTS "Tenant admins can update tenant profiles" ON public.profiles;
DROP POLICY IF EXISTS "profiles_super_admin_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_tenant_admin_tenant_users" ON public.profiles;
DROP POLICY IF EXISTS "profiles_users_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "profiles_users_update_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "tenant_isolation" ON public.profiles;

-- Drop all tenants policies
DROP POLICY IF EXISTS "super_admin_tenants" ON public.tenants;
DROP POLICY IF EXISTS "tenant_admin_own_tenant" ON public.tenants;
DROP POLICY IF EXISTS "tenant_admin_update_own_tenant" ON public.tenants;
DROP POLICY IF EXISTS "super_admin_tenants_full_access" ON public.tenants;
DROP POLICY IF EXISTS "tenant_admin_own_tenant_access" ON public.tenants;
DROP POLICY IF EXISTS "tenant_admin_update_own_tenant_access" ON public.tenants;
DROP POLICY IF EXISTS "public_active_tenants_read" ON public.tenants;
DROP POLICY IF EXISTS "authenticated_tenants_read" ON public.tenants;
DROP POLICY IF EXISTS "tenants_super_admin_all" ON public.tenants;
DROP POLICY IF EXISTS "tenants_tenant_admin_read_own" ON public.tenants;
DROP POLICY IF EXISTS "tenants_tenant_admin_update_own" ON public.tenants;

-- Drop all business_settings policies
DROP POLICY IF EXISTS "super_admin_business_settings" ON public.business_settings;
DROP POLICY IF EXISTS "tenant_business_settings" ON public.business_settings;
DROP POLICY IF EXISTS "super_admin_business_settings_full_access" ON public.business_settings;
DROP POLICY IF EXISTS "tenant_business_settings_access" ON public.business_settings;
DROP POLICY IF EXISTS "public_business_settings_read" ON public.business_settings;
DROP POLICY IF EXISTS "business_settings_super_admin_all" ON public.business_settings;
DROP POLICY IF EXISTS "business_settings_tenant_isolation" ON public.business_settings;
DROP POLICY IF EXISTS "tenant_isolation_business_settings" ON public.business_settings;

-- Drop all reviews policies
DROP POLICY IF EXISTS "super_admin_reviews" ON public.reviews;
DROP POLICY IF EXISTS "tenant_reviews" ON public.reviews;
DROP POLICY IF EXISTS "anonymous_review_insert" ON public.reviews;
DROP POLICY IF EXISTS "authenticated_review_insert" ON public.reviews;
DROP POLICY IF EXISTS "reviews_super_admin_all" ON public.reviews;
DROP POLICY IF EXISTS "reviews_tenant_isolation" ON public.reviews;
DROP POLICY IF EXISTS "reviews_anonymous_insert" ON public.reviews;
DROP POLICY IF EXISTS "tenant_isolation_reviews" ON public.reviews;

-- Drop all user_invitations policies
DROP POLICY IF EXISTS "super_admin_user_invitations" ON public.user_invitations;
DROP POLICY IF EXISTS "tenant_admin_user_invitations" ON public.user_invitations;
DROP POLICY IF EXISTS "users_own_invitations" ON public.user_invitations;
DROP POLICY IF EXISTS "super_admin_invitations" ON public.user_invitations;
DROP POLICY IF EXISTS "tenant_admin_invitations" ON public.user_invitations;
DROP POLICY IF EXISTS "super_admin_invitations_all" ON public.user_invitations;
DROP POLICY IF EXISTS "tenant_admin_invitations_all" ON public.user_invitations;
DROP POLICY IF EXISTS "authenticated_create_invitations" ON public.user_invitations;
DROP POLICY IF EXISTS "authenticated_read_invitations" ON public.user_invitations;
DROP POLICY IF EXISTS "authenticated_update_invitations" ON public.user_invitations;
DROP POLICY IF EXISTS "authenticated_delete_invitations" ON public.user_invitations;

-- Drop all audit_logs policies
DROP POLICY IF EXISTS "super_admin_audit_logs" ON public.audit_logs;
DROP POLICY IF EXISTS "tenant_audit_logs" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_super_admin_all" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_tenant_read" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_tenant_insert" ON public.audit_logs;

-- Drop all usage_metrics policies
DROP POLICY IF EXISTS "super_admin_usage_metrics" ON public.usage_metrics;
DROP POLICY IF EXISTS "tenant_usage_metrics" ON public.usage_metrics;
DROP POLICY IF EXISTS "usage_metrics_super_admin_all" ON public.usage_metrics;
DROP POLICY IF EXISTS "usage_metrics_tenant_read" ON public.usage_metrics;
DROP POLICY IF EXISTS "usage_metrics_tenant_insert" ON public.usage_metrics;

-- Drop all system_settings policies
DROP POLICY IF EXISTS "super_admin_system_settings" ON public.system_settings;
DROP POLICY IF EXISTS "system_settings_super_admin_only" ON public.system_settings;

-- ============================================================================
-- STEP 2: CREATE CLEAN, CONSISTENT POLICIES
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
-- STEP 3: VERIFY REQUIRED FUNCTIONS EXIST
-- ============================================================================

-- Ensure all required functions exist and work correctly
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
-- STEP 4: GRANT NECESSARY PERMISSIONS
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
-- STEP 5: ADD COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON POLICY "system_settings_super_admin_only" ON public.system_settings IS 'Only super admins can access system settings';
COMMENT ON POLICY "tenants_super_admin_all" ON public.tenants IS 'Super admins can manage all tenants';
COMMENT ON POLICY "tenants_tenant_admin_read_own" ON public.tenants IS 'Tenant admins can read their own tenant';
COMMENT ON POLICY "tenants_tenant_admin_update_own" ON public.tenants IS 'Tenant admins can update their own tenant';
COMMENT ON POLICY "tenants_public_read_active" ON public.tenants IS 'Public can read active tenants for review forms';
COMMENT ON POLICY "tenants_authenticated_read_access" ON public.tenants IS 'Authenticated users can read tenants they have access to';
COMMENT ON POLICY "profiles_super_admin_all" ON public.profiles IS 'Super admins can manage all profiles';
COMMENT ON POLICY "profiles_tenant_admin_tenant" ON public.profiles IS 'Tenant admins can manage profiles in their tenant';
COMMENT ON POLICY "profiles_users_view_own" ON public.profiles IS 'Users can view their own profile';
COMMENT ON POLICY "profiles_users_update_own" ON public.profiles IS 'Users can update their own profile';
COMMENT ON POLICY "user_invitations_super_admin_all" ON public.user_invitations IS 'Super admins can manage all invitations';
COMMENT ON POLICY "user_invitations_tenant_admin_tenant" ON public.user_invitations IS 'Tenant admins can manage invitations for their tenant';
COMMENT ON POLICY "user_invitations_users_view_own" ON public.user_invitations IS 'Users can view their own invitations';
COMMENT ON POLICY "business_settings_super_admin_all" ON public.business_settings IS 'Super admins can manage all business settings';
COMMENT ON POLICY "business_settings_tenant_users" ON public.business_settings IS 'Tenant users can manage their business settings';
COMMENT ON POLICY "business_settings_public_read_active" ON public.business_settings IS 'Public can read business settings for active tenants';
COMMENT ON POLICY "reviews_super_admin_all" ON public.reviews IS 'Super admins can manage all reviews';
COMMENT ON POLICY "reviews_tenant_users" ON public.reviews IS 'Tenant users can manage their reviews';
COMMENT ON POLICY "reviews_anonymous_insert" ON public.reviews IS 'Anonymous users can insert reviews';
COMMENT ON POLICY "audit_logs_super_admin_all" ON public.audit_logs IS 'Super admins can manage all audit logs';
COMMENT ON POLICY "audit_logs_tenant_read" ON public.audit_logs IS 'Tenant users can read audit logs for their tenant';
COMMENT ON POLICY "audit_logs_tenant_insert" ON public.audit_logs IS 'Tenant users can insert audit logs for their tenant';
COMMENT ON POLICY "usage_metrics_super_admin_all" ON public.usage_metrics IS 'Super admins can manage all usage metrics';
COMMENT ON POLICY "usage_metrics_tenant_read" ON public.usage_metrics IS 'Tenant users can read usage metrics for their tenant';
COMMENT ON POLICY "usage_metrics_tenant_insert" ON public.usage_metrics IS 'Tenant users can insert usage metrics for their tenant';

-- ============================================================================
-- VALIDATION: Test that all policies are working correctly
-- ============================================================================

-- This section can be used to validate the policies work correctly
-- Run these queries after migration to verify everything is working:

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
*/
