-- Safe role update migration
-- This handles any unexpected role values gracefully

-- First, let's see what roles exist in the table
-- (This is just for reference, you can run this separately to check)
-- SELECT DISTINCT role FROM public.profiles;

-- Update existing data to match new role system
-- Handle all possible existing roles
UPDATE public.profiles 
SET role = 'super_admin' 
WHERE role = 'admin';

UPDATE public.profiles 
SET role = 'user' 
WHERE role = 'staff';

-- Handle any other unexpected roles by defaulting them to 'user'
UPDATE public.profiles 
SET role = 'user' 
WHERE role NOT IN ('super_admin', 'tenant_admin', 'user');

-- Now safely update the constraint
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('super_admin', 'tenant_admin', 'user'));

-- Add tenant_id column for multi-tenancy support
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS tenant_id UUID;

-- Add created_by column for audit trail
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- Promote specific user to super_admin
INSERT INTO public.profiles (id, role, tenant_id, created_at, updated_at)
VALUES (
  'edd7c8bc-f167-43b0-8ef0-53120b5cd444',
  'super_admin',
  NULL, -- super_admin doesn't belong to a specific tenant
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET 
  role = 'super_admin',
  tenant_id = NULL,
  updated_at = NOW();

-- Create function to check if user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_id AND role = 'super_admin'
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Create function to check if user is tenant admin
CREATE OR REPLACE FUNCTION public.is_tenant_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_id AND role = 'tenant_admin'
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Create function to check if user is manager (super_admin or tenant_admin)
CREATE OR REPLACE FUNCTION public.is_manager(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_id AND role IN ('super_admin', 'tenant_admin')
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Update RLS policies to use new role system
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Create new RLS policies for profiles
CREATE POLICY "Users can view their own profile or managers can view all"
ON public.profiles
FOR SELECT
TO authenticated
USING (id = auth.uid() OR public.is_manager());

CREATE POLICY "Users can update their own profile or managers can update all"
ON public.profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid() OR public.is_manager());

-- Create policy for super admins to insert profiles
CREATE POLICY "Super admins can insert profiles"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (public.is_super_admin());

-- Create policy for super admins to delete profiles
CREATE POLICY "Super admins can delete profiles"
ON public.profiles
FOR DELETE
TO authenticated
USING (public.is_super_admin());

-- Update the is_admin function to use new role system
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_id AND role IN ('super_admin', 'tenant_admin')
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Add comment for documentation
COMMENT ON TABLE public.profiles IS 'User profiles with multi-tenant role hierarchy: super_admin, tenant_admin, user';
COMMENT ON COLUMN public.profiles.role IS 'User role: super_admin (platform admin), tenant_admin (tenant admin), user (regular user)';
COMMENT ON COLUMN public.profiles.tenant_id IS 'Tenant ID for multi-tenancy (NULL for super_admin)';
