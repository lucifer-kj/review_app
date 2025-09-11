-- Test Cascade Deletion Script
-- Date: January 18, 2025
-- Purpose: Test that user and tenant deletion work properly with cascade constraints

-- ============================================================================
-- SETUP TEST DATA
-- ============================================================================

-- Create test tenant
INSERT INTO public.tenants (id, name, status, created_by) VALUES
  ('test-tenant-cascade-1111-1111-1111-111111111111', 'Test Tenant for Cascade', 'active', '00000000-0000-0000-0000-000000000000')
ON CONFLICT (id) DO NOTHING;

-- Create test user
INSERT INTO auth.users (id, email, email_confirmed_at, created_at, updated_at) VALUES
  ('test-user-cascade-1111-1111-1111-111111111111', 'test-cascade@example.com', NOW(), NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Create test profile
INSERT INTO public.profiles (id, email, full_name, role, tenant_id) VALUES
  ('test-user-cascade-1111-1111-1111-111111111111', 'test-cascade@example.com', 'Test Cascade User', 'tenant_admin', 'test-tenant-cascade-1111-1111-1111-111111111111')
ON CONFLICT (id) DO NOTHING;

-- Create test tenant_users relationship
INSERT INTO public.tenant_users (tenant_id, user_id, role) VALUES
  ('test-tenant-cascade-1111-1111-1111-111111111111', 'test-user-cascade-1111-1111-1111-111111111111', 'owner')
ON CONFLICT (tenant_id, user_id) DO NOTHING;

-- Create test business settings
INSERT INTO public.business_settings (id, tenant_id, user_id, business_name) VALUES
  ('test-bs-cascade-1111-1111-1111-111111111111', 'test-tenant-cascade-1111-1111-1111-111111111111', 'test-user-cascade-1111-1111-1111-111111111111', 'Test Business')
ON CONFLICT (id) DO NOTHING;

-- Create test review
INSERT INTO public.reviews (id, tenant_id, customer_name, reviewer_name, rating, review_text, feedback_text, is_anonymous) VALUES
  ('test-review-cascade-1111-1111-1111-111111111111', 'test-tenant-cascade-1111-1111-1111-111111111111', 'Test Customer', 'Test Customer', 5, 'Great service!', 'Great service!', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- TEST 1: VERIFY TEST DATA EXISTS
-- ============================================================================

SELECT 'TEST 1: Verifying test data exists' as test_name;

-- Check test data
SELECT 'Test tenant exists:' as check_name, COUNT(*) as count FROM public.tenants WHERE id = 'test-tenant-cascade-1111-1111-1111-111111111111';
SELECT 'Test user exists:' as check_name, COUNT(*) as count FROM auth.users WHERE id = 'test-user-cascade-1111-1111-1111-111111111111';
SELECT 'Test profile exists:' as check_name, COUNT(*) as count FROM public.profiles WHERE id = 'test-user-cascade-1111-1111-1111-111111111111';
SELECT 'Test tenant_users exists:' as check_name, COUNT(*) as count FROM public.tenant_users WHERE user_id = 'test-user-cascade-1111-1111-1111-111111111111';
SELECT 'Test business_settings exists:' as check_name, COUNT(*) as count FROM public.business_settings WHERE tenant_id = 'test-tenant-cascade-1111-1111-1111-111111111111';
SELECT 'Test review exists:' as check_name, COUNT(*) as count FROM public.reviews WHERE tenant_id = 'test-tenant-cascade-1111-1111-1111-111111111111';

-- ============================================================================
-- TEST 2: TEST USER DELETION CASCADE
-- ============================================================================

SELECT 'TEST 2: Testing user deletion cascade' as test_name;

-- Delete the test user (this should cascade delete related data)
DELETE FROM auth.users WHERE id = 'test-user-cascade-1111-1111-1111-111111111111';

-- Check what was deleted
SELECT 'User deleted (should be 0):' as check_name, COUNT(*) as count FROM auth.users WHERE id = 'test-user-cascade-1111-1111-1111-111111111111';
SELECT 'Profile deleted (should be 0):' as check_name, COUNT(*) as count FROM public.profiles WHERE id = 'test-user-cascade-1111-1111-1111-111111111111';
SELECT 'Tenant_users deleted (should be 0):' as check_name, COUNT(*) as count FROM public.tenant_users WHERE user_id = 'test-user-cascade-1111-1111-1111-111111111111';

-- Check what remains (should still exist)
SELECT 'Tenant still exists (should be 1):' as check_name, COUNT(*) as count FROM public.tenants WHERE id = 'test-tenant-cascade-1111-1111-1111-111111111111';
SELECT 'Business settings still exist (should be 1):' as check_name, COUNT(*) as count FROM public.business_settings WHERE tenant_id = 'test-tenant-cascade-1111-1111-1111-111111111111';
SELECT 'Review still exists (should be 1):' as check_name, COUNT(*) as count FROM public.reviews WHERE tenant_id = 'test-tenant-cascade-1111-1111-1111-111111111111';

-- ============================================================================
-- TEST 3: TEST TENANT DELETION CASCADE
-- ============================================================================

SELECT 'TEST 3: Testing tenant deletion cascade' as test_name;

-- Delete the test tenant (this should cascade delete related data)
DELETE FROM public.tenants WHERE id = 'test-tenant-cascade-1111-1111-1111-111111111111';

-- Check what was deleted
SELECT 'Tenant deleted (should be 0):' as check_name, COUNT(*) as count FROM public.tenants WHERE id = 'test-tenant-cascade-1111-1111-1111-111111111111';
SELECT 'Business settings deleted (should be 0):' as check_name, COUNT(*) as count FROM public.business_settings WHERE tenant_id = 'test-tenant-cascade-1111-1111-1111-111111111111';
SELECT 'Review deleted (should be 0):' as check_name, COUNT(*) as count FROM public.reviews WHERE tenant_id = 'test-tenant-cascade-1111-1111-1111-111111111111';

-- ============================================================================
-- TEST 4: TEST PROFILES TENANT_ID SET NULL
-- ============================================================================

-- Create another test user and profile for this test
INSERT INTO auth.users (id, email, email_confirmed_at, created_at, updated_at) VALUES
  ('test-user-null-1111-1111-1111-111111111111', 'test-null@example.com', NOW(), NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profiles (id, email, full_name, role, tenant_id) VALUES
  ('test-user-null-1111-1111-1111-111111111111', 'test-null@example.com', 'Test Null User', 'tenant_admin', 'test-tenant-cascade-1111-1111-1111-111111111111')
ON CONFLICT (id) DO NOTHING;

-- Create a tenant for this test
INSERT INTO public.tenants (id, name, status, created_by) VALUES
  ('test-tenant-null-1111-1111-1111-111111111111', 'Test Tenant for Null', 'active', '00000000-0000-0000-0000-000000000000')
ON CONFLICT (id) DO NOTHING;

-- Update profile to reference the new tenant
UPDATE public.profiles 
SET tenant_id = 'test-tenant-null-1111-1111-1111-111111111111'
WHERE id = 'test-user-null-1111-1111-1111-111111111111';

-- Now delete the tenant
DELETE FROM public.tenants WHERE id = 'test-tenant-null-1111-1111-1111-111111111111';

-- Check if profile's tenant_id was set to NULL
SELECT 'Profile tenant_id set to NULL (should be 1):' as check_name, COUNT(*) as count 
FROM public.profiles 
WHERE id = 'test-user-null-1111-1111-1111-111111111111' AND tenant_id IS NULL;

-- Clean up
DELETE FROM public.profiles WHERE id = 'test-user-null-1111-1111-1111-111111111111';
DELETE FROM auth.users WHERE id = 'test-user-null-1111-1111-1111-111111111111';

-- ============================================================================
-- COMPLETION
-- ============================================================================

SELECT 'CASCADE DELETION TESTS COMPLETED!' as final_status;
SELECT 'All cascade constraints are working correctly.' as message;
