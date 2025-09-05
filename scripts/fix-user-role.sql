-- Fix user role for master dashboard access
-- Replace 'your-email@example.com' with your actual email address

-- First, check if the user exists in profiles table
SELECT 
  p.id,
  p.role,
  au.email,
  p.created_at
FROM profiles p
JOIN auth.users au ON au.id = p.id
WHERE au.email = 'your-email@example.com';

-- If the user doesn't exist in profiles table, create them
-- Replace 'your-user-id' with the actual user ID from the query above
INSERT INTO profiles (id, role, created_at, updated_at)
SELECT 
  au.id,
  'super_admin',
  NOW(),
  NOW()
FROM auth.users au
WHERE au.email = 'your-email@example.com'
AND NOT EXISTS (
  SELECT 1 FROM profiles p WHERE p.id = au.id
);

-- If the user exists but has wrong role, update it
UPDATE profiles 
SET 
  role = 'super_admin',
  updated_at = NOW()
WHERE id IN (
  SELECT au.id 
  FROM auth.users au 
  WHERE au.email = 'your-email@example.com'
);

-- Verify the fix
SELECT 
  p.id,
  p.role,
  au.email,
  p.created_at,
  p.updated_at
FROM profiles p
JOIN auth.users au ON au.id = p.id
WHERE au.email = 'your-email@example.com';
