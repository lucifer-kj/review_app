-- Update profiles table to support multi-tenancy
-- This migration adds the missing columns for user management

-- Add missing columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id),
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}';

-- Update the role constraint to include multi-tenant roles
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('super_admin', 'tenant_admin', 'user', 'admin', 'staff'));

-- Create index for tenant_id for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_tenant_id ON public.profiles(tenant_id);

-- Create index for email for better search performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Update RLS policies for multi-tenancy
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Create new RLS policies for multi-tenancy
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Allow super admins to view all profiles
CREATE POLICY "Super admins can view all profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() 
      AND p.role = 'super_admin'
    )
  );

-- Allow super admins to update all profiles
CREATE POLICY "Super admins can update all profiles" ON public.profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() 
      AND p.role = 'super_admin'
    )
  );

-- Allow tenant admins to view profiles in their tenant
CREATE POLICY "Tenant admins can view tenant profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() 
      AND p.role = 'tenant_admin'
      AND p.tenant_id = profiles.tenant_id
    )
  );

-- Allow tenant admins to update profiles in their tenant
CREATE POLICY "Tenant admins can update tenant profiles" ON public.profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() 
      AND p.role = 'tenant_admin'
      AND p.tenant_id = profiles.tenant_id
    )
  );

-- Create function to get current tenant ID
CREATE OR REPLACE FUNCTION get_current_tenant_id()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT tenant_id 
    FROM public.profiles 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if user is super admin
CREATE OR REPLACE FUNCTION is_super_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT role = 'super_admin' 
    FROM public.profiles 
    WHERE id = user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if user is tenant admin
CREATE OR REPLACE FUNCTION is_tenant_admin(user_id UUID DEFAULT auth.uid(), tenant_id UUID DEFAULT get_current_tenant_id())
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
