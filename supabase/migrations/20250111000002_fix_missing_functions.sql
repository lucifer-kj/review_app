-- Fix Missing Functions
-- This migration creates the missing functions that are referenced in the RLS fix

-- Create the is_signup_allowed function
CREATE OR REPLACE FUNCTION public.is_signup_allowed(email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if there's a valid invitation for this email
  RETURN EXISTS (
    SELECT 1 
    FROM public.user_invitations 
    WHERE user_invitations.email = email 
      AND used_at IS NULL 
      AND expires_at > NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the validate_signup_attempt function
CREATE OR REPLACE FUNCTION public.validate_signup_attempt()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if signup is allowed for this email
  IF NOT public.is_signup_allowed(NEW.email) THEN
    RAISE EXCEPTION 'Signup not allowed. Please use a valid invitation link.';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the handle_new_user function (if it doesn't exist)
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

  -- If no invitation was found, create a default profile
  IF NOT FOUND THEN
    INSERT INTO public.profiles (
      id, 
      email, 
      full_name, 
      role, 
      tenant_id,
      created_at,
      updated_at
    ) VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
      'user',
      NULL,
      NOW(),
      NOW()
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the get_current_tenant_id function (if it doesn't exist)
CREATE OR REPLACE FUNCTION public.get_current_tenant_id()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT tenant_id 
    FROM public.profiles 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the is_super_admin function (if it doesn't exist)
CREATE OR REPLACE FUNCTION public.is_super_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT role = 'super_admin' 
    FROM public.profiles 
    WHERE id = user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the is_tenant_admin function (if it doesn't exist)
CREATE OR REPLACE FUNCTION public.is_tenant_admin(user_id UUID, tenant_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT role = 'tenant_admin' AND profiles.tenant_id = tenant_id
    FROM public.profiles 
    WHERE id = user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.is_signup_allowed(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.validate_signup_attempt() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_tenant_id() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_super_admin(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_tenant_admin(UUID, UUID) TO anon, authenticated;

-- Create triggers (if they don't exist)
DROP TRIGGER IF EXISTS validate_signup_before_insert ON auth.users;
CREATE TRIGGER validate_signup_before_insert
  BEFORE INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.validate_signup_attempt();

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add comments for documentation
COMMENT ON FUNCTION public.is_signup_allowed(TEXT) IS 'Checks if email has valid invitation for signup';
COMMENT ON FUNCTION public.validate_signup_attempt() IS 'Validates signup attempts against invitation system';
COMMENT ON FUNCTION public.handle_new_user() IS 'Creates profile for new user with invitation data or defaults';
COMMENT ON FUNCTION public.get_current_tenant_id() IS 'Returns current user tenant ID for RLS policies';
COMMENT ON FUNCTION public.is_super_admin(UUID) IS 'Checks if user has super_admin role';
COMMENT ON FUNCTION public.is_tenant_admin(UUID, UUID) IS 'Checks if user is tenant_admin for specific tenant';
