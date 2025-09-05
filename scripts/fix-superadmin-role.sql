-- Fix super admin role constraint issue
-- This script will check the current constraint and update it to allow super_admin role

-- First, let's check what the current constraint looks like
SELECT conname, consrc 
FROM pg_constraint 
WHERE conrelid = 'public.profiles'::regclass 
AND contype = 'c';

-- Alternative way to check constraints
SELECT 
    tc.constraint_name, 
    tc.check_clause
FROM information_schema.check_constraints tc
WHERE tc.constraint_schema = 'public' 
AND tc.constraint_name LIKE '%role%';

-- Check the current enum values if roles are stored as enum
SELECT enumlabel 
FROM pg_enum 
WHERE enumtypid = (
    SELECT oid 
    FROM pg_type 
    WHERE typname = 'user_role' 
    OR typname LIKE '%role%'
);

-- Drop the existing constraint (replace 'profiles_role_check' with actual constraint name)
-- You may need to adjust the constraint name based on what you see above
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Add a new constraint that allows super_admin role
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('super_admin', 'tenant_admin', 'user'));

-- Now try the insert again
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

-- Verify the insert was successful
SELECT 
    id,
    role,
    created_at,
    updated_at
FROM public.profiles 
WHERE id = 'edd7c8bc-f167-43b0-8ef0-53120b5cd444';

-- Test the is_super_admin function
SELECT is_super_admin('edd7c8bc-f167-43b0-8ef0-53120b5cd444') as is_super_admin;
