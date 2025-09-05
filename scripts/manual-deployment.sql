-- Manual Database Deployment
-- Run these SQL commands one by one in Supabase SQL Editor

-- Step 1: Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Step 2: Create tenants table
CREATE TABLE public.tenants (
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

-- Step 3: Create user_invitations table
CREATE TABLE public.user_invitations (
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

-- Step 4: Create audit_logs table
CREATE TABLE public.audit_logs (
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

-- Step 5: Create usage_metrics table
CREATE TABLE public.usage_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  metric_type VARCHAR(50) NOT NULL,
  metric_value NUMERIC NOT NULL,
  metadata JSONB DEFAULT '{}',
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 6: Create system_settings table
CREATE TABLE public.system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(100) UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 7: Add tenant_id to existing tables
ALTER TABLE public.profiles ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE public.business_settings ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE public.reviews ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

-- Step 8: Enable Row Level Security
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Step 9: Create core functions
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

-- Step 10: Create RLS policies (run these one by one)
CREATE POLICY "Super admins can view all tenants" ON public.tenants
  FOR SELECT TO authenticated USING (is_super_admin());

CREATE POLICY "Super admins can create tenants" ON public.tenants
  FOR INSERT TO authenticated WITH CHECK (is_super_admin());

-- Continue with remaining policies...
