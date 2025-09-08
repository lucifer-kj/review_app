-- Script to promote current user to super_admin
-- This will allow the user to create tenants

-- First, get the current user's ID from auth.users
-- Then insert or update their profile with super_admin role

-- Insert or update the user profile with super_admin role
-- Note: Replace 'CURRENT_USER_ID' with the actual user ID from auth.users
INSERT INTO public.profiles (id, role, tenant_id, created_at, updated_at)
VALUES (
  auth.uid(),
  'super_admin',
  NULL, -- super_admin doesn't belong to a specific tenant
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET 
  role = 'super_admin',
  tenant_id = NULL,
  updated_at = NOW();

-- Verify the user was promoted
SELECT 
  id,
  role,
  tenant_id,
  created_at,
  updated_at
FROM public.profiles 
WHERE id = auth.uid();

-- Check if the user exists in auth.users
SELECT 
  id,
  email,
  created_at,
  email_confirmed_at
FROM auth.users 
WHERE id = auth.uid();
