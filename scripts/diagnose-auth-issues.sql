-- Authentication Issues Diagnostic Script
-- Date: January 18, 2025
-- Purpose: Diagnose and fix authentication issues

-- ============================================================================
-- 1. CHECK CURRENT AUTH USERS
-- ============================================================================

SELECT 'AUTH USERS CHECK' as section;
SELECT 
    id,
    email,
    email_confirmed_at,
    created_at,
    last_sign_in_at,
    banned_until,
    app_metadata,
    user_metadata
FROM auth.users
ORDER BY created_at DESC;

-- ============================================================================
-- 2. CHECK CURRENT PROFILES
-- ============================================================================

SELECT 'PROFILES CHECK' as section;
SELECT 
    id,
    email,
    full_name,
    role,
    tenant_id,
    created_at,
    updated_at
FROM public.profiles
ORDER BY created_at DESC;

-- ============================================================================
-- 3. CHECK CURRENT TENANTS
-- ============================================================================

SELECT 'TENANTS CHECK' as section;
SELECT 
    id,
    name,
    domain,
    status,
    created_by,
    created_at,
    updated_at
FROM public.tenants
ORDER BY created_at DESC;

-- ============================================================================
-- 4. CHECK TENANT_USERS RELATIONSHIPS
-- ============================================================================

SELECT 'TENANT_USERS CHECK' as section;
SELECT 
    tu.tenant_id,
    tu.user_id,
    tu.role,
    p.email,
    p.full_name,
    p.role as profile_role
FROM public.tenant_users tu
LEFT JOIN public.profiles p ON p.id = tu.user_id
ORDER BY tu.created_at DESC;

-- ============================================================================
-- 5. CHECK FOR ORPHANED RECORDS
-- ============================================================================

SELECT 'ORPHANED RECORDS CHECK' as section;

-- Profiles without corresponding auth users
SELECT 'Profiles without auth users:' as check_name;
SELECT p.id, p.email, p.role
FROM public.profiles p
LEFT JOIN auth.users u ON u.id = p.id
WHERE u.id IS NULL;

-- Auth users without profiles
SELECT 'Auth users without profiles:' as check_name;
SELECT u.id, u.email
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL;

-- Profiles with invalid tenant_id
SELECT 'Profiles with invalid tenant_id:' as check_name;
SELECT p.id, p.email, p.tenant_id
FROM public.profiles p
LEFT JOIN public.tenants t ON t.id = p.tenant_id
WHERE p.tenant_id IS NOT NULL AND t.id IS NULL;

-- ============================================================================
-- 6. CHECK RLS POLICIES
-- ============================================================================

SELECT 'RLS POLICIES CHECK' as section;

-- Check if RLS is enabled on key tables
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('profiles', 'tenants', 'tenant_users', 'reviews')
ORDER BY tablename;

-- Check RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public'
    AND tablename IN ('profiles', 'tenants', 'tenant_users', 'reviews')
ORDER BY tablename, policyname;

-- ============================================================================
-- 7. TEST AUTH FUNCTIONS
-- ============================================================================

SELECT 'AUTH FUNCTIONS TEST' as section;

-- Test get_current_tenant_id function
SELECT 'Testing get_current_tenant_id function:' as test_name;
-- This will only work if there's an active session
-- SELECT public.get_current_tenant_id() as current_tenant_id;

-- Test is_super_admin function with a sample user
SELECT 'Testing is_super_admin function:' as test_name;
SELECT 
    p.id,
    p.email,
    p.role,
    public.is_super_admin(p.id) as is_super_admin
FROM public.profiles p
WHERE p.role = 'super_admin'
LIMIT 1;

-- ============================================================================
-- 8. RECOMMENDATIONS
-- ============================================================================

SELECT 'RECOMMENDATIONS' as section;

-- Check for common issues
SELECT 'Common issues found:' as check_name;

-- Issue 1: Users without profiles
SELECT 
    'Users without profiles: ' || COUNT(*) as issue
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL;

-- Issue 2: Profiles without valid tenants
SELECT 
    'Profiles with invalid tenant_id: ' || COUNT(*) as issue
FROM public.profiles p
LEFT JOIN public.tenants t ON t.id = p.tenant_id
WHERE p.tenant_id IS NOT NULL AND t.id IS NULL;

-- Issue 3: Orphaned tenant_users
SELECT 
    'Orphaned tenant_users: ' || COUNT(*) as issue
FROM public.tenant_users tu
LEFT JOIN auth.users u ON u.id = tu.user_id
WHERE u.id IS NULL;

-- ============================================================================
-- 9. CLEANUP RECOMMENDATIONS
-- ============================================================================

SELECT 'CLEANUP RECOMMENDATIONS' as section;

-- If you want to clean up orphaned records, uncomment these:

-- Clean up profiles without auth users
-- DELETE FROM public.profiles 
-- WHERE id NOT IN (SELECT id FROM auth.users);

-- Clean up tenant_users without valid users
-- DELETE FROM public.tenant_users 
-- WHERE user_id NOT IN (SELECT id FROM auth.users);

-- Clean up profiles with invalid tenant_id
-- UPDATE public.profiles 
-- SET tenant_id = NULL 
-- WHERE tenant_id IS NOT NULL 
--   AND tenant_id NOT IN (SELECT id FROM public.tenants);

SELECT 'Diagnostic completed!' as final_status;
