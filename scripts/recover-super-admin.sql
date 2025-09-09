-- ============================================================================
-- SUPER ADMIN RECOVERY SCRIPT
-- ============================================================================
-- This script helps recover super admin access when the profile is missing
-- Run this in the Supabase SQL Editor

-- Step 1: Check if profiles table exists and has data
SELECT 
  'profiles_table_check' as step,
  COUNT(*) as total_profiles,
  COUNT(CASE WHEN role = 'super_admin' THEN 1 END) as super_admin_count
FROM public.profiles;

-- Step 2: Check auth.users for your email
SELECT 
  'auth_users_check' as step,
  id,
  email,
  created_at,
  email_confirmed_at
FROM auth.users 
WHERE email = '321arifali@gmail.com';

-- Step 3: Check if your profile exists
SELECT 
  'profile_check' as step,
  id,
  email,
  role,
  tenant_id,
  created_at
FROM public.profiles 
WHERE email = '321arifali@gmail.com';

-- Step 4: Create or update your profile as super_admin
-- Replace 'YOUR_USER_ID_HERE' with the actual user ID from Step 2
INSERT INTO public.profiles (
  id,
  email,
  full_name,
  role,
  tenant_id,
  created_at,
  updated_at
)
VALUES (
  (SELECT id FROM auth.users WHERE email = '321arifali@gmail.com' LIMIT 1),
  '321arifali@gmail.com',
  'Super Admin',
  'super_admin',
  NULL, -- Super admin doesn't need tenant_id
  NOW(),
  NOW()
)
ON CONFLICT (id) 
DO UPDATE SET 
  role = 'super_admin',
  updated_at = NOW();

-- Step 5: Verify the profile was created/updated
SELECT 
  'final_verification' as step,
  id,
  email,
  role,
  tenant_id,
  created_at,
  updated_at
FROM public.profiles 
WHERE email = '321arifali@gmail.com';

-- Step 6: Test the get_current_tenant_id function
SELECT 
  'function_test' as step,
  public.get_current_tenant_id() as current_tenant_id;

-- Step 7: Test the is_super_admin function
SELECT 
  'super_admin_test' as step,
  public.is_super_admin((SELECT id FROM auth.users WHERE email = '321arifali@gmail.com' LIMIT 1)) as is_super_admin;
