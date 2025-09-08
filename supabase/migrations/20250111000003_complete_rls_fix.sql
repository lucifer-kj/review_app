-- Complete RLS Fix - Run this after the missing functions migration
-- This completes the RLS policy setup

-- Step 1: Create the missing functions (run this first)
-- (This should be run from the previous migration file)

-- Step 2: Create essential RLS policies for all tables
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

-- Step 3: Create default super admin if none exists
DO $$
DECLARE
    first_user_id UUID;
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles' AND table_schema = 'public') THEN
        IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE role = 'super_admin') THEN
            SELECT id INTO first_user_id 
            FROM public.profiles 
            ORDER BY created_at ASC 
            LIMIT 1;
            
            IF first_user_id IS NOT NULL THEN
                UPDATE public.profiles 
                SET role = 'super_admin', updated_at = NOW()
                WHERE id = first_user_id;
                
                RAISE NOTICE 'Promoted user % to super_admin', first_user_id;
            END IF;
        END IF;
    END IF;
END $$;
