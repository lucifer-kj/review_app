-- Fix Role Consistency Between Database and Code
-- This migration ensures all role constraints match the code expectations

-- First, update any existing profiles with incorrect roles
UPDATE public.profiles 
SET role = 'user' 
WHERE role NOT IN ('super_admin', 'tenant_admin', 'user');

-- Update the role constraint to match code expectations
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('super_admin', 'tenant_admin', 'user'));

-- Update the default role to match code expectations
ALTER TABLE public.profiles 
ALTER COLUMN role SET DEFAULT 'user';

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.role IS 'User role: super_admin (platform admin), tenant_admin (tenant admin), user (regular user)';

-- Verify the constraint is working
DO $$
BEGIN
  -- Test that valid roles are accepted
  BEGIN
    INSERT INTO public.profiles (id, email, role) 
    VALUES (gen_random_uuid(), 'test@example.com', 'super_admin');
    DELETE FROM public.profiles WHERE email = 'test@example.com';
  EXCEPTION
    WHEN OTHERS THEN
      RAISE EXCEPTION 'Valid role super_admin was rejected: %', SQLERRM;
  END;

  BEGIN
    INSERT INTO public.profiles (id, email, role) 
    VALUES (gen_random_uuid(), 'test@example.com', 'tenant_admin');
    DELETE FROM public.profiles WHERE email = 'test@example.com';
  EXCEPTION
    WHEN OTHERS THEN
      RAISE EXCEPTION 'Valid role tenant_admin was rejected: %', SQLERRM;
  END;

  BEGIN
    INSERT INTO public.profiles (id, email, role) 
    VALUES (gen_random_uuid(), 'test@example.com', 'user');
    DELETE FROM public.profiles WHERE email = 'test@example.com';
  EXCEPTION
    WHEN OTHERS THEN
      RAISE EXCEPTION 'Valid role user was rejected: %', SQLERRM;
  END;

  -- Test that invalid roles are rejected
  BEGIN
    INSERT INTO public.profiles (id, email, role) 
    VALUES (gen_random_uuid(), 'test@example.com', 'admin');
    RAISE EXCEPTION 'Invalid role admin was accepted, but should have been rejected';
  EXCEPTION
    WHEN check_violation THEN
      -- This is expected, continue
      NULL;
    WHEN OTHERS THEN
      RAISE EXCEPTION 'Unexpected error testing invalid role: %', SQLERRM;
  END;

  BEGIN
    INSERT INTO public.profiles (id, email, role) 
    VALUES (gen_random_uuid(), 'test@example.com', 'staff');
    RAISE EXCEPTION 'Invalid role staff was accepted, but should have been rejected';
  EXCEPTION
    WHEN check_violation THEN
      -- This is expected, continue
      NULL;
    WHEN OTHERS THEN
      RAISE EXCEPTION 'Unexpected error testing invalid role: %', SQLERRM;
  END;

  RAISE NOTICE 'Role consistency fix completed successfully';
END $$;
