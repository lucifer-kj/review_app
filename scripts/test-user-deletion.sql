-- Test User Deletion Script
-- Date: January 18, 2025
-- Purpose: Test the user deletion functionality and cascade constraints

-- ============================================================================
-- SETUP TEST DATA
-- ============================================================================

-- Create a test user for deletion testing
INSERT INTO auth.users (id, email, email_confirmed_at, created_at, updated_at) VALUES
  ('test-delete-user-1111-1111-1111-111111111111', 'test-delete@example.com', NOW(), NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Create test tenant
INSERT INTO public.tenants (id, name, status, created_by) VALUES
  ('test-tenant-for-deletion', 'Test Tenant for Deletion', 'active', 'test-delete-user-1111-1111-1111-111111111111')
ON CONFLICT (id) DO NOTHING;

-- Create test profile
INSERT INTO public.profiles (id, email, full_name, role, tenant_id) VALUES
  ('test-delete-user-1111-1111-1111-111111111111', 'test-delete@example.com', 'Test Delete User', 'tenant_admin', 'test-tenant-for-deletion')
ON CONFLICT (id) DO NOTHING;

-- Create test tenant_users relationship
INSERT INTO public.tenant_users (tenant_id, user_id, role) VALUES
  ('test-tenant-for-deletion', 'test-delete-user-1111-1111-1111-111111111111', 'owner')
ON CONFLICT (tenant_id, user_id) DO NOTHING;

-- Create test audit log
INSERT INTO public.audit_logs (action, details, created_by, tenant_id) VALUES
  ('test_action', '{"test": "data"}', 'test-delete-user-1111-1111-1111-111111111111', 'test-tenant-for-deletion')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- TEST 1: VERIFY TEST DATA EXISTS
-- ============================================================================

SELECT 'TEST 1: Verifying test data exists' as test_name;

-- Check if test user exists
SELECT 'Test user exists:' as check_name, COUNT(*) as count FROM auth.users WHERE id = 'test-delete-user-1111-1111-1111-111111111111';

-- Check if test profile exists
SELECT 'Test profile exists:' as check_name, COUNT(*) as count FROM public.profiles WHERE id = 'test-delete-user-1111-1111-1111-111111111111';

-- Check if test tenant_users exists
SELECT 'Test tenant_users exists:' as check_name, COUNT(*) as count FROM public.tenant_users WHERE user_id = 'test-delete-user-1111-1111-1111-111111111111';

-- Check if test audit_logs exists
SELECT 'Test audit_logs exists:' as check_name, COUNT(*) as count FROM public.audit_logs WHERE created_by = 'test-delete-user-1111-1111-1111-111111111111';

-- ============================================================================
-- TEST 2: TEST SAFE DELETE FUNCTION
-- ============================================================================

SELECT 'TEST 2: Testing safe_delete_user function' as test_name;

-- Test the safe delete function
SELECT public.safe_delete_user('test-delete-user-1111-1111-1111-111111111111') as deletion_result;

-- ============================================================================
-- TEST 3: VERIFY CASCADE DELETION
-- ============================================================================

SELECT 'TEST 3: Verifying cascade deletion worked' as test_name;

-- Check if test user still exists (should be 0)
SELECT 'Test user deleted:' as check_name, COUNT(*) as count FROM auth.users WHERE id = 'test-delete-user-1111-1111-1111-111111111111';

-- Check if test profile still exists (should be 0)
SELECT 'Test profile deleted:' as check_name, COUNT(*) as count FROM public.profiles WHERE id = 'test-delete-user-1111-1111-1111-111111111111';

-- Check if test tenant_users still exists (should be 0)
SELECT 'Test tenant_users deleted:' as check_name, COUNT(*) as count FROM public.tenant_users WHERE user_id = 'test-delete-user-1111-1111-1111-111111111111';

-- Check if test audit_logs still exists (should be 0 or created_by set to NULL)
SELECT 'Test audit_logs deleted or created_by set to NULL:' as check_name, COUNT(*) as count FROM public.audit_logs WHERE created_by = 'test-delete-user-1111-1111-1111-111111111111';

-- Check if created_by was set to NULL in remaining audit_logs
SELECT 'Audit logs with created_by set to NULL:' as check_name, COUNT(*) as count FROM public.audit_logs WHERE created_by IS NULL;

-- ============================================================================
-- TEST 4: CLEANUP REMAINING TEST DATA
-- ============================================================================

SELECT 'TEST 4: Cleaning up remaining test data' as test_name;

-- Clean up test tenant
DELETE FROM public.tenants WHERE id = 'test-tenant-for-deletion';

-- Clean up any remaining audit logs
DELETE FROM public.audit_logs WHERE tenant_id = 'test-tenant-for-deletion';

SELECT 'Test completed successfully!' as final_status;
