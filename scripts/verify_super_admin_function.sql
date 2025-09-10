-- ============================================================================
-- VERIFY SUPER ADMIN FUNCTION AND ROLES
-- ============================================================================
-- This script tests the is_super_admin function and verifies user roles
-- ============================================================================

-- Test 1: Check if the is_super_admin function exists and works
SELECT 
    'Function Exists Test' as test_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_proc 
            WHERE proname = 'is_super_admin' 
            AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
        ) 
        THEN 'PASS: is_super_admin function exists'
        ELSE 'FAIL: is_super_admin function does not exist'
    END as result;

-- Test 2: Test the function with the specific user IDs
SELECT 
    'User 1 Test' as test_name,
    'b619cba0-8de4-479d-b766-0337c0577e43' as user_id,
    'info@alphabusinessdesigns.com' as email,
    is_super_admin('b619cba0-8de4-479d-b766-0337c0577e43') as is_super_admin,
    CASE 
        WHEN is_super_admin('b619cba0-8de4-479d-b766-0337c0577e43') 
        THEN 'PASS: User 1 is super admin'
        ELSE 'FAIL: User 1 is not super admin'
    END as status

UNION ALL

SELECT 
    'User 2 Test' as test_name,
    'c6018d08-5c85-4527-a398-90712789e916' as user_id,
    'service@alphabusinessdesigns.com' as email,
    is_super_admin('c6018d08-5c85-4527-a398-90712789e916') as is_super_admin,
    CASE 
        WHEN is_super_admin('c6018d08-5c85-4527-a398-90712789e916') 
        THEN 'PASS: User 2 is super admin'
        ELSE 'FAIL: User 2 is not super admin'
    END as status;

-- Test 3: Check current roles in profiles table
SELECT 
    'Current Roles Check' as test_name,
    p.id,
    p.email,
    p.role,
    p.created_at,
    p.updated_at
FROM public.profiles p
WHERE p.id IN ('b619cba0-8de4-479d-b766-0337c0577e43', 'c6018d08-5c85-4527-a398-90712789e916')
ORDER BY p.email;

-- Test 4: Check all super admins in the system
SELECT 
    'All Super Admins' as test_name,
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

-- Test 5: Test RLS policies with super admin access
SELECT 
    'RLS Policy Test' as test_name,
    'Testing tenant access' as description,
    COUNT(*) as accessible_tenants
FROM public.tenants;

-- Test 6: Test platform analytics access (super admin only function)
SELECT 
    'Platform Analytics Test' as test_name,
    'Testing super admin analytics access' as description,
    total_tenants,
    active_tenants,
    total_users,
    total_reviews
FROM public.get_platform_analytics();

-- Test 7: Verify the function definition
SELECT 
    'Function Definition' as test_name,
    pg_get_functiondef(oid) as function_definition
FROM pg_proc 
WHERE proname = 'is_super_admin' 
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- Test 8: Check if users exist in auth.users
SELECT 
    'Auth Users Check' as test_name,
    id,
    email,
    created_at,
    last_sign_in_at,
    CASE 
        WHEN id IN ('b619cba0-8de4-479d-b766-0337c0577e43', 'c6018d08-5c85-4527-a398-90712789e916')
        THEN 'TARGET USER'
        ELSE 'OTHER USER'
    END as user_type
FROM auth.users 
WHERE id IN ('b619cba0-8de4-479d-b766-0337c0577e43', 'c6018d08-5c85-4527-a398-90712789e916')
ORDER BY email;
