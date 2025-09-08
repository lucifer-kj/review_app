-- Fix user creation trigger for invitation system
-- This migration fixes the handle_new_user trigger to properly handle invitations

-- Drop the existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Create a robust handle_new_user function that handles invitations properly
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  invitation_record RECORD;
  user_tenant_id UUID;
  user_role TEXT;
BEGIN
  -- Try to find an invitation for this user's email
  SELECT ui.tenant_id, ui.role
  INTO invitation_record
  FROM public.user_invitations ui
  WHERE ui.email = NEW.email 
    AND ui.used_at IS NULL 
    AND ui.expires_at > NOW()
  LIMIT 1;

  -- Set tenant_id and role based on invitation or defaults
  IF invitation_record IS NOT NULL THEN
    user_tenant_id := invitation_record.tenant_id;
    user_role := invitation_record.role;
    
    -- Mark invitation as used
    UPDATE public.user_invitations 
    SET used_at = NOW()
    WHERE email = NEW.email 
      AND used_at IS NULL 
      AND expires_at > NOW();
  ELSE
    -- No invitation found, use defaults
    user_tenant_id := NULL;
    user_role := 'user';
  END IF;

  -- Create the profile record
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
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    user_role,
    user_tenant_id,
    NOW(),
    NOW()
  );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE WARNING 'Error creating profile for user %: %', NEW.email, SQLERRM;
    
    -- Create a minimal profile to prevent complete failure
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
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
      'user',
      NULL,
      NOW(),
      NOW()
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon, authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION public.handle_new_user() IS 'Creates user profile on signup with proper tenant assignment from invitations';
