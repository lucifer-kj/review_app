-- Promote Users to Super Admin
-- Use this script to manually promote users to super_admin role

-- ============================================================================
-- OPTION 1: Promote specific users by email
-- ============================================================================

-- Replace 'user@example.com' with the actual email addresses you want to promote
UPDATE public.profiles 
SET role = 'super_admin', updated_at = NOW()
WHERE email IN (
  'user1@example.com',
  'user2@example.com',
  'user3@example.com'
  -- Add more emails as needed
);

-- ============================================================================
-- OPTION 2: Promote users by their profile ID
-- ============================================================================

-- Replace the UUIDs with actual user IDs you want to promote
UPDATE public.profiles 
SET role = 'super_admin', updated_at = NOW()
WHERE id IN (
  '12345678-1234-1234-1234-123456789012',
  '87654321-4321-4321-4321-210987654321'
  -- Add more UUIDs as needed
);

-- ============================================================================
-- OPTION 3: Promote the first N users (oldest by created_at)
-- ============================================================================

-- This will promote the first 3 users to super_admin
WITH first_users AS (
  SELECT id 
  FROM public.profiles 
  ORDER BY created_at ASC 
  LIMIT 3
)
UPDATE public.profiles 
SET role = 'super_admin', updated_at = NOW()
WHERE id IN (SELECT id FROM first_users);

-- ============================================================================
-- OPTION 4: Promote all users with 'admin' role to 'super_admin'
-- ============================================================================

UPDATE public.profiles 
SET role = 'super_admin', updated_at = NOW()
WHERE role = 'admin';

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check current super admins
SELECT 
  id,
  email,
  role,
  created_at,
  updated_at
FROM public.profiles 
WHERE role = 'super_admin'
ORDER BY created_at ASC;

-- Check all users and their roles
SELECT 
  id,
  email,
  role,
  tenant_id,
  created_at
FROM public.profiles 
ORDER BY created_at ASC;

-- Count users by role
SELECT 
  role,
  COUNT(*) as count
FROM public.profiles 
GROUP BY role
ORDER BY count DESC;
