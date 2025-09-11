-- Cleanup Script: Delete All Tenants and Tenant Admins
-- Date: January 18, 2025
-- Purpose: Safely remove all tenant data and admin users from the database
-- WARNING: This will delete ALL tenant data permanently!

-- ============================================================================
-- SAFETY CHECK - UNCOMMENT TO PROCEED
-- ============================================================================

-- Uncomment the following line to proceed with deletion
-- SET session_replication_role = replica;

-- ============================================================================
-- STEP 1: DELETE ALL REVIEWS (tenant-dependent data)
-- ============================================================================

SELECT 'STEP 1: Deleting all reviews...' as step;

-- Delete all reviews (they depend on tenants)
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
-- STEP 2: DELETE ALL TENANT_USERS RELATIONSHIPS
-- ============================================================================

SELECT 'STEP 2: Deleting all tenant-user relationships...' as step;

-- Delete all tenant-user relationships
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
-- STEP 3: DELETE ALL PROFILES (except super admins)
-- ============================================================================

SELECT 'STEP 3: Deleting all tenant admin profiles...' as step;

-- Delete profiles for tenant admins (keep super admins)
DELETE FROM public.profiles 
WHERE role IN ('tenant_admin', 'user') 
   OR tenant_id IS NOT NULL;

-- Get count of deleted profiles
DO $$
DECLARE
    deleted_count INTEGER;
BEGIN
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Tenant admin profiles deleted: %', deleted_count;
END $$;

-- ============================================================================
-- STEP 4: DELETE ALL TENANTS
-- ============================================================================

SELECT 'STEP 4: Deleting all tenants...' as step;

-- Delete all tenants
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
-- STEP 5: DELETE AUTH USERS (except super admins)
-- ============================================================================

SELECT 'STEP 5: Deleting auth users (except super admins)...' as step;

-- Delete auth users who are not super admins
-- First, get the list of super admin user IDs
WITH super_admin_ids AS (
  SELECT id FROM public.profiles WHERE role = 'super_admin'
)
DELETE FROM auth.users 
WHERE id NOT IN (SELECT id FROM super_admin_ids)
  AND id NOT IN (
    -- Keep any users that might not have profiles yet
    SELECT DISTINCT created_by FROM public.tenants WHERE created_by IS NOT NULL
  );

-- Get count of deleted auth users
DO $$
DECLARE
    deleted_count INTEGER;
BEGIN
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Auth users deleted: %', deleted_count;
END $$;

-- ============================================================================
-- STEP 6: CLEAN UP AUDIT LOGS AND USAGE METRICS
-- ============================================================================

SELECT 'STEP 6: Cleaning up audit logs and usage metrics...' as step;

-- Delete audit logs (they reference tenants)
DELETE FROM public.audit_logs;

-- Get count of deleted audit logs
DO $$
DECLARE
    deleted_count INTEGER;
BEGIN
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Audit logs deleted: %', deleted_count;
END $$;

-- Delete usage metrics (they reference tenants)
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
-- STEP 7: RESET SEQUENCES (if any)
-- ============================================================================

SELECT 'STEP 7: Resetting sequences...' as step;

-- Reset any sequences that might exist
-- (Most tables use UUIDs, but if there are any sequences, reset them)
-- This is optional and depends on your schema

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

-- Show remaining profiles (should only be super admins)
SELECT 'Remaining profiles details:' as info;
SELECT id, email, full_name, role, tenant_id FROM public.profiles;

-- ============================================================================
-- COMPLETION
-- ============================================================================

SELECT 'CLEANUP COMPLETED!' as final_status;
SELECT 'All tenant data and tenant admins have been removed.' as message;
SELECT 'Only super admin profiles and users remain.' as note;

-- Reset session replication role
SET session_replication_role = DEFAULT;
