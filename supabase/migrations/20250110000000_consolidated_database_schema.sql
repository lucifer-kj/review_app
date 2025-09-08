-- CONSOLIDATED DATABASE SCHEMA MIGRATION
-- This migration consolidates all previous migrations into a clean, production-ready schema
-- Date: January 10, 2025
-- Purpose: Clean up conflicting migrations and establish proper multi-tenancy

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- DROP EXISTING TABLES (in reverse dependency order)
-- ============================================================================

-- Drop existing tables if they exist
DROP TABLE IF EXISTS public.usage_metrics CASCADE;
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.user_invitations CASCADE;
DROP TABLE IF EXISTS public.business_settings CASCADE;
DROP TABLE IF EXISTS public.reviews CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.tenants CASCADE;
DROP TABLE IF EXISTS public.system_settings CASCADE;

-- Drop existing functions
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_business_settings_insert() CASCADE;
DROP FUNCTION IF EXISTS public.handle_review_insert() CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS public.get_current_tenant_id() CASCADE;
DROP FUNCTION IF EXISTS public.is_super_admin(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.is_tenant_admin(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS public.create_tenant_with_admin(JSON, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.get_platform_analytics() CASCADE;
DROP FUNCTION IF EXISTS public.get_all_reviews_for_dashboard(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.get_review_stats_for_dashboard(UUID) CASCADE;

-- ============================================================================
-- CREATE CORE TABLES
-- ============================================================================

-- System settings table
CREATE TABLE public.system_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL DEFAULT '{}',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tenants table (multi-tenancy root)
CREATE TABLE public.tenants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  domain TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'pending')),
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Profiles table (user management with multi-tenancy)
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('super_admin', 'tenant_admin', 'user')),
  tenant_id UUID REFERENCES tenants(id),
  avatar_url TEXT,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User invitations table
CREATE TABLE public.user_invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('super_admin', 'tenant_admin', 'user')),
  invited_by UUID REFERENCES auth.users(id),
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Business settings table
CREATE TABLE public.business_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  business_name TEXT,
  business_email TEXT,
  business_phone TEXT,
  business_address TEXT,
  google_business_url TEXT,
  review_form_url TEXT,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reviews table
CREATE TABLE public.reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT,
  country_code TEXT DEFAULT '+1',
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  google_review BOOLEAN DEFAULT FALSE,
  redirect_opened BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit logs table
CREATE TABLE public.audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id UUID,
  details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Usage metrics table
CREATE TABLE public.usage_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  metric_type TEXT NOT NULL,
  metric_value NUMERIC NOT NULL,
  metadata JSONB DEFAULT '{}',
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

-- Tenant indexes
CREATE INDEX idx_tenants_status ON public.tenants(status);
CREATE INDEX idx_tenants_domain ON public.tenants(domain);
CREATE INDEX idx_tenants_created_at ON public.tenants(created_at);

-- Profile indexes
CREATE INDEX idx_profiles_tenant_id ON public.profiles(tenant_id);
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_profiles_email ON public.profiles(email);

-- User invitation indexes
CREATE INDEX idx_user_invitations_tenant_id ON public.user_invitations(tenant_id);
CREATE INDEX idx_user_invitations_email ON public.user_invitations(email);
CREATE INDEX idx_user_invitations_token ON public.user_invitations(token);
CREATE INDEX idx_user_invitations_expires_at ON public.user_invitations(expires_at);
CREATE INDEX idx_user_invitations_used_at ON public.user_invitations(used_at);

-- Business settings indexes
CREATE INDEX idx_business_settings_tenant_id ON public.business_settings(tenant_id);
CREATE INDEX idx_business_settings_user_id ON public.business_settings(user_id);

-- Review indexes
CREATE INDEX idx_reviews_tenant_id ON public.reviews(tenant_id);
CREATE INDEX idx_reviews_user_id ON public.reviews(user_id);
CREATE INDEX idx_reviews_rating ON public.reviews(rating);
CREATE INDEX idx_reviews_created_at ON public.reviews(created_at);
CREATE INDEX idx_reviews_google_review ON public.reviews(google_review);

-- Audit log indexes
CREATE INDEX idx_audit_logs_tenant_id ON public.audit_logs(tenant_id);
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at);

-- Usage metrics indexes
CREATE INDEX idx_usage_metrics_tenant_id ON public.usage_metrics(tenant_id);
CREATE INDEX idx_usage_metrics_type ON public.usage_metrics(metric_type);
CREATE INDEX idx_usage_metrics_recorded_at ON public.usage_metrics(recorded_at);

-- ============================================================================
-- CREATE UTILITY FUNCTIONS
-- ============================================================================

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to get current user's tenant ID
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

-- Function to check if user is super admin
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

-- Function to check if user is tenant admin
CREATE OR REPLACE FUNCTION public.is_tenant_admin(user_id UUID, tenant_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT role = 'tenant_admin' AND profiles.tenant_id = tenant_id
    FROM public.profiles 
    WHERE id = user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create tenant with admin
CREATE OR REPLACE FUNCTION public.create_tenant_with_admin(
  tenant_data JSON,
  admin_email TEXT
)
RETURNS JSON AS $$
DECLARE
  new_tenant_id UUID;
  admin_user_id UUID;
BEGIN
  -- Create tenant
  INSERT INTO public.tenants (name, domain, settings)
  VALUES (
    tenant_data->>'name',
    tenant_data->>'domain',
    COALESCE(tenant_data->'settings', '{}'::json)
  )
  RETURNING id INTO new_tenant_id;

  -- Create invitation for admin
  INSERT INTO public.user_invitations (
    tenant_id,
    email,
    role,
    token,
    expires_at
  )
  VALUES (
    new_tenant_id,
    admin_email,
    'tenant_admin',
    gen_random_uuid(),
    NOW() + INTERVAL '7 days'
  );

  RETURN json_build_object(
    'tenant_id', new_tenant_id,
    'admin_email', admin_email
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get platform analytics
CREATE OR REPLACE FUNCTION public.get_platform_analytics()
RETURNS TABLE (
  total_tenants BIGINT,
  active_tenants BIGINT,
  total_users BIGINT,
  total_reviews BIGINT,
  reviews_this_month BIGINT,
  reviews_last_month BIGINT,
  average_rating NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(DISTINCT t.id) as total_tenants,
    COUNT(DISTINCT CASE WHEN t.status = 'active' THEN t.id END) as active_tenants,
    COUNT(DISTINCT p.id) as total_users,
    COUNT(DISTINCT r.id) as total_reviews,
    COUNT(DISTINCT CASE
      WHEN r.created_at >= date_trunc('month', CURRENT_DATE)
      THEN r.id
    END) as reviews_this_month,
    COUNT(DISTINCT CASE
      WHEN r.created_at >= date_trunc('month', CURRENT_DATE - INTERVAL '1 month')
      AND r.created_at < date_trunc('month', CURRENT_DATE)
      THEN r.id
    END) as reviews_last_month,
    COALESCE(AVG(r.rating), 0) as average_rating
  FROM public.tenants t
  LEFT JOIN public.profiles p ON p.tenant_id = t.id
  LEFT JOIN public.reviews r ON r.tenant_id = t.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get all reviews for dashboard
CREATE OR REPLACE FUNCTION public.get_all_reviews_for_dashboard(p_tenant_id UUID)
RETURNS TABLE (
  id UUID,
  customer_name TEXT,
  rating INTEGER,
  review_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT r.id, r.customer_name, r.rating, r.review_text, r.created_at
  FROM public.reviews r
  WHERE r.tenant_id = p_tenant_id
  ORDER BY r.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get review stats for dashboard
CREATE OR REPLACE FUNCTION public.get_review_stats_for_dashboard(p_tenant_id UUID)
RETURNS TABLE (
  total_reviews BIGINT,
  average_rating NUMERIC,
  reviews_this_month BIGINT,
  reviews_last_month BIGINT,
  google_reviews BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(r.id) as total_reviews,
    COALESCE(AVG(r.rating), 0) as average_rating,
    COUNT(CASE
      WHEN r.created_at >= date_trunc('month', CURRENT_DATE)
      THEN r.id
    END) as reviews_this_month,
    COUNT(CASE
      WHEN r.created_at >= date_trunc('month', CURRENT_DATE - INTERVAL '1 month')
      AND r.created_at < date_trunc('month', CURRENT_DATE)
      THEN r.id
    END) as reviews_last_month,
    COUNT(CASE WHEN r.google_review = TRUE THEN r.id END) as google_reviews
  FROM public.reviews r
  WHERE r.tenant_id = p_tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- CREATE TRIGGERS
-- ============================================================================

-- Trigger to create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Try to find an invitation for this user's email
  INSERT INTO public.profiles (
    id, 
    email, 
    full_name, 
    role, 
    tenant_id,
    created_at,
    updated_at
  )
  SELECT 
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user'),
    COALESCE((NEW.raw_user_meta_data->>'tenant_id')::uuid, NULL),
    NOW(),
    NOW()
  FROM public.user_invitations ui
  WHERE ui.email = NEW.email 
    AND ui.used_at IS NULL 
    AND ui.expires_at > NOW()
  LIMIT 1;

  -- If no invitation was found, create a default profile
  IF NOT FOUND THEN
    INSERT INTO public.profiles (
      id, 
      email, 
      full_name, 
      role, 
      tenant_id,
      created_at,
      updated_at
    )
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
      'user',
      NULL,
      NOW(),
      NOW()
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_tenants_updated_at
  BEFORE UPDATE ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_business_settings_updated_at
  BEFORE UPDATE ON public.business_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_system_settings_updated_at
  BEFORE UPDATE ON public.system_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_metrics ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- CREATE RLS POLICIES
-- ============================================================================

-- System settings policies (super admin only)
CREATE POLICY "super_admin_system_settings" ON public.system_settings
  FOR ALL USING (public.is_super_admin(auth.uid()));

-- Tenant policies
CREATE POLICY "super_admin_tenants" ON public.tenants
  FOR ALL USING (public.is_super_admin(auth.uid()));

CREATE POLICY "tenant_admin_own_tenant" ON public.tenants
  FOR SELECT USING (
    public.is_tenant_admin(auth.uid(), id)
  );

CREATE POLICY "tenant_admin_update_own_tenant" ON public.tenants
  FOR UPDATE USING (
    public.is_tenant_admin(auth.uid(), id)
  );

-- Profile policies
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

-- User invitation policies
CREATE POLICY "super_admin_invitations" ON public.user_invitations
  FOR ALL USING (public.is_super_admin(auth.uid()));

CREATE POLICY "tenant_admin_invitations" ON public.user_invitations
  FOR ALL USING (
    tenant_id = public.get_current_tenant_id() AND
    public.is_tenant_admin(auth.uid(), tenant_id)
  );

-- Business settings policies
CREATE POLICY "super_admin_business_settings" ON public.business_settings
  FOR ALL USING (public.is_super_admin(auth.uid()));

CREATE POLICY "tenant_business_settings" ON public.business_settings
  FOR ALL USING (
    tenant_id = public.get_current_tenant_id()
  );

-- Review policies
CREATE POLICY "super_admin_reviews" ON public.reviews
  FOR ALL USING (public.is_super_admin(auth.uid()));

CREATE POLICY "tenant_reviews" ON public.reviews
  FOR ALL USING (
    tenant_id = public.get_current_tenant_id()
  );

-- Allow anonymous users to insert reviews
CREATE POLICY "anonymous_review_insert" ON public.reviews
  FOR INSERT WITH CHECK (true);

-- Audit log policies
CREATE POLICY "super_admin_audit_logs" ON public.audit_logs
  FOR ALL USING (public.is_super_admin(auth.uid()));

CREATE POLICY "tenant_audit_logs" ON public.audit_logs
  FOR SELECT USING (
    tenant_id = public.get_current_tenant_id()
  );

-- Usage metrics policies
CREATE POLICY "super_admin_usage_metrics" ON public.usage_metrics
  FOR ALL USING (public.is_super_admin(auth.uid()));

CREATE POLICY "tenant_usage_metrics" ON public.usage_metrics
  FOR SELECT USING (
    tenant_id = public.get_current_tenant_id()
  );

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_updated_at_column() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_tenant_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_super_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_tenant_admin(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_tenant_with_admin(JSON, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_platform_analytics() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_reviews_for_dashboard(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_review_stats_for_dashboard(UUID) TO authenticated;

-- Grant table permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.system_settings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tenants TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_invitations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.business_settings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reviews TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.audit_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.usage_metrics TO authenticated;

-- Grant anonymous access for review insertion
GRANT INSERT ON public.reviews TO anon;

-- ============================================================================
-- INSERT DEFAULT DATA
-- ============================================================================

-- Insert default system settings
INSERT INTO public.system_settings (key, value, description) VALUES
('app_name', '"Crux"', 'Application name'),
('support_email', '"support@alphabusinessdigital.com"', 'Support email address'),
('max_reviews_per_tenant', '10000', 'Maximum reviews per tenant'),
('invitation_expiry_days', '7', 'Invitation expiry in days'),
('enable_analytics', 'true', 'Enable analytics tracking'),
('enable_audit_logs', 'true', 'Enable audit logging');

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE public.tenants IS 'Multi-tenant root table for tenant isolation';
COMMENT ON TABLE public.profiles IS 'User profiles with tenant association and role-based access';
COMMENT ON TABLE public.user_invitations IS 'Invitation system for invite-only authentication';
COMMENT ON TABLE public.business_settings IS 'Business configuration per tenant';
COMMENT ON TABLE public.reviews IS 'Customer reviews with tenant isolation';
COMMENT ON TABLE public.audit_logs IS 'Audit trail for compliance and security';
COMMENT ON TABLE public.usage_metrics IS 'Usage tracking and analytics per tenant';
COMMENT ON TABLE public.system_settings IS 'Global system configuration';

COMMENT ON FUNCTION public.handle_new_user() IS 'Creates user profile on signup with proper tenant assignment';
COMMENT ON FUNCTION public.get_current_tenant_id() IS 'Returns current user tenant ID for RLS policies';
COMMENT ON FUNCTION public.is_super_admin(UUID) IS 'Checks if user has super admin role';
COMMENT ON FUNCTION public.is_tenant_admin(UUID, UUID) IS 'Checks if user is admin of specific tenant';
COMMENT ON FUNCTION public.create_tenant_with_admin(JSON, TEXT) IS 'Creates tenant with admin invitation';
COMMENT ON FUNCTION public.get_platform_analytics() IS 'Returns platform-wide analytics for super admin';
COMMENT ON FUNCTION public.get_all_reviews_for_dashboard(UUID) IS 'Returns all reviews for tenant dashboard';
COMMENT ON FUNCTION public.get_review_stats_for_dashboard(UUID) IS 'Returns review statistics for tenant dashboard';
