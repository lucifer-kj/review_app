-- Script to promote user to super_admin
-- Run this in Supabase SQL Editor if the migration doesn't work

-- First, ensure the user exists in auth.users
-- (This should already exist if they can log in)

-- Insert or update the user profile with super_admin role
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

-- Verify the user was promoted
SELECT 
  id,
  role,
  tenant_id,
  created_at,
  updated_at
FROM public.profiles 
WHERE id = 'edd7c8bc-f167-43b0-8ef0-53120b5cd444';

-- Check if the user exists in auth.users
SELECT 
  id,
  email,
  created_at,
  email_confirmed_at
FROM auth.users 
WHERE id = 'edd7c8bc-f167-43b0-8ef0-53120b5cd444';
