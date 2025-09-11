-- Cleanup script to remove conflicting RLS policies
-- Run this BEFORE running the main migration

-- Drop all existing policies on tenants table
DO $$ 
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'tenants' AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON public.tenants';
        RAISE NOTICE 'Dropped policy: % on tenants table', policy_record.policyname;
    END LOOP;
END $$;

-- Drop all existing policies on reviews table
DO $$ 
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'reviews' AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON public.reviews';
        RAISE NOTICE 'Dropped policy: % on reviews table', policy_record.policyname;
    END LOOP;
END $$;

-- Drop all existing policies on tenant_users table (if it exists)
DO $$ 
DECLARE
    policy_record RECORD;
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tenant_users' AND table_schema = 'public') THEN
        FOR policy_record IN 
            SELECT policyname 
            FROM pg_policies 
            WHERE tablename = 'tenant_users' AND schemaname = 'public'
        LOOP
            EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON public.tenant_users';
            RAISE NOTICE 'Dropped policy: % on tenant_users table', policy_record.policyname;
        END LOOP;
    ELSE
        RAISE NOTICE 'tenant_users table does not exist, skipping policy cleanup';
    END IF;
END $$;

-- Show remaining policies
SELECT 'Remaining policies after cleanup:' as status;
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('tenants', 'reviews', 'tenant_users')
ORDER BY tablename, policyname;
