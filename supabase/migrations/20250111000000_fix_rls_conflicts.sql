-- FIX RLS POLICY CONFLICTS
-- This migration fixes all conflicts between old and new migration files
-- Date: January 11, 2025
-- Purpose: Resolve RLS policy conflicts and ensure clean multi-tenancy

-- ============================================================================
-- STEP 1: DROP ALL CONFLICTING POLICIES AND FUNCTIONS
-- ============================================================================

-- Drop all existing policies to avoid conflicts (only if tables exist)
DO $$ 
BEGIN
    -- Drop profiles policies if profiles table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles' AND table_schema = 'public') THEN
        DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
        DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
    END IF;
    
    -- Drop reviews policies if reviews table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reviews' AND table_schema = 'public') THEN
        DROP POLICY IF EXISTS "Anyone can insert reviews" ON public.reviews;
        DROP POLICY IF EXISTS "Authenticated users can view reviews" ON public.reviews;
        DROP POLICY IF EXISTS "Authenticated users can update reviews" ON public.reviews;
    END IF;
    
    -- Drop invoice policies if invoices table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'invoices' AND table_schema = 'public') THEN
        DROP POLICY IF EXISTS "Authenticated users can view invoices" ON public.invoices;
        DROP POLICY IF EXISTS "Authenticated users can create invoices" ON public.invoices;
        DROP POLICY IF EXISTS "Authenticated users can update invoices" ON public.invoices;
        DROP POLICY IF EXISTS "Authenticated users can delete invoices" ON public.invoices;
    END IF;
END $$;

-- Drop conflicting functions
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.validate_signup_attempt() CASCADE;
DROP TRIGGER IF EXISTS validate_signup_before_insert ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- ============================================================================
-- STEP 2: FIX PROFILES TABLE STRUCTURE
-- ============================================================================

-- Update existing profiles to use new role system (only if profiles table exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles' AND table_schema = 'public') THEN
        UPDATE public.profiles 
        SET role = CASE 
          WHEN role = 'admin' THEN 'super_admin'
          WHEN role = 'staff' THEN 'user'
          ELSE 'user'
        END
        WHERE role IN ('admin', 'staff');
    END IF;
END $$;

-- Add missing columns to profiles table if they don't exist
DO $$ 
BEGIN
  -- Add tenant_id column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'profiles' AND column_name = 'tenant_id') THEN
    ALTER TABLE public.profiles ADD COLUMN tenant_id UUID REFERENCES public.tenants(id);
  END IF;
  
  -- Add email column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'profiles' AND column_name = 'email') THEN
    ALTER TABLE public.profiles ADD COLUMN email TEXT;
  END IF;
  
  -- Add full_name column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'profiles' AND column_name = 'full_name') THEN
    ALTER TABLE public.profiles ADD COLUMN full_name TEXT;
  END IF;
  
  -- Update role constraint to use new values
  ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
  ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
    CHECK (role IN ('super_admin', 'tenant_admin', 'user'));
END $$;

-- ============================================================================
-- STEP 3: RECREATE CLEAN RLS POLICIES
-- ============================================================================

-- Drop all existing policies on all tables
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
                      pol.policyname, pol.schemaname, pol.tablename);
    END LOOP;
END $$;

-- Recreate clean RLS policies for multi-tenancy

-- System settings policies (super admin only)
CREATE POLICY "super_admin_system_settings" ON public.system_settings
  FOR ALL USING (public.is_super_admin(auth.uid()));

-- Tenant policies
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

-- Profile policies (clean, no conflicts)
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

-- User invitation policies
CREATE POLICY "super_admin_invitations" ON public.user_invitations
  FOR ALL USING (public.is_super_admin(auth.uid()));

CREATE POLICY "tenant_admin_invitations" ON public.user_invitations
  FOR ALL USING (
    tenant_id = public.get_current_tenant_id() AND
    public.is_tenant_admin(auth.uid(), tenant_id)
  );

-- Business settings policies
CREATE POLICY "super_admin_business_settings" ON public.business_settings
  FOR ALL USING (public.is_super_admin(auth.uid()));

CREATE POLICY "tenant_business_settings" ON public.business_settings
  FOR ALL USING (
    tenant_id = public.get_current_tenant_id()
  );

-- Review policies
CREATE POLICY "super_admin_reviews" ON public.reviews
  FOR ALL USING (public.is_super_admin(auth.uid()));

CREATE POLICY "tenant_reviews" ON public.reviews
  FOR ALL USING (
    tenant_id = public.get_current_tenant_id()
  );

-- Allow anonymous users to insert reviews
CREATE POLICY "anonymous_review_insert" ON public.reviews
  FOR INSERT WITH CHECK (true);

-- Audit log policies
CREATE POLICY "super_admin_audit_logs" ON public.audit_logs
  FOR ALL USING (public.is_super_admin(auth.uid()));

CREATE POLICY "tenant_audit_logs" ON public.audit_logs
  FOR SELECT USING (
    tenant_id = public.get_current_tenant_id()
  );

-- Usage metrics policies
CREATE POLICY "super_admin_usage_metrics" ON public.usage_metrics
  FOR ALL USING (public.is_super_admin(auth.uid()));

CREATE POLICY "tenant_usage_metrics" ON public.usage_metrics
  FOR SELECT USING (
    tenant_id = public.get_current_tenant_id()
  );

-- ============================================================================
-- STEP 4: RECREATE CLEAN FUNCTIONS
-- ============================================================================

-- Create is_signup_allowed function (required for signup validation)
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

-- Create get_current_tenant_id function (required for RLS policies)
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

-- Create is_super_admin function (required for RLS policies)
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

-- Create is_tenant_admin function (required for RLS policies)
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

-- Clean handle_new_user function
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

-- Clean signup validation function
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

-- ============================================================================
-- STEP 5: RECREATE TRIGGERS
-- ============================================================================

-- Clean trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Clean trigger for signup validation
CREATE TRIGGER validate_signup_before_insert
  BEFORE INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.validate_signup_attempt();

-- ============================================================================
-- STEP 6: GRANT PERMISSIONS
-- ============================================================================

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.is_signup_allowed(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.validate_signup_attempt() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon, authenticated;

-- ============================================================================
-- STEP 7: CREATE DEFAULT SUPER ADMIN (if none exists)
-- ============================================================================

-- Check if any super admin exists, if not, promote first user (only if profiles table exists)
DO $$
DECLARE
    first_user_id UUID;
BEGIN
    -- Only proceed if profiles table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles' AND table_schema = 'public') THEN
        -- Check if any super admin exists
        IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE role = 'super_admin') THEN
            -- Get the first user (oldest by created_at)
            SELECT id INTO first_user_id 
            FROM public.profiles 
            ORDER BY created_at ASC 
            LIMIT 1;
            
            -- Promote to super admin
            IF first_user_id IS NOT NULL THEN
                UPDATE public.profiles 
                SET role = 'super_admin', updated_at = NOW()
                WHERE id = first_user_id;
                
                RAISE NOTICE 'Promoted user % to super_admin', first_user_id;
            END IF;
        END IF;
    END IF;
END $$;

-- Add comments for documentation
COMMENT ON FUNCTION public.handle_new_user() IS 'Creates profile for new user with invitation data or defaults';
COMMENT ON FUNCTION public.validate_signup_attempt() IS 'Validates signup attempts against invitation system';
COMMENT ON FUNCTION public.get_current_tenant_id() IS 'Returns current user tenant ID for RLS policies';
COMMENT ON FUNCTION public.is_super_admin(UUID) IS 'Checks if user has super_admin role';
COMMENT ON FUNCTION public.is_tenant_admin(UUID, UUID) IS 'Checks if user is tenant_admin for specific tenant';
