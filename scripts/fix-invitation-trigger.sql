-- Fix invitation signup trigger
-- This script safely replaces the existing trigger with the new invitation-based one

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop existing function if it exists (in case it needs updating)
DROP FUNCTION IF EXISTS handle_invitation_signup();

-- Create the new function to handle user signup with invitation
CREATE OR REPLACE FUNCTION handle_invitation_signup()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert user profile with tenant and role from invitation
  INSERT INTO public.profiles (id, tenant_id, role)
  SELECT 
    NEW.id,
    ui.tenant_id,
    ui.role
  FROM public.user_invitations ui
  WHERE ui.email = NEW.email 
    AND ui.used_at IS NULL 
    AND ui.expires_at > NOW()
  LIMIT 1;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger to automatically create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_invitation_signup();

-- Verify the trigger was created
SELECT 
  trigger_name,
  event_manipulation,
  action_statement,
  action_timing
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';
