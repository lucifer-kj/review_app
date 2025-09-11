-- Safe Database Cleanup Script (with constraint handling)
-- Date: January 18, 2025
-- Purpose: Remove ALL tenant data and users from the database for fresh start
-- WARNING: This will delete ALL data permanently!

-- ============================================================================
-- SAFETY CHECK - UNCOMMENT TO PROCEED
-- ============================================================================

-- Uncomment the following line to proceed with deletion
-- SET session_replication_role = replica;

-- ============================================================================
-- STEP 1: DISABLE FOREIGN KEY CONSTRAINTS TEMPORARILY
-- ============================================================================

SELECT 'STEP 1: Temporarily disabling foreign key constraints...' as step;

-- Disable foreign key checks temporarily
SET session_replication_role = replica;

-- ============================================================================
-- STEP 2: DELETE ALL DATA IN CORRECT ORDER
-- ============================================================================

SELECT 'STEP 2: Deleting all data...' as step;

-- Delete all reviews
DELETE FROM public.reviews;
DO $$
DECLARE
    deleted_count INTEGER;
BEGIN
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Reviews deleted: %', deleted_count;
END $$;

-- Delete all business settings
DELETE FROM public.business_settings;
DO $$
DECLARE
    deleted_count INTEGER;
BEGIN
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Business settings deleted: %', deleted_count;
END $$;

-- Delete all audit logs
DELETE FROM public.audit_logs;
DO $$
DECLARE
    deleted_count INTEGER;
BEGIN
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Audit logs deleted: %', deleted_count;
END $$;

-- Delete all usage metrics
DELETE FROM public.usage_metrics;
DO $$
DECLARE
    deleted_count INTEGER;
BEGIN
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Usage metrics deleted: %', deleted_count;
END $$;

-- Delete all tenant_users relationships
DELETE FROM public.tenant_users;
DO $$
DECLARE
    deleted_count INTEGER;
BEGIN
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Tenant-user relationships deleted: %', deleted_count;
END $$;

-- Delete all profiles (except super admins)
DELETE FROM public.profiles 
WHERE role IN ('tenant_admin', 'user') 
   OR tenant_id IS NOT NULL;
DO $$
DECLARE
    deleted_count INTEGER;
BEGIN
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Tenant admin profiles deleted: %', deleted_count;
END $$;

-- Delete all tenants
DELETE FROM public.tenants;
DO $$
DECLARE
    deleted_count INTEGER;
BEGIN
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Tenants deleted: %', deleted_count;
END $$;

-- Delete all auth users (except super admins)
WITH super_admin_ids AS (
  SELECT id FROM public.profiles WHERE role = 'super_admin'
)
DELETE FROM auth.users 
WHERE id NOT IN (SELECT id FROM super_admin_ids);
DO $$
DECLARE
    deleted_count INTEGER;
BEGIN
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Auth users deleted: %', deleted_count;
END $$;

-- ============================================================================
-- STEP 3: RE-ENABLE FOREIGN KEY CONSTRAINTS
-- ============================================================================

SELECT 'STEP 3: Re-enabling foreign key constraints...' as step;

-- Re-enable foreign key checks
SET session_replication_role = DEFAULT;

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
SELECT id, email, full_name, role, tenant_id FROM public.profiles;

-- ============================================================================
-- COMPLETION
-- ============================================================================

SELECT 'CLEANUP COMPLETED!' as final_status;
SELECT 'All tenant data and tenant admins have been removed.' as message;
SELECT 'Only super admin profiles and users remain.' as note;
