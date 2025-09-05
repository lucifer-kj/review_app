-- SQL Schema to make user a super admin
-- User UID: edd7c8bc-f167-43b0-8ef0-53120b5cd444

-- First, ensure the user exists in the profiles table
-- If the user doesn't exist, create a profile entry
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

-- Verify the update was successful
SELECT 
    id,
    role,
    created_at,
    updated_at
FROM public.profiles 
WHERE id = 'edd7c8bc-f167-43b0-8ef0-53120b5cd444';

-- Optional: If you want to ensure the user has access to all tenants
-- (This is typically handled by the is_super_admin() function, but you can also add explicit tenant access)
-- Note: Super admins typically don't need explicit tenant_id assignments as they have global access

-- Check if the user exists in auth.users table
SELECT 
    id,
    email,
    created_at,
    last_sign_in_at
FROM auth.users 
WHERE id = 'edd7c8bc-f167-43b0-8ef0-53120b5cd444';

-- Optional: Create an audit log entry for this administrative action
INSERT INTO public.audit_logs (
    user_id,
    action,
    resource_type,
    resource_id,
    details,
    created_at
)
VALUES (
    'edd7c8bc-f167-43b0-8ef0-53120b5cd444',
    'role_assigned',
    'user_profile',
    'edd7c8bc-f167-43b0-8ef0-53120b5cd444',
    '{"role": "super_admin", "assigned_by": "system", "reason": "manual_admin_assignment"}',
    NOW()
);

-- Final verification: Test the is_super_admin function
SELECT is_super_admin('edd7c8bc-f167-43b0-8ef0-53120b5cd444') as is_super_admin;

-- Show all super admins in the system
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
