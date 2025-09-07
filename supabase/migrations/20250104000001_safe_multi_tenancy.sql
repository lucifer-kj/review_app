-- Safe Multi-Tenancy Implementation Migration
-- This migration adds multi-tenant support without breaking existing data
-- Date: 2025-01-04

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Step 1: Create tenants table (foundation of multi-tenancy)
CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  domain VARCHAR(255) UNIQUE,
  plan_type VARCHAR(50) DEFAULT 'basic' CHECK (plan_type IN ('basic', 'pro', 'enterprise')),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'pending', 'cancelled')),
  settings JSONB DEFAULT '{}',
  billing_email VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Step 2: Create user_invitations table for invite-only authentication
CREATE TABLE IF NOT EXISTS public.user_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('super_admin', 'tenant_admin', 'user')),
  invited_by UUID REFERENCES auth.users(id),
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Create audit_logs table for compliance and security
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50),
  resource_id UUID,
  details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 4: Create usage_metrics table for billing and analytics
CREATE TABLE IF NOT EXISTS public.usage_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  metric_type VARCHAR(50) NOT NULL,
  metric_value NUMERIC NOT NULL,
  metadata JSONB DEFAULT '{}',
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 5: Create system_settings table for global configuration
CREATE TABLE IF NOT EXISTS public.system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(100) UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 6: Add tenant_id columns to existing tables (SAFE - with defaults)
-- Add tenant_id to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

-- Add tenant_id to business_settings table  
ALTER TABLE public.business_settings ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

-- Add tenant_id to reviews table
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

-- Step 7: Enable Row Level Security on new tables
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Step 8: Create function to update timestamps (if not exists)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 9: Create triggers for automatic timestamp updates (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_tenants_updated_at') THEN
    CREATE TRIGGER update_tenants_updated_at
      BEFORE UPDATE ON public.tenants
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_system_settings_updated_at') THEN
    CREATE TRIGGER update_system_settings_updated_at
      BEFORE UPDATE ON public.system_settings
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- Step 10: Create multi-tenancy functions
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
CREATE OR REPLACE FUNCTION public.is_super_admin(user_id UUID DEFAULT NULL)
RETURNS BOOLEAN AS $$
BEGIN
  IF user_id IS NULL THEN
    user_id := auth.uid();
  END IF;
  
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_id AND role = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is tenant admin
CREATE OR REPLACE FUNCTION public.is_tenant_admin(user_id UUID DEFAULT NULL, p_tenant_id UUID DEFAULT NULL)
RETURNS BOOLEAN AS $$
BEGIN
  IF user_id IS NULL THEN
    user_id := auth.uid();
  END IF;
  
  IF p_tenant_id IS NULL THEN
    p_tenant_id := get_current_tenant_id();
  END IF;
  
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_id 
    AND tenant_id = p_tenant_id 
    AND role IN ('super_admin', 'tenant_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create tenant with admin
CREATE OR REPLACE FUNCTION public.create_tenant_with_admin(
  tenant_data JSONB,
  admin_email TEXT
)
RETURNS UUID AS $$
DECLARE
  new_tenant_id UUID;
  admin_user_id UUID;
BEGIN
  -- Check if caller is super admin
  IF NOT is_super_admin() THEN
    RAISE EXCEPTION 'Only super admins can create tenants';
  END IF;
  
  -- Create tenant
  INSERT INTO public.tenants (
    name,
    domain,
    plan_type,
    status,
    settings,
    billing_email,
    created_by
  ) VALUES (
    tenant_data->>'name',
    tenant_data->>'domain',
    COALESCE(tenant_data->>'plan_type', 'basic'),
    'active',
    COALESCE(tenant_data->'settings', '{}'),
    admin_email,
    auth.uid()
  ) RETURNING id INTO new_tenant_id;
  
  -- Create invitation for admin
  INSERT INTO public.user_invitations (
    tenant_id,
    email,
    role,
    invited_by,
    token,
    expires_at
  ) VALUES (
    new_tenant_id,
    admin_email,
    'tenant_admin',
    auth.uid(),
    gen_random_uuid()::text,
    NOW() + INTERVAL '7 days'
  );
  
  -- Log the action
  INSERT INTO public.audit_logs (
    tenant_id,
    user_id,
    action,
    resource_type,
    resource_id,
    details
  ) VALUES (
    new_tenant_id,
    auth.uid(),
    'tenant_created',
    'tenant',
    new_tenant_id,
    jsonb_build_object('admin_email', admin_email, 'tenant_data', tenant_data)
  );
  
  RETURN new_tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 11: Create dashboard functions (fix missing functions)
-- Function to get all reviews for dashboard
CREATE OR REPLACE FUNCTION public.get_all_reviews_for_dashboard(p_tenant_id UUID DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  name TEXT,
  phone TEXT,
  country_code TEXT,
  rating INTEGER,
  feedback TEXT,
  google_review BOOLEAN,
  redirect_opened BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB
) AS $$
BEGIN
  -- Use provided tenant_id or current user's tenant
  IF p_tenant_id IS NULL THEN
    p_tenant_id := get_current_tenant_id();
  END IF;
  
  -- Check tenant access (allow if no tenant context for backward compatibility)
  IF p_tenant_id IS NOT NULL AND NOT is_tenant_admin(auth.uid(), p_tenant_id) THEN
    RAISE EXCEPTION 'Access denied to tenant data';
  END IF;
  
  RETURN QUERY
  SELECT 
    r.id,
    r.name,
    r.phone,
    r.country_code,
    r.rating,
    r.feedback,
    r.google_review,
    r.redirect_opened,
    r.created_at,
    r.metadata
  FROM public.reviews r
  WHERE (p_tenant_id IS NULL OR r.tenant_id = p_tenant_id)
  ORDER BY r.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get review stats for dashboard
CREATE OR REPLACE FUNCTION public.get_review_stats_for_dashboard(p_tenant_id UUID DEFAULT NULL)
RETURNS TABLE (
  total_reviews BIGINT,
  average_rating NUMERIC,
  high_rating_reviews BIGINT
) AS $$
BEGIN
  -- Use provided tenant_id or current user's tenant
  IF p_tenant_id IS NULL THEN
    p_tenant_id := get_current_tenant_id();
  END IF;
  
  -- Check tenant access (allow if no tenant context for backward compatibility)
  IF p_tenant_id IS NOT NULL AND NOT is_tenant_admin(auth.uid(), p_tenant_id) THEN
    RAISE EXCEPTION 'Access denied to tenant data';
  END IF;
  
  RETURN QUERY
  SELECT 
    COUNT(*) as total_reviews,
    COALESCE(AVG(r.rating), 0) as average_rating,
    COUNT(CASE WHEN r.rating >= 4 THEN 1 END) as high_rating_reviews
  FROM public.reviews r
  WHERE (p_tenant_id IS NULL OR r.tenant_id = p_tenant_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get platform analytics (for master dashboard)
CREATE OR REPLACE FUNCTION public.get_platform_analytics()
RETURNS TABLE (
  total_tenants BIGINT,
  total_users BIGINT,
  total_reviews BIGINT,
  active_tenants BIGINT,
  revenue_current_month NUMERIC,
  growth_rate NUMERIC
) AS $$
BEGIN
  -- Check if caller is super admin
  IF NOT is_super_admin() THEN
    RAISE EXCEPTION 'Only super admins can access platform analytics';
  END IF;
  
  RETURN QUERY
  SELECT 
    COUNT(DISTINCT t.id) as total_tenants,
    COUNT(DISTINCT p.id) as total_users,
    COUNT(DISTINCT r.id) as total_reviews,
    COUNT(DISTINCT CASE WHEN t.status = 'active' THEN t.id END) as active_tenants,
    COALESCE(SUM(um.metric_value), 0) as revenue_current_month,
    0 as growth_rate -- TODO: Implement growth rate calculation
  FROM public.tenants t
  LEFT JOIN public.profiles p ON p.tenant_id = t.id
  LEFT JOIN public.reviews r ON r.tenant_id = t.id
  LEFT JOIN public.usage_metrics um ON um.tenant_id = t.id 
    AND um.metric_type = 'revenue'
    AND um.recorded_at >= date_trunc('month', CURRENT_DATE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 12: Create RLS Policies for new tables
-- RLS Policies for tenants table
DROP POLICY IF EXISTS "Super admins can view all tenants" ON public.tenants;
CREATE POLICY "Super admins can view all tenants" ON public.tenants
  FOR SELECT TO authenticated USING (is_super_admin());

DROP POLICY IF EXISTS "Super admins can create tenants" ON public.tenants;
CREATE POLICY "Super admins can create tenants" ON public.tenants
  FOR INSERT TO authenticated WITH CHECK (is_super_admin());

DROP POLICY IF EXISTS "Super admins can update tenants" ON public.tenants;
CREATE POLICY "Super admins can update tenants" ON public.tenants
  FOR UPDATE TO authenticated USING (is_super_admin());

DROP POLICY IF EXISTS "Super admins can delete tenants" ON public.tenants;
CREATE POLICY "Super admins can delete tenants" ON public.tenants
  FOR DELETE TO authenticated USING (is_super_admin());

-- RLS Policies for user_invitations table
DROP POLICY IF EXISTS "Tenant admins can view tenant invitations" ON public.user_invitations;
CREATE POLICY "Tenant admins can view tenant invitations" ON public.user_invitations
  FOR SELECT TO authenticated USING (
    tenant_id = get_current_tenant_id() AND is_tenant_admin()
  );

DROP POLICY IF EXISTS "Tenant admins can create invitations" ON public.user_invitations;
CREATE POLICY "Tenant admins can create invitations" ON public.user_invitations
  FOR INSERT TO authenticated WITH CHECK (
    tenant_id = get_current_tenant_id() AND is_tenant_admin()
  );

DROP POLICY IF EXISTS "Super admins can view all invitations" ON public.user_invitations;
CREATE POLICY "Super admins can view all invitations" ON public.user_invitations
  FOR SELECT TO authenticated USING (is_super_admin());

-- RLS Policies for audit_logs table
DROP POLICY IF EXISTS "Users can view their tenant audit logs" ON public.audit_logs;
CREATE POLICY "Users can view their tenant audit logs" ON public.audit_logs
  FOR SELECT TO authenticated USING (
    tenant_id = get_current_tenant_id() AND is_tenant_admin()
  );

DROP POLICY IF EXISTS "Super admins can view all audit logs" ON public.audit_logs;
CREATE POLICY "Super admins can view all audit logs" ON public.audit_logs
  FOR SELECT TO authenticated USING (is_super_admin());

DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;
CREATE POLICY "System can insert audit logs" ON public.audit_logs
  FOR INSERT WITH CHECK (true);

-- RLS Policies for usage_metrics table
DROP POLICY IF EXISTS "Tenant admins can view tenant metrics" ON public.usage_metrics;
CREATE POLICY "Tenant admins can view tenant metrics" ON public.usage_metrics
  FOR SELECT TO authenticated USING (
    tenant_id = get_current_tenant_id() AND is_tenant_admin()
  );

DROP POLICY IF EXISTS "Super admins can view all metrics" ON public.usage_metrics;
CREATE POLICY "Super admins can view all metrics" ON public.usage_metrics
  FOR SELECT TO authenticated USING (is_super_admin());

DROP POLICY IF EXISTS "System can insert metrics" ON public.usage_metrics;
CREATE POLICY "System can insert metrics" ON public.usage_metrics
  FOR INSERT WITH CHECK (true);

-- RLS Policies for system_settings table
DROP POLICY IF EXISTS "Super admins can manage system settings" ON public.system_settings;
CREATE POLICY "Super admins can manage system settings" ON public.system_settings
  FOR ALL TO authenticated USING (is_super_admin());

-- Step 13: Update existing RLS policies to include tenant isolation (SAFE)
-- Update profiles policies (add tenant admin access)
DROP POLICY IF EXISTS "Tenant admins can view tenant profiles" ON public.profiles;
CREATE POLICY "Tenant admins can view tenant profiles" ON public.profiles
  FOR SELECT TO authenticated USING (
    tenant_id = get_current_tenant_id() AND is_tenant_admin()
  );

-- Update business_settings policies (add tenant filtering)
DROP POLICY IF EXISTS "Users can view their own business settings" ON public.business_settings;
CREATE POLICY "Users can view their own business settings" ON public.business_settings
  FOR SELECT TO authenticated USING (
    user_id = auth.uid() AND (tenant_id = get_current_tenant_id() OR tenant_id IS NULL)
  );

DROP POLICY IF EXISTS "Users can insert their own business settings" ON public.business_settings;
CREATE POLICY "Users can insert their own business settings" ON public.business_settings
  FOR INSERT TO authenticated WITH CHECK (
    user_id = auth.uid() AND (tenant_id = get_current_tenant_id() OR tenant_id IS NULL)
  );

DROP POLICY IF EXISTS "Users can update their own business settings" ON public.business_settings;
CREATE POLICY "Users can update their own business settings" ON public.business_settings
  FOR UPDATE TO authenticated USING (
    user_id = auth.uid() AND (tenant_id = get_current_tenant_id() OR tenant_id IS NULL)
  );

DROP POLICY IF EXISTS "Users can delete their own business settings" ON public.business_settings;
CREATE POLICY "Users can delete their own business settings" ON public.business_settings
  FOR DELETE TO authenticated USING (
    user_id = auth.uid() AND (tenant_id = get_current_tenant_id() OR tenant_id IS NULL)
  );

-- Update reviews policies (add tenant filtering)
DROP POLICY IF EXISTS "Users can view their tenant reviews" ON public.reviews;
CREATE POLICY "Users can view their tenant reviews" ON public.reviews
  FOR SELECT TO authenticated USING (
    (tenant_id = get_current_tenant_id() AND is_tenant_admin()) OR tenant_id IS NULL
  );

DROP POLICY IF EXISTS "Users can update their own reviews" ON public.reviews;
CREATE POLICY "Users can update their own reviews" ON public.reviews
  FOR UPDATE TO authenticated USING (
    user_id = auth.uid() AND (tenant_id = get_current_tenant_id() OR tenant_id IS NULL)
  );

DROP POLICY IF EXISTS "Users can delete their own reviews" ON public.reviews;
CREATE POLICY "Users can delete their own reviews" ON public.reviews
  FOR DELETE TO authenticated USING (
    user_id = auth.uid() AND (tenant_id = get_current_tenant_id() OR tenant_id IS NULL)
  );

-- Step 14: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tenants_status ON public.tenants(status);
CREATE INDEX IF NOT EXISTS idx_tenants_domain ON public.tenants(domain);
CREATE INDEX IF NOT EXISTS idx_profiles_tenant_id ON public.profiles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_business_settings_tenant_id ON public.business_settings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_reviews_tenant_id ON public.reviews(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_invitations_tenant_id ON public.user_invitations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_invitations_email ON public.user_invitations(email);
CREATE INDEX IF NOT EXISTS idx_user_invitations_token ON public.user_invitations(token);
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_id ON public.audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_usage_metrics_tenant_id ON public.usage_metrics(tenant_id);
CREATE INDEX IF NOT EXISTS idx_usage_metrics_type ON public.usage_metrics(metric_type);

-- Step 15: Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.tenants TO anon, authenticated;
GRANT ALL ON public.user_invitations TO anon, authenticated;
GRANT ALL ON public.audit_logs TO anon, authenticated;
GRANT ALL ON public.usage_metrics TO anon, authenticated;
GRANT ALL ON public.system_settings TO anon, authenticated;

GRANT EXECUTE ON FUNCTION public.get_current_tenant_id() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_super_admin(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_tenant_admin(uuid, uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_tenant_with_admin(jsonb, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_reviews_for_dashboard(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_review_stats_for_dashboard(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_platform_analytics() TO anon, authenticated;

-- Step 16: Create default tenant for existing data (SAFE)
-- This creates a default tenant and assigns existing data to it
DO $$
DECLARE
  default_tenant_id UUID;
BEGIN
  -- Only create default tenant if no tenants exist
  IF NOT EXISTS (SELECT 1 FROM public.tenants LIMIT 1) THEN
    -- Create default tenant
    INSERT INTO public.tenants (
      name,
      domain,
      plan_type,
      status,
      settings,
      billing_email
    ) VALUES (
      'Default Tenant',
      'default',
      'basic',
      'active',
      '{}',
      'admin@crux-reviews.com'
    ) RETURNING id INTO default_tenant_id;
    
    -- Update existing profiles to belong to default tenant
    UPDATE public.profiles 
    SET tenant_id = default_tenant_id 
    WHERE tenant_id IS NULL;
    
    -- Update existing business_settings to belong to default tenant
    UPDATE public.business_settings 
    SET tenant_id = default_tenant_id 
    WHERE tenant_id IS NULL;
    
    -- Update existing reviews to belong to default tenant
    UPDATE public.reviews 
    SET tenant_id = default_tenant_id 
    WHERE tenant_id IS NULL;
    
    -- Log the migration
    INSERT INTO public.audit_logs (
      tenant_id,
      action,
      resource_type,
      details
    ) VALUES (
      default_tenant_id,
      'migration_completed',
      'system',
      jsonb_build_object('migration', 'multi_tenancy', 'default_tenant_created', true)
    );
  END IF;
END $$;
