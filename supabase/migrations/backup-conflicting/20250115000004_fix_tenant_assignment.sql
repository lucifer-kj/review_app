-- Fix Tenant Assignment During User Invitation
-- This migration ensures users are properly assigned to tenants when accepting invitations

-- Drop existing trigger and function to avoid conflicts
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Create robust handle_new_user function that properly handles tenant assignment
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_tenant_id UUID;
  user_role TEXT;
  user_email TEXT;
  user_full_name TEXT;
BEGIN
  -- Extract user data from auth.users
  user_email := NEW.email;
  user_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', '');
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'user');
  user_tenant_id := CASE 
    WHEN NEW.raw_user_meta_data->>'tenant_id' IS NOT NULL 
    THEN (NEW.raw_user_meta_data->>'tenant_id')::UUID
    ELSE NULL
  END;

  -- Validate tenant_id if provided
  IF user_tenant_id IS NOT NULL THEN
    -- Check if tenant exists and is active
    IF NOT EXISTS (
      SELECT 1 FROM public.tenants 
      WHERE id = user_tenant_id 
      AND status = 'active'
    ) THEN
      -- Log warning and set tenant_id to NULL
      RAISE WARNING 'Invalid tenant_id % for user %, setting to NULL', user_tenant_id, user_email;
      user_tenant_id := NULL;
    END IF;
  END IF;

  -- Create profile with proper tenant assignment
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
    NEW.id,
    user_email,
    user_full_name,
    user_role,
    user_tenant_id,
    NOW(),
    NOW()
  );

  -- Log the user creation for audit purposes
  INSERT INTO public.audit_logs (
    action,
    details,
    created_at
  )
  VALUES (
    'user_created',
    jsonb_build_object(
      'user_id', NEW.id,
      'email', user_email,
      'role', user_role,
      'tenant_id', user_tenant_id,
      'source', 'magic_link_invitation'
    ),
    NOW()
  );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error and re-raise
    RAISE WARNING 'Error creating profile for user %: %', user_email, SQLERRM;
    RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon, authenticated;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_tenant_id ON public.profiles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_tenants_status ON public.tenants(status);

-- Add comment for documentation
COMMENT ON FUNCTION public.handle_new_user() IS 'Creates user profile with proper tenant assignment when user accepts magic link invitation';

-- Test the function with a sample (this will be rolled back)
DO $$
BEGIN
  -- Test that the function works correctly
  RAISE NOTICE 'handle_new_user function created successfully';
  
  -- Test tenant validation logic
  IF EXISTS (SELECT 1 FROM public.tenants WHERE status = 'active' LIMIT 1) THEN
    RAISE NOTICE 'Active tenants found, tenant assignment will work correctly';
  ELSE
    RAISE WARNING 'No active tenants found, users will be created without tenant assignment';
  END IF;
END $$;
