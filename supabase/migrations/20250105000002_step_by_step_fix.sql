-- Step-by-step fix for role constraint issue
-- Run these commands one by one in Supabase SQL Editor

-- Step 1: First, let's see what roles exist in the table
SELECT DISTINCT role, COUNT(*) as count FROM public.profiles GROUP BY role;

-- Step 2: Drop the constraint temporarily
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Step 3: Update existing data to match new role system
UPDATE public.profiles SET role = 'super_admin' WHERE role = 'admin';
UPDATE public.profiles SET role = 'user' WHERE role = 'staff';

-- Step 4: Handle any other unexpected roles by defaulting them to 'user'
UPDATE public.profiles SET role = 'user' WHERE role NOT IN ('super_admin', 'tenant_admin', 'user');

-- Step 5: Verify all roles are now valid
SELECT DISTINCT role, COUNT(*) as count FROM public.profiles GROUP BY role;

-- Step 6: Now add the constraint back
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('super_admin', 'tenant_admin', 'user'));

-- Step 7: Add new columns
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- Step 8: Promote specific user to super_admin
INSERT INTO public.profiles (id, role, tenant_id, created_at, updated_at)
VALUES (
  'edd7c8bc-f167-43b0-8ef0-53120b5cd444',
  'super_admin',
  NULL,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET 
  role = 'super_admin',
  tenant_id = NULL,
  updated_at = NOW();

-- Step 9: Create helper functions
CREATE OR REPLACE FUNCTION public.is_super_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_id AND role = 'super_admin'
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_tenant_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_id AND role = 'tenant_admin'
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_manager(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_id AND role IN ('super_admin', 'tenant_admin')
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_id AND role IN ('super_admin', 'tenant_admin')
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Step 10: Update RLS policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

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

CREATE POLICY "Super admins can insert profiles"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (public.is_super_admin());

CREATE POLICY "Super admins can delete profiles"
ON public.profiles
FOR DELETE
TO authenticated
USING (public.is_super_admin());

-- Step 11: Verify the promotion worked
SELECT id, role, tenant_id, created_at, updated_at 
FROM public.profiles 
WHERE id = 'edd7c8bc-f167-43b0-8ef0-53120b5cd444';
