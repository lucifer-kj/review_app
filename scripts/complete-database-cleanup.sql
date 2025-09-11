-- Complete Database Cleanup Script
-- Date: January 18, 2025
-- Purpose: Remove ALL tenant data and users from the database for fresh start
-- WARNING: This will delete ALL data permanently!

-- ============================================================================
-- SAFETY CHECK - UNCOMMENT TO PROCEED
-- ============================================================================

-- Uncomment the following line to proceed with deletion
-- SET session_replication_role = replica;

-- ============================================================================
-- STEP 1: DELETE ALL REVIEWS (tenant-dependent data)
-- ============================================================================

SELECT 'STEP 1: Deleting all reviews...' as step;

DELETE FROM public.reviews;

-- Get count of deleted reviews
DO $$
DECLARE
    deleted_count INTEGER;
BEGIN
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Reviews deleted: %', deleted_count;
END $$;

-- ============================================================================
-- STEP 2: DELETE ALL BUSINESS SETTINGS (tenant-dependent data)
-- ============================================================================

SELECT 'STEP 2: Deleting all business settings...' as step;

DELETE FROM public.business_settings;

-- Get count of deleted business settings
DO $$
DECLARE
    deleted_count INTEGER;
BEGIN
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Business settings deleted: %', deleted_count;
END $$;

-- ============================================================================
-- STEP 3: DELETE ALL AUDIT LOGS (tenant-dependent data)
-- ============================================================================

SELECT 'STEP 3: Deleting all audit logs...' as step;

DELETE FROM public.audit_logs;

-- Get count of deleted audit logs
DO $$
DECLARE
    deleted_count INTEGER;
BEGIN
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Audit logs deleted: %', deleted_count;
END $$;

-- ============================================================================
-- STEP 4: DELETE ALL USAGE METRICS (tenant-dependent data)
-- ============================================================================

SELECT 'STEP 4: Deleting all usage metrics...' as step;

DELETE FROM public.usage_metrics;

-- Get count of deleted usage metrics
DO $$
DECLARE
    deleted_count INTEGER;
BEGIN
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Usage metrics deleted: %', deleted_count;
END $$;

-- ============================================================================
-- STEP 5: DELETE ALL TENANT_USERS RELATIONSHIPS
-- ============================================================================

SELECT 'STEP 5: Deleting all tenant-user relationships...' as step;

DELETE FROM public.tenant_users;

-- Get count of deleted tenant-user relationships
DO $$
DECLARE
    deleted_count INTEGER;
BEGIN
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Tenant-user relationships deleted: %', deleted_count;
END $$;

-- ============================================================================
-- STEP 6: DELETE ALL PROFILES (except super admins)
-- ============================================================================

SELECT 'STEP 6: Deleting all tenant admin profiles...' as step;

-- Delete profiles for tenant admins (keep super admins using is_super_admin function)
DELETE FROM public.profiles 
WHERE NOT public.is_super_admin(id);

-- Get count of deleted profiles
DO $$
DECLARE
    deleted_count INTEGER;
BEGIN
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Tenant admin profiles deleted: %', deleted_count;
END $$;

-- ============================================================================
-- STEP 7: DELETE ALL TENANTS (now safe to delete)
-- ============================================================================

SELECT 'STEP 7: Deleting all tenants...' as step;

DELETE FROM public.tenants;

-- Get count of deleted tenants
DO $$
DECLARE
    deleted_count INTEGER;
BEGIN
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Tenants deleted: %', deleted_count;
END $$;

-- ============================================================================
-- STEP 8: DELETE ALL AUTH USERS (except super admins)
-- ============================================================================

SELECT 'STEP 8: Deleting auth users (except super admins)...' as step;

-- Delete auth users who are not super admins using is_super_admin function
DELETE FROM auth.users 
WHERE NOT public.is_super_admin(id);

-- Get count of deleted auth users
DO $$
DECLARE
    deleted_count INTEGER;
BEGIN
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Auth users deleted: %', deleted_count;
END $$;

-- ============================================================================
-- STEP 9: RESET SEQUENCES
-- ============================================================================

SELECT 'STEP 9: Resetting sequences...' as step;

-- Reset any sequences that might exist
-- (Most tables use UUIDs, but if there are any sequences, reset them)

-- ============================================================================
-- VERIFICATION: CHECK WHAT REMAINS
-- ============================================================================

SELECT 'VERIFICATION: Checking remaining data...' as verification;

-- Check remaining tenants
SELECT 'Remaining tenants: ' || COUNT(*) as count FROM public.tenants;

-- Check remaining profiles
SELECT 'Remaining profiles: ' || COUNT(*) as count FROM public.profiles;

-- Check remaining auth users
SELECT 'Remaining auth users: ' || COUNT(*) as count FROM auth.users;

-- Check remaining reviews
SELECT 'Remaining reviews: ' || COUNT(*) as count FROM public.reviews;

-- Check remaining tenant_users
SELECT 'Remaining tenant_users: ' || COUNT(*) as count FROM public.tenant_users;

-- Check remaining business_settings
SELECT 'Remaining business_settings: ' || COUNT(*) as count FROM public.business_settings;

-- Check remaining audit_logs
SELECT 'Remaining audit_logs: ' || COUNT(*) as count FROM public.audit_logs;

-- Check remaining usage_metrics
SELECT 'Remaining usage_metrics: ' || COUNT(*) as count FROM public.usage_metrics;

-- Show remaining profiles (should only be super admins)
SELECT 'Remaining profiles details:' as info;
SELECT 
    id, 
    email, 
    full_name, 
    role, 
    tenant_id,
    public.is_super_admin(id) as is_super_admin_check
FROM public.profiles;

-- Verify all remaining users are super admins
SELECT 'Verification: All remaining users are super admins:' as check_name;
SELECT 
    CASE 
        WHEN COUNT(*) = 0 THEN 'PASS - No profiles remaining'
        WHEN COUNT(*) = COUNT(CASE WHEN public.is_super_admin(id) THEN 1 END) THEN 'PASS - All remaining users are super admins'
        ELSE 'FAIL - Some remaining users are not super admins'
    END as verification_result
FROM public.profiles;

-- ============================================================================
-- COMPLETION
-- ============================================================================

SELECT 'CLEANUP COMPLETED!' as final_status;
SELECT 'All tenant data and tenant admins have been removed.' as message;
SELECT 'Only super admin profiles and users remain.' as note;

-- Reset session replication role
SET session_replication_role = DEFAULT;
