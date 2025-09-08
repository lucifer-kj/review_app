-- Simplified Magic Link User Creation Trigger
-- This trigger handles user creation from Supabase's magic link system
-- Much simpler than the complex invitation system

-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create simplified function for magic link user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert profile with metadata from Supabase Auth
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
    COALESCE(NEW.raw_user_meta_data->>'role', 'user'),
    CASE 
      WHEN NEW.raw_user_meta_data->>'tenant_id' IS NOT NULL 
      THEN (NEW.raw_user_meta_data->>'tenant_id')::UUID
      ELSE NULL
    END,
    NOW(),
    NOW()
  );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't prevent user creation in auth.users
    RAISE WARNING 'Error creating profile for user %: %', NEW.email, SQLERRM;
    
    -- Attempt to create a minimal profile to ensure the user has a basic entry
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
      'user', -- Default role
      NULL,   -- No tenant_id if profile creation failed
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO NOTHING; -- In case a profile was partially created

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.profiles TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.tenants TO postgres, anon, authenticated, service_role;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_tenant_id ON public.profiles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Add comments for documentation
COMMENT ON FUNCTION public.handle_new_user() IS 'Creates user profile when new user is created via Supabase Auth magic link';
COMMENT ON TRIGGER on_auth_user_created ON auth.users IS 'Triggers profile creation for new users';
