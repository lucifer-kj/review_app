-- SIMPLE RLS FIX - Run this if the main migration fails
-- This is a minimal fix that only addresses the core issues

-- Step 1: Drop conflicting policies (safe - only if they exist)
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can insert reviews" ON public.reviews;
DROP POLICY IF EXISTS "Authenticated users can view reviews" ON public.reviews;
DROP POLICY IF EXISTS "Authenticated users can update reviews" ON public.reviews;

-- Step 2: Update existing profiles to use new role system
UPDATE public.profiles 
SET role = CASE 
  WHEN role = 'admin' THEN 'super_admin'
  WHEN role = 'staff' THEN 'user'
  ELSE 'user'
END
WHERE role IN ('admin', 'staff');

-- Step 3: Add missing columns to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;

-- Step 4: Update role constraint
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('super_admin', 'tenant_admin', 'user'));

-- Step 5: Create essential RLS policies for profiles
CREATE POLICY "super_admin_profiles" ON public.profiles
  FOR ALL USING (public.is_super_admin(auth.uid()));

CREATE POLICY "users_own_profile" ON public.profiles
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "users_update_own_profile" ON public.profiles
  FOR UPDATE USING (id = auth.uid());

-- Step 6: Create default super admin if none exists
DO $$
DECLARE
    first_user_id UUID;
BEGIN
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
END $$;
