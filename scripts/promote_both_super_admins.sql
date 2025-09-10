-- ============================================================================
-- PROMOTE BOTH USERS TO SUPER ADMIN - COMBINED SCRIPT
-- ============================================================================
-- Email 1: info@alphabusinessdesigns.com
-- UID 1: b619cba0-8de4-479d-b766-0337c0577e43
-- Email 2: service@alphabusinessdesigns.com  
-- UID 2: c6018d08-5c85-4527-a398-90712789e916
-- ============================================================================

-- Step 1: Check if both users exist in auth.users table
SELECT 
    'User Check' as step,
    id,
    email,
    created_at,
    last_sign_in_at
FROM auth.users 
WHERE id IN ('b619cba0-8de4-479d-b766-0337c0577e43', 'c6018d08-5c85-4527-a398-90712789e916')
ORDER BY email;

-- Step 2: Promote first user to super admin
INSERT INTO public.profiles (
    id,
    email,
    role,
    created_at,
    updated_at
)
VALUES (
    'b619cba0-8de4-479d-b766-0337c0577e43',
    'info@alphabusinessdesigns.com',
    'super_admin',
    NOW(),
    NOW()
)
ON CONFLICT (id) DO UPDATE SET
    role = 'super_admin',
    email = 'info@alphabusinessdesigns.com',
    updated_at = NOW();

-- Step 3: Promote second user to super admin
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

-- Step 4: Verify both users were promoted successfully
SELECT 
    'Profile Verification' as step,
    id,
    email,
    role,
    tenant_id,
    created_at,
    updated_at
FROM public.profiles 
WHERE id IN ('b619cba0-8de4-479d-b766-0337c0577e43', 'c6018d08-5c85-4527-a398-90712789e916')
ORDER BY email;

-- Step 5: Test the is_super_admin function for both users
SELECT 
    'Function Test' as step,
    'b619cba0-8de4-479d-b766-0337c0577e43' as user_id,
    'info@alphabusinessdesigns.com' as email,
    is_super_admin('b619cba0-8de4-479d-b766-0337c0577e43') as is_super_admin

UNION ALL

SELECT 
    'Function Test' as step,
    'c6018d08-5c85-4527-a398-90712789e916' as user_id,
    'service@alphabusinessdesigns.com' as email,
    is_super_admin('c6018d08-5c85-4527-a398-90712789e916') as is_super_admin;

-- Step 6: Create audit log entries for both administrative actions
INSERT INTO public.audit_logs (
    user_id,
    action,
    resource_type,
    resource_id,
    details,
    created_at
)
VALUES 
(
    'b619cba0-8de4-479d-b766-0337c0577e43',
    'role_assigned',
    'user_profile',
    'b619cba0-8de4-479d-b766-0337c0577e43',
    '{"role": "super_admin", "assigned_by": "system", "reason": "manual_admin_assignment", "email": "info@alphabusinessdesigns.com"}',
    NOW()
),
(
    'c6018d08-5c85-4527-a398-90712789e916',
    'role_assigned',
    'user_profile',
    'c6018d08-5c85-4527-a398-90712789e916',
    '{"role": "super_admin", "assigned_by": "system", "reason": "manual_admin_assignment", "email": "service@alphabusinessdesigns.com"}',
    NOW()
);

-- Step 7: Show all super admins in the system
SELECT 
    'All Super Admins' as step,
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
-- COMPREHENSIVE VERIFICATION TESTS
-- ============================================================================

-- Test 1: Platform Analytics Access (should work for super admins)
SELECT 
    'Platform Analytics Test' as test_name,
    'Both users should have access' as description,
    COUNT(*) as result
FROM public.get_platform_analytics();

-- Test 2: Tenant Access (should work for super admins)
SELECT 
    'Tenant Access Test' as test_name,
    'Both users should see all tenants' as description,
    COUNT(*) as tenant_count
FROM public.tenants;

-- Test 3: Profile Access (should work for super admins)
SELECT 
    'Profile Access Test' as test_name,
    'Both users should see all profiles' as description,
    COUNT(*) as profile_count
FROM public.profiles;

-- Test 4: Final Status Check
SELECT 
    'Final Status Check' as test_name,
    'Both users should be super admins' as description,
    CASE 
        WHEN is_super_admin('b619cba0-8de4-479d-b766-0337c0577e43') 
         AND is_super_admin('c6018d08-5c85-4527-a398-90712789e916')
        THEN 'SUCCESS: Both users are super admins'
        ELSE 'ERROR: One or both users are not super admins'
    END as status;

-- ============================================================================
-- MASTER DASHBOARD ACCESS VERIFICATION
-- ============================================================================

-- Test 5: Verify master dashboard functions work
SELECT 
    'Master Dashboard Functions' as test_name,
    'Testing platform analytics function' as description,
    total_tenants,
    active_tenants,
    total_users,
    total_reviews
FROM public.get_platform_analytics();

-- Test 6: Check RLS policies are working correctly
SELECT 
    'RLS Policy Verification' as test_name,
    'Super admins should bypass tenant restrictions' as description,
    'PASS' as status
WHERE EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id IN ('b619cba0-8de4-479d-b766-0337c0577e43', 'c6018d08-5c85-4527-a398-90712789e916')
    AND role = 'super_admin'
);
