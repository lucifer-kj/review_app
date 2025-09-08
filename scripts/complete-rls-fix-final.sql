-- Complete RLS Fix - Final Version
-- This script properly handles existing policies and functions

-- ============================================================================
-- DROP EXISTING FUNCTIONS FIRST
-- ============================================================================

-- Drop existing functions to avoid parameter conflicts
DROP FUNCTION IF EXISTS public.is_signup_allowed(TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.validate_signup_attempt() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.get_current_tenant_id() CASCADE;
DROP FUNCTION IF EXISTS public.is_super_admin(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.is_tenant_admin(UUID, UUID) CASCADE;

-- ============================================================================
-- DROP EXISTING POLICIES
-- ============================================================================

-- Drop existing policies to avoid conflicts
DO $$ 
BEGIN
    -- Drop profiles policies
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'super_admin_profiles') THEN
        DROP POLICY "super_admin_profiles" ON public.profiles;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'tenant_admin_profiles') THEN
        DROP POLICY "tenant_admin_profiles" ON public.profiles;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'users_own_profile') THEN
        DROP POLICY "users_own_profile" ON public.profiles;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'users_update_own_profile') THEN
        DROP POLICY "users_update_own_profile" ON public.profiles;
    END IF;
    
    -- Drop tenants policies
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tenants' AND policyname = 'super_admin_tenants') THEN
        DROP POLICY "super_admin_tenants" ON public.tenants;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tenants' AND policyname = 'tenant_admin_own_tenant') THEN
        DROP POLICY "tenant_admin_own_tenant" ON public.tenants;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tenants' AND policyname = 'tenant_admin_update_own_tenant') THEN
        DROP POLICY "tenant_admin_update_own_tenant" ON public.tenants;
    END IF;
    
    -- Drop user_invitations policies
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_invitations' AND policyname = 'super_admin_invitations') THEN
        DROP POLICY "super_admin_invitations" ON public.user_invitations;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_invitations' AND policyname = 'tenant_admin_invitations') THEN
        DROP POLICY "tenant_admin_invitations" ON public.user_invitations;
    END IF;
    
    -- Drop reviews policies
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'reviews' AND policyname = 'super_admin_reviews') THEN
        DROP POLICY "super_admin_reviews" ON public.reviews;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'reviews' AND policyname = 'tenant_reviews') THEN
        DROP POLICY "tenant_reviews" ON public.reviews;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'reviews' AND policyname = 'anonymous_review_insert') THEN
        DROP POLICY "anonymous_review_insert" ON public.reviews;
    END IF;
    
    -- Drop business_settings policies
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'business_settings' AND policyname = 'super_admin_business_settings') THEN
        DROP POLICY "super_admin_business_settings" ON public.business_settings;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'business_settings' AND policyname = 'tenant_business_settings') THEN
        DROP POLICY "tenant_business_settings" ON public.business_settings;
    END IF;
END $$;

-- ============================================================================
-- CREATE MISSING FUNCTIONS
-- ============================================================================

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

-- Create the handle_new_user function
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

-- Create the get_current_tenant_id function
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

-- Create the is_super_admin function
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

-- Create the is_tenant_admin function
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

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT EXECUTE ON FUNCTION public.is_signup_allowed(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.validate_signup_attempt() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_tenant_id() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_super_admin(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_tenant_admin(UUID, UUID) TO anon, authenticated;

-- ============================================================================
-- CREATE TRIGGERS
-- ============================================================================

-- Create signup validation trigger
DROP TRIGGER IF EXISTS validate_signup_before_insert ON auth.users;
CREATE TRIGGER validate_signup_before_insert
  BEFORE INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.validate_signup_attempt();

-- Create new user profile trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- CREATE RLS POLICIES
-- ============================================================================

-- Profiles policies
CREATE POLICY "super_admin_profiles" ON public.profiles
  FOR ALL USING (public.is_super_admin(auth.uid()));

CREATE POLICY "tenant_admin_profiles" ON public.profiles
  FOR ALL USING (
    tenant_id = public.get_current_tenant_id() AND
    public.is_tenant_admin(auth.uid(), tenant_id)
  );

CREATE POLICY "users_own_profile" ON public.profiles
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "users_update_own_profile" ON public.profiles
  FOR UPDATE USING (id = auth.uid());

-- Tenant policies (if tenants table exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tenants' AND table_schema = 'public') THEN
        CREATE POLICY "super_admin_tenants" ON public.tenants
          FOR ALL USING (public.is_super_admin(auth.uid()));

        CREATE POLICY "tenant_admin_own_tenant" ON public.tenants
          FOR SELECT USING (
            public.is_tenant_admin(auth.uid(), id)
          );

        CREATE POLICY "tenant_admin_update_own_tenant" ON public.tenants
          FOR UPDATE USING (
            public.is_tenant_admin(auth.uid(), id)
          );
    END IF;
END $$;

-- User invitation policies (if user_invitations table exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_invitations' AND table_schema = 'public') THEN
        CREATE POLICY "super_admin_invitations" ON public.user_invitations
          FOR ALL USING (public.is_super_admin(auth.uid()));

        CREATE POLICY "tenant_admin_invitations" ON public.user_invitations
          FOR ALL USING (
            tenant_id = public.get_current_tenant_id() AND
            public.is_tenant_admin(auth.uid(), tenant_id)
          );
    END IF;
END $$;

-- Reviews policies (if reviews table exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reviews' AND table_schema = 'public') THEN
        CREATE POLICY "super_admin_reviews" ON public.reviews
          FOR ALL USING (public.is_super_admin(auth.uid()));

        CREATE POLICY "tenant_reviews" ON public.reviews
          FOR ALL USING (
            tenant_id = public.get_current_tenant_id()
          );

        CREATE POLICY "anonymous_review_insert" ON public.reviews
          FOR INSERT WITH CHECK (true);
    END IF;
END $$;

-- Business settings policies (if business_settings table exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'business_settings' AND table_schema = 'public') THEN
        CREATE POLICY "super_admin_business_settings" ON public.business_settings
          FOR ALL USING (public.is_super_admin(auth.uid()));

        CREATE POLICY "tenant_business_settings" ON public.business_settings
          FOR ALL USING (
            tenant_id = public.get_current_tenant_id()
          );
    END IF;
END $$;

-- ============================================================================
-- ADD COMMENTS
-- ============================================================================

COMMENT ON FUNCTION public.is_signup_allowed(TEXT) IS 'Checks if email has valid invitation for signup';
COMMENT ON FUNCTION public.validate_signup_attempt() IS 'Validates signup attempts against invitation system';
COMMENT ON FUNCTION public.handle_new_user() IS 'Creates profile for new user with invitation data or defaults';
COMMENT ON FUNCTION public.get_current_tenant_id() IS 'Returns current user tenant ID for RLS policies';
COMMENT ON FUNCTION public.is_super_admin(UUID) IS 'Checks if user has super_admin role';
COMMENT ON FUNCTION public.is_tenant_admin(UUID, UUID) IS 'Checks if user is tenant_admin for specific tenant';
