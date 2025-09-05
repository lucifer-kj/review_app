-- Safe script to fix super admin role constraint issue
-- This handles existing data that might violate the new constraint

-- Step 1: Check what roles currently exist in the profiles table
SELECT DISTINCT role, COUNT(*) as count
FROM public.profiles 
GROUP BY role
ORDER BY role;

-- Step 2: Check the current constraint
SELECT conname, consrc 
FROM pg_constraint 
WHERE conrelid = 'public.profiles'::regclass 
AND contype = 'c';

-- Step 3: Update any invalid roles to 'user' (safest default)
-- Replace any roles that aren't 'super_admin', 'tenant_admin', or 'user' with 'user'
UPDATE public.profiles 
SET role = 'user'
WHERE role NOT IN ('super_admin', 'tenant_admin', 'user');

-- Step 4: Drop the existing constraint
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Step 5: Add the new constraint that includes super_admin
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('super_admin', 'tenant_admin', 'user'));

-- Step 6: Now insert/update the super admin user
INSERT INTO public.profiles (
    id,
    role,
    created_at,
    updated_at
)
VALUES (
    'edd7c8bc-f167-43b0-8ef0-53120b5cd444',
    'super_admin',
    NOW(),
    NOW()
)
ON CONFLICT (id) DO UPDATE SET
    role = 'super_admin',
    updated_at = NOW();

-- Step 7: Verify the operation was successful
SELECT 
    id,
    role,
    created_at,
    updated_at
FROM public.profiles 
WHERE id = 'edd7c8bc-f167-43b0-8ef0-53120b5cd444';

-- Step 8: Test the is_super_admin function
SELECT is_super_admin('edd7c8bc-f167-43b0-8ef0-53120b5cd444') as is_super_admin;

-- Step 9: Show all super admins in the system
SELECT 
    p.id,
    p.role,
    p.created_at,
    p.updated_at,
    au.email
FROM public.profiles p
LEFT JOIN auth.users au ON au.id = p.id
WHERE p.role = 'super_admin'
ORDER BY p.created_at DESC;
