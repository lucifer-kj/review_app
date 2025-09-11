-- Comprehensive RLS Policy Fix
-- This migration ensures proper tenant isolation and security

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "super_admin_system_settings" ON public.system_settings;
DROP POLICY IF EXISTS "super_admin_tenants" ON public.tenants;
DROP POLICY IF EXISTS "tenant_admin_own_tenant" ON public.tenants;
DROP POLICY IF EXISTS "tenant_admin_update_own_tenant" ON public.tenants;
DROP POLICY IF EXISTS "super_admin_profiles" ON public.profiles;
DROP POLICY IF EXISTS "tenant_admin_profiles" ON public.profiles;
DROP POLICY IF EXISTS "users_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "users_update_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "super_admin_business_settings" ON public.business_settings;
DROP POLICY IF EXISTS "tenant_business_settings" ON public.business_settings;
DROP POLICY IF EXISTS "super_admin_reviews" ON public.reviews;
DROP POLICY IF EXISTS "tenant_reviews" ON public.reviews;
DROP POLICY IF EXISTS "anonymous_review_insert" ON public.reviews;
DROP POLICY IF EXISTS "super_admin_audit_logs" ON public.audit_logs;
DROP POLICY IF EXISTS "tenant_audit_logs" ON public.audit_logs;
DROP POLICY IF EXISTS "super_admin_usage_metrics" ON public.usage_metrics;
DROP POLICY IF EXISTS "tenant_usage_metrics" ON public.usage_metrics;

-- Create comprehensive RLS policies

-- System Settings (Super Admin Only)
CREATE POLICY "system_settings_super_admin_only" ON public.system_settings
  FOR ALL USING (public.is_super_admin(auth.uid()));

-- Tenants Table Policies
CREATE POLICY "tenants_super_admin_all" ON public.tenants
  FOR ALL USING (public.is_super_admin(auth.uid()));

CREATE POLICY "tenants_tenant_admin_read_own" ON public.tenants
  FOR SELECT USING (
    public.is_tenant_admin(auth.uid(), id)
  );

CREATE POLICY "tenants_tenant_admin_update_own" ON public.tenants
  FOR UPDATE USING (
    public.is_tenant_admin(auth.uid(), id)
  );

-- Profiles Table Policies
CREATE POLICY "profiles_super_admin_all" ON public.profiles
  FOR ALL USING (public.is_super_admin(auth.uid()));

CREATE POLICY "profiles_tenant_admin_tenant_users" ON public.profiles
  FOR ALL USING (
    tenant_id = public.get_current_tenant_id() AND
    public.is_tenant_admin(auth.uid(), tenant_id)
  );

CREATE POLICY "profiles_users_own_profile" ON public.profiles
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "profiles_users_update_own_profile" ON public.profiles
  FOR UPDATE USING (id = auth.uid());

-- Business Settings Table Policies
CREATE POLICY "business_settings_super_admin_all" ON public.business_settings
  FOR ALL USING (public.is_super_admin(auth.uid()));

CREATE POLICY "business_settings_tenant_isolation" ON public.business_settings
  FOR ALL USING (
    tenant_id = public.get_current_tenant_id()
  );

-- Reviews Table Policies
CREATE POLICY "reviews_super_admin_all" ON public.reviews
  FOR ALL USING (public.is_super_admin(auth.uid()));

CREATE POLICY "reviews_tenant_isolation" ON public.reviews
  FOR ALL USING (
    tenant_id = public.get_current_tenant_id()
  );

-- Allow anonymous users to insert reviews (for public forms)
CREATE POLICY "reviews_anonymous_insert" ON public.reviews
  FOR INSERT WITH CHECK (true);

-- Audit Logs Table Policies
CREATE POLICY "audit_logs_super_admin_all" ON public.audit_logs
  FOR ALL USING (public.is_super_admin(auth.uid()));

CREATE POLICY "audit_logs_tenant_read" ON public.audit_logs
  FOR SELECT USING (
    tenant_id = public.get_current_tenant_id()
  );

CREATE POLICY "audit_logs_tenant_insert" ON public.audit_logs
  FOR INSERT WITH CHECK (
    tenant_id = public.get_current_tenant_id() OR
    public.is_super_admin(auth.uid())
  );

-- Usage Metrics Table Policies
CREATE POLICY "usage_metrics_super_admin_all" ON public.usage_metrics
  FOR ALL USING (public.is_super_admin(auth.uid()));

CREATE POLICY "usage_metrics_tenant_read" ON public.usage_metrics
  FOR SELECT USING (
    tenant_id = public.get_current_tenant_id()
  );

CREATE POLICY "usage_metrics_tenant_insert" ON public.usage_metrics
  FOR INSERT WITH CHECK (
    tenant_id = public.get_current_tenant_id() OR
    public.is_super_admin(auth.uid())
  );

-- Create missing database functions if they don't exist
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

CREATE OR REPLACE FUNCTION public.is_super_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT role = 'super_admin' 
    FROM public.profiles 
    WHERE id = user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_tenant_admin(user_id UUID DEFAULT auth.uid(), tenant_id UUID DEFAULT public.get_current_tenant_id())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT role = 'tenant_admin' 
    FROM public.profiles 
    WHERE id = user_id 
    AND profiles.tenant_id = tenant_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.get_current_tenant_id() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_super_admin(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_tenant_admin(UUID, UUID) TO authenticated, anon;

-- Ensure RLS is enabled on all tables
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_metrics ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_tenant_id ON public.profiles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_reviews_tenant_id ON public.reviews(tenant_id);
CREATE INDEX IF NOT EXISTS idx_business_settings_tenant_id ON public.business_settings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_id ON public.audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_usage_metrics_tenant_id ON public.usage_metrics(tenant_id);

-- Add comments for documentation
COMMENT ON POLICY "system_settings_super_admin_only" ON public.system_settings IS 'Only super admins can access system settings';
COMMENT ON POLICY "tenants_super_admin_all" ON public.tenants IS 'Super admins can manage all tenants';
COMMENT ON POLICY "tenants_tenant_admin_read_own" ON public.tenants IS 'Tenant admins can read their own tenant';
COMMENT ON POLICY "tenants_tenant_admin_update_own" ON public.tenants IS 'Tenant admins can update their own tenant';
COMMENT ON POLICY "profiles_super_admin_all" ON public.profiles IS 'Super admins can manage all profiles';
COMMENT ON POLICY "profiles_tenant_admin_tenant_users" ON public.profiles IS 'Tenant admins can manage users in their tenant';
COMMENT ON POLICY "profiles_users_own_profile" ON public.profiles IS 'Users can view their own profile';
COMMENT ON POLICY "profiles_users_update_own_profile" ON public.profiles IS 'Users can update their own profile';
COMMENT ON POLICY "business_settings_super_admin_all" ON public.business_settings IS 'Super admins can access all business settings';
COMMENT ON POLICY "business_settings_tenant_isolation" ON public.business_settings IS 'Users can only access business settings for their tenant';
COMMENT ON POLICY "reviews_super_admin_all" ON public.reviews IS 'Super admins can access all reviews';
COMMENT ON POLICY "reviews_tenant_isolation" ON public.reviews IS 'Users can only access reviews for their tenant';
COMMENT ON POLICY "reviews_anonymous_insert" ON public.reviews IS 'Anonymous users can insert reviews for public forms';
COMMENT ON POLICY "audit_logs_super_admin_all" ON public.audit_logs IS 'Super admins can access all audit logs';
COMMENT ON POLICY "audit_logs_tenant_read" ON public.audit_logs IS 'Users can read audit logs for their tenant';
COMMENT ON POLICY "audit_logs_tenant_insert" ON public.audit_logs IS 'Users can insert audit logs for their tenant';
COMMENT ON POLICY "usage_metrics_super_admin_all" ON public.usage_metrics IS 'Super admins can access all usage metrics';
COMMENT ON POLICY "usage_metrics_tenant_read" ON public.usage_metrics IS 'Users can read usage metrics for their tenant';
COMMENT ON POLICY "usage_metrics_tenant_insert" ON public.usage_metrics IS 'Users can insert usage metrics for their tenant';
