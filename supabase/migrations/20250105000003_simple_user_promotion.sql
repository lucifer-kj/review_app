-- Simple user promotion without changing the entire role system
-- This is the safest approach - just promote the specific user

-- First, let's see what the current constraint allows
SELECT DISTINCT role, COUNT(*) as count FROM public.profiles GROUP BY role;

-- Temporarily drop the constraint to allow any role
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Promote the specific user to super_admin
INSERT INTO public.profiles (id, role, created_at, updated_at)
VALUES (
  'edd7c8bc-f167-43b0-8ef0-53120b5cd444',
  'super_admin',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET 
  role = 'super_admin',
  updated_at = NOW();

-- Add the constraint back with the new role system
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('super_admin', 'tenant_admin', 'user', 'admin', 'staff'));

-- Verify the promotion worked
SELECT id, role, created_at, updated_at 
FROM public.profiles 
WHERE id = 'edd7c8bc-f167-43b0-8ef0-53120b5cd444';

-- Check all current roles
SELECT DISTINCT role, COUNT(*) as count FROM public.profiles GROUP BY role;
