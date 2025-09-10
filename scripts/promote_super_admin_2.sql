-- ============================================================================
-- PROMOTE USER TO SUPER ADMIN - SCRIPT 2
-- Email: service@alphabusinessdesigns.com
-- UID: c6018d08-5c85-4527-a398-90712789e916
-- ============================================================================

-- Step 1: Ensure the user exists in auth.users table
-- (This should already exist if they've signed up)
SELECT 
    id,
    email,
    created_at,
    last_sign_in_at
FROM auth.users 
WHERE id = 'c6018d08-5c85-4527-a398-90712789e916';

-- Step 2: Insert or update the user profile with super_admin role
INSERT INTO public.profiles (
    id,
    email,
    role,
    created_at,
    updated_at
)
VALUES (
    'c6018d08-5c85-4527-a398-90712789e916',
    'service@alphabusinessdesigns.com',
    'super_admin',
    NOW(),
    NOW()
)
ON CONFLICT (id) DO UPDATE SET
    role = 'super_admin',
    email = 'service@alphabusinessdesigns.com',
    updated_at = NOW();

-- Step 3: Verify the update was successful
SELECT 
    id,
    email,
    role,
    tenant_id,
    created_at,
    updated_at
FROM public.profiles 
WHERE id = 'c6018d08-5c85-4527-a398-90712789e916';

-- Step 4: Test the is_super_admin function
SELECT 
    is_super_admin('c6018d08-5c85-4527-a398-90712789e916') as is_super_admin,
    'service@alphabusinessdesigns.com' as email;

-- Step 5: Create audit log entry for this administrative action
INSERT INTO public.audit_logs (
    user_id,
    action,
    resource_type,
    resource_id,
    details,
    created_at
)
VALUES (
    'c6018d08-5c85-4527-a398-90712789e916',
    'role_assigned',
    'user_profile',
    'c6018d08-5c85-4527-a398-90712789e916',
    '{"role": "super_admin", "assigned_by": "system", "reason": "manual_admin_assignment", "email": "service@alphabusinessdesigns.com"}',
    NOW()
);

-- Step 6: Show all super admins in the system (verification)
SELECT 
    p.id,
    p.email,
    p.role,
    p.created_at,
    p.updated_at,
    au.last_sign_in_at
FROM public.profiles p
LEFT JOIN auth.users au ON au.id = p.id
WHERE p.role = 'super_admin'
ORDER BY p.created_at DESC;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Test 1: Check if user can access master dashboard functions
SELECT 
    'Platform Analytics Test' as test_name,
    COUNT(*) as result
FROM public.get_platform_analytics();

-- Test 2: Verify RLS policies work for super admin
SELECT 
    'RLS Policy Test' as test_name,
    COUNT(*) as tenant_count
FROM public.tenants;

-- Test 3: Final verification
SELECT 
    'Final Verification' as test_name,
    CASE 
        WHEN is_super_admin('c6018d08-5c85-4527-a398-90712789e916') 
        THEN 'SUCCESS: User is super admin'
        ELSE 'ERROR: User is not super admin'
    END as status;
