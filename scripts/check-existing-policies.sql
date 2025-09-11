-- Check existing RLS policies that might conflict
-- Run this to see what policies currently exist before running the migration

-- Check policies on tenants table
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual 
FROM pg_policies 
WHERE tablename = 'tenants'
ORDER BY policyname;

-- Check policies on reviews table
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual 
FROM pg_policies 
WHERE tablename = 'reviews'
ORDER BY policyname;

-- Check policies on tenant_users table (if it exists)
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual 
FROM pg_policies 
WHERE tablename = 'tenant_users'
ORDER BY policyname;

-- Check if tenant_users table exists
SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'tenant_users' 
    AND table_schema = 'public'
) as tenant_users_table_exists;

-- Check current columns on tenants table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'tenants' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check current columns on reviews table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'reviews' 
AND table_schema = 'public'
ORDER BY ordinal_position;
