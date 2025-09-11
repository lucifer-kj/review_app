-- RLS Policy Testing Script for Multi-Tenant Public Review URL System
-- This script tests the Row Level Security policies to ensure proper tenant isolation

-- ============================================================================
-- SETUP TEST DATA
-- ============================================================================

-- Create test tenants
INSERT INTO public.tenants (id, name, status, created_by) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Test Business A', 'active', '00000000-0000-0000-0000-000000000000'),
  ('22222222-2222-2222-2222-222222222222', 'Test Business B', 'active', '00000000-0000-0000-0000-000000000000')
ON CONFLICT (id) DO NOTHING;

-- Create test users
INSERT INTO auth.users (id, email, email_confirmed_at, created_at, updated_at) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'user-a@test.com', NOW(), NOW(), NOW()),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'user-b@test.com', NOW(), NOW(), NOW()),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'super-admin@test.com', NOW(), NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Create test profiles
INSERT INTO public.profiles (id, email, full_name, role, tenant_id) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'user-a@test.com', 'User A', 'tenant_admin', '11111111-1111-1111-1111-111111111111'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'user-b@test.com', 'User B', 'tenant_admin', '22222222-2222-2222-2222-222222222222'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'super-admin@test.com', 'Super Admin', 'super_admin', NULL)
ON CONFLICT (id) DO NOTHING;

-- Create test tenant_users relationships
INSERT INTO public.tenant_users (tenant_id, user_id, role) VALUES
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'owner'),
  ('22222222-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'owner')
ON CONFLICT (tenant_id, user_id) DO NOTHING;

-- Create test reviews
INSERT INTO public.reviews (id, tenant_id, reviewer_name, rating, feedback_text, is_anonymous) VALUES
  ('review-a-1', '11111111-1111-1111-1111-111111111111', 'Customer A1', 5, 'Great service!', true),
  ('review-a-2', '11111111-1111-1111-1111-111111111111', 'Customer A2', 4, 'Very good experience', true),
  ('review-b-1', '22222222-2222-2222-2222-222222222222', 'Customer B1', 3, 'Average service', true),
  ('review-b-2', '22222222-2222-2222-2222-222222222222', 'Customer B2', 2, 'Could be better', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- TEST 1: TENANT ISOLATION - TENANTS TABLE
-- ============================================================================

-- Test as User A (should only see Tenant A)
SET LOCAL "request.jwt.claims" TO '{"sub": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"}';
SET LOCAL "request.jwt.claims" TO '{"sub": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"}';

SELECT 'TEST 1: Tenant Isolation - Tenants Table' as test_name;
SELECT 'User A should only see Tenant A' as expectation;

-- This should only return Tenant A
SELECT id, name FROM public.tenants;

-- Reset context
RESET ALL;

-- Test as User B (should only see Tenant B)
SET LOCAL "request.jwt.claims" TO '{"sub": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"}';

SELECT 'User B should only see Tenant B' as expectation;

-- This should only return Tenant B
SELECT id, name FROM public.tenants;

-- Reset context
RESET ALL;

-- Test as Super Admin (should see all tenants)
SET LOCAL "request.jwt.claims" TO '{"sub": "cccccccc-cccc-cccc-cccc-cccccccccccc"}';

SELECT 'Super Admin should see all tenants' as expectation;

-- This should return both tenants
SELECT id, name FROM public.tenants;

-- Reset context
RESET ALL;

-- ============================================================================
-- TEST 2: TENANT ISOLATION - REVIEWS TABLE
-- ============================================================================

-- Test as User A (should only see Tenant A reviews)
SET LOCAL "request.jwt.claims" TO '{"sub": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"}';

SELECT 'TEST 2: Tenant Isolation - Reviews Table' as test_name;
SELECT 'User A should only see Tenant A reviews' as expectation;

-- This should only return Tenant A reviews
SELECT id, tenant_id, reviewer_name, rating FROM public.reviews;

-- Reset context
RESET ALL;

-- Test as User B (should only see Tenant B reviews)
SET LOCAL "request.jwt.claims" TO '{"sub": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"}';

SELECT 'User B should only see Tenant B reviews' as expectation;

-- This should only return Tenant B reviews
SELECT id, tenant_id, reviewer_name, rating FROM public.reviews;

-- Reset context
RESET ALL;

-- Test as Super Admin (should see all reviews)
SET LOCAL "request.jwt.claims" TO '{"sub": "cccccccc-cccc-cccc-cccc-cccccccccccc"}';

SELECT 'Super Admin should see all reviews' as expectation;

-- This should return all reviews
SELECT id, tenant_id, reviewer_name, rating FROM public.reviews;

-- Reset context
RESET ALL;

-- ============================================================================
-- TEST 3: ANONYMOUS REVIEW INSERTION
-- ============================================================================

-- Test anonymous review insertion (should work)
SELECT 'TEST 3: Anonymous Review Insertion' as test_name;
SELECT 'Anonymous users should be able to insert reviews' as expectation;

-- This should succeed
INSERT INTO public.reviews (id, tenant_id, reviewer_name, rating, feedback_text, is_anonymous) 
VALUES ('test-anon-review', '11111111-1111-1111-1111-111111111111', 'Anonymous User', 4, 'Test review', true);

-- Verify the review was inserted
SELECT id, tenant_id, reviewer_name, rating, is_anonymous FROM public.reviews WHERE id = 'test-anon-review';

-- Clean up test review
DELETE FROM public.reviews WHERE id = 'test-anon-review';

-- ============================================================================
-- TEST 4: TENANT_USERS TABLE ISOLATION
-- ============================================================================

-- Test as User A (should see their own membership and Tenant A users)
SET LOCAL "request.jwt.claims" TO '{"sub": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"}';

SELECT 'TEST 4: Tenant Users Table Isolation' as test_name;
SELECT 'User A should see their own membership and Tenant A users' as expectation;

-- This should return User A's membership and any other Tenant A users
SELECT tu.tenant_id, tu.user_id, tu.role, p.email 
FROM public.tenant_users tu
JOIN public.profiles p ON p.id = tu.user_id;

-- Reset context
RESET ALL;

-- Test as User B (should see their own membership and Tenant B users)
SET LOCAL "request.jwt.claims" TO '{"sub": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"}';

SELECT 'User B should see their own membership and Tenant B users' as expectation;

-- This should return User B's membership and any other Tenant B users
SELECT tu.tenant_id, tu.user_id, tu.role, p.email 
FROM public.tenant_users tu
JOIN public.profiles p ON p.id = tu.user_id;

-- Reset context
RESET ALL;

-- ============================================================================
-- TEST 5: CROSS-TENANT ACCESS ATTEMPTS (SHOULD FAIL)
-- ============================================================================

-- Test User A trying to access Tenant B data (should fail)
SET LOCAL "request.jwt.claims" TO '{"sub": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"}';

SELECT 'TEST 5: Cross-Tenant Access Prevention' as test_name;
SELECT 'User A should NOT be able to access Tenant B data' as expectation;

-- This should return empty or fail
SELECT id, name FROM public.tenants WHERE id = '22222222-2222-2222-2222-222222222222';

-- This should return empty or fail
SELECT id, tenant_id, reviewer_name FROM public.reviews WHERE tenant_id = '22222222-2222-2222-2222-222222222222';

-- Reset context
RESET ALL;

-- ============================================================================
-- TEST 6: SLUG GENERATION FUNCTION
-- ============================================================================

SELECT 'TEST 6: Slug Generation Function' as test_name;
SELECT 'Slug generation should work correctly' as expectation;

-- Test slug generation
SELECT public.generate_slug('Test Business Name') as generated_slug;
SELECT public.generate_slug('Another Business!') as generated_slug_2;
SELECT public.generate_slug('Test Business Name') as duplicate_slug_test;

-- ============================================================================
-- TEST 7: TENANT BY SLUG FUNCTION
-- ============================================================================

-- First, create a tenant with a slug
UPDATE public.tenants 
SET business_name = 'Test Business A', 
    google_review_url = 'https://maps.google.com/test-a',
    slug = 'test-business-a',
    review_url = 'https://yourapp.com/review/test-business-a'
WHERE id = '11111111-1111-1111-1111-111111111111';

SELECT 'TEST 7: Tenant By Slug Function' as test_name;
SELECT 'Should be able to get tenant by slug' as expectation;

-- Test getting tenant by slug
SELECT * FROM public.get_tenant_by_slug('test-business-a');

-- Test getting non-existent slug
SELECT * FROM public.get_tenant_by_slug('non-existent-slug');

-- ============================================================================
-- CLEANUP TEST DATA
-- ============================================================================

SELECT 'CLEANUP: Removing test data' as cleanup;

-- Remove test data
DELETE FROM public.reviews WHERE id IN ('review-a-1', 'review-a-2', 'review-b-1', 'review-b-2');
DELETE FROM public.tenant_users WHERE tenant_id IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222');
DELETE FROM public.profiles WHERE id IN ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'cccccccc-cccc-cccc-cccc-cccccccccccc');
DELETE FROM auth.users WHERE id IN ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'cccccccc-cccc-cccc-cccc-cccccccccccc');
DELETE FROM public.tenants WHERE id IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222');

SELECT 'All tests completed!' as final_status;
