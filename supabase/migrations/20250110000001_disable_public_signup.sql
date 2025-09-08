-- Disable public signup and configure invite-only authentication
-- This migration configures Supabase for invite-only authentication

-- Update auth configuration to disable public signup
-- Note: This requires Supabase Dashboard configuration changes
-- The following settings should be applied in Supabase Dashboard > Authentication > Settings:

-- 1. Disable "Enable email confirmations" (we'll handle this in our app)
-- 2. Disable "Enable phone confirmations" 
-- 3. Set "Site URL" to your production domain
-- 4. Set "Redirect URLs" to include your accept-invitation page
-- 5. Disable "Enable sign ups" (this is the key setting for invite-only)

-- Create a function to check if signup is allowed (invite-only)
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

-- Create a function to validate signup attempt
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

-- Create trigger to validate signup attempts
-- Note: This trigger will prevent unauthorized signups even if public signup is enabled
CREATE TRIGGER validate_signup_before_insert
  BEFORE INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.validate_signup_attempt();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.is_signup_allowed(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.validate_signup_attempt() TO anon, authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION public.is_signup_allowed(TEXT) IS 'Checks if email has valid invitation for signup';
COMMENT ON FUNCTION public.validate_signup_attempt() IS 'Validates signup attempts against invitation system';
