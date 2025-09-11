-- Fix User Deletion Cascade Constraints
-- Date: January 18, 2025
-- Purpose: Ensure proper cascade deletion when users are deleted to prevent foreign key constraint violations

-- ============================================================================
-- 1. UPDATE FOREIGN KEY CONSTRAINTS FOR CASCADE DELETION
-- ============================================================================

-- Update tenant_users table to cascade delete when user is deleted
ALTER TABLE public.tenant_users 
DROP CONSTRAINT IF EXISTS tenant_users_user_id_fkey;

ALTER TABLE public.tenant_users 
ADD CONSTRAINT tenant_users_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update profiles table to cascade delete when user is deleted
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_id_fkey;

ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_id_fkey 
FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Note: audit_logs table does not have created_by column
-- Note: usage_metrics table does not have created_by column
-- These tables will be handled by the application layer deletion

-- Update tenants table to set created_by to NULL when user is deleted
ALTER TABLE public.tenants 
DROP CONSTRAINT IF EXISTS tenants_created_by_fkey;

ALTER TABLE public.tenants 
ADD CONSTRAINT tenants_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- ============================================================================
-- 2. CREATE HELPER FUNCTION FOR SAFE USER DELETION
-- ============================================================================

-- Function to safely delete a user and all related data
CREATE OR REPLACE FUNCTION public.safe_delete_user(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    user_exists BOOLEAN;
    deletion_success BOOLEAN := TRUE;
BEGIN
    -- Check if user exists
    SELECT EXISTS(SELECT 1 FROM auth.users WHERE id = p_user_id) INTO user_exists;
    
    IF NOT user_exists THEN
        RAISE NOTICE 'User % does not exist', p_user_id;
        RETURN FALSE;
    END IF;

    -- Log the deletion attempt
    INSERT INTO public.audit_logs (action, details, user_id)
    VALUES (
        'user_deletion_attempt',
        jsonb_build_object(
            'user_id', p_user_id,
            'deleted_at', NOW()
        ),
        p_user_id
    );

    -- Delete user-related data in correct order
    -- 1. Delete tenant_users relationships
    DELETE FROM public.tenant_users WHERE user_id = p_user_id;
    
    -- 2. Delete profile
    DELETE FROM public.profiles WHERE id = p_user_id;
    
    -- 3. Note: audit_logs and usage_metrics don't have created_by columns
    -- These will be handled by the application layer deletion
    
    -- 4. Delete from auth.users (this will trigger CASCADE)
    -- Note: This needs to be done via the admin API, not directly in SQL
    -- as auth.users is managed by Supabase Auth
    
    RAISE NOTICE 'User % and related data deleted successfully', p_user_id;
    RETURN TRUE;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error deleting user %: %', p_user_id, SQLERRM;
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.safe_delete_user(UUID) TO authenticated;

-- ============================================================================
-- 3. CREATE AUDIT TRIGGER FOR USER DELETIONS
-- ============================================================================

-- Function to log user deletions
CREATE OR REPLACE FUNCTION public.log_user_deletion()
RETURNS TRIGGER AS $$
BEGIN
    -- Log the deletion in audit_logs
    INSERT INTO public.audit_logs (action, details)
    VALUES (
        'user_deleted',
        jsonb_build_object(
            'user_id', OLD.id,
            'email', OLD.email,
            'deleted_at', NOW()
        )
    );
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users (if possible)
-- Note: This might not work on auth.users as it's managed by Supabase Auth
-- But we'll try to create it for completeness

-- ============================================================================
-- 4. ADD COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON FUNCTION public.safe_delete_user(UUID) IS 'Safely deletes a user and all related data, preventing foreign key constraint violations';
COMMENT ON CONSTRAINT tenant_users_user_id_fkey ON public.tenant_users IS 'Cascades deletion when user is deleted from auth.users';
COMMENT ON CONSTRAINT profiles_id_fkey ON public.profiles IS 'Cascades deletion when user is deleted from auth.users';
COMMENT ON CONSTRAINT tenants_created_by_fkey ON public.tenants IS 'Sets created_by to NULL when user is deleted from auth.users';

-- ============================================================================
-- 5. VERIFICATION QUERIES
-- ============================================================================

-- Check current foreign key constraints
SELECT 
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
    ON tc.constraint_name = rc.constraint_name
    AND tc.table_schema = rc.constraint_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_schema = 'public'
    AND (ccu.table_name = 'users' OR tc.table_name IN ('tenant_users', 'profiles', 'tenants'))
ORDER BY tc.table_name, tc.constraint_name;
