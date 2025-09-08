-- Fix handle_new_user() function to properly handle invitation-based signups
-- This ensures users created via invitations get the correct tenant_id and role

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Try to find an invitation for this user's email
  INSERT INTO public.profiles (
    id, 
    email, 
    full_name, 
    role, 
    tenant_id,
    created_at,
    updated_at
  )
  SELECT 
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user'),
    COALESCE((NEW.raw_user_meta_data->>'tenant_id')::uuid, NULL),
    NOW(),
    NOW()
  FROM public.user_invitations ui
  WHERE ui.email = NEW.email 
    AND ui.used_at IS NULL 
    AND ui.expires_at > NOW()
  LIMIT 1;

  -- If no invitation was found (user created profile directly), create a default profile
  -- This handles cases where users might sign up through other means
  IF NOT FOUND THEN
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
      'user', -- Default role for non-invitation signups
      NULL,  -- No tenant_id for non-invitation signups
      NOW(),
      NOW()
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon, authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION public.handle_new_user() IS 'Creates user profile on signup, handling both invitation-based and direct signups with proper tenant_id and role assignment';
