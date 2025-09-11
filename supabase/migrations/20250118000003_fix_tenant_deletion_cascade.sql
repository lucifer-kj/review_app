-- Fix Tenant Deletion Cascade Constraints
-- Date: January 18, 2025
-- Purpose: Ensure proper cascade deletion when tenants are deleted

-- ============================================================================
-- 1. UPDATE TENANT DELETION CONSTRAINTS
-- ============================================================================

-- Update profiles table to set tenant_id to NULL when tenant is deleted
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_tenant_id_fkey;

ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_tenant_id_fkey 
FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE SET NULL;

-- ============================================================================
-- 2. VERIFY ALL CONSTRAINTS
-- ============================================================================

-- Check all foreign key constraints
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
    AND tc.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
    ON tc.constraint_name = rc.constraint_name
    AND tc.table_schema = rc.constraint_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_schema = 'public'
    AND (ccu.table_name IN ('users', 'tenants') OR tc.table_name IN ('tenant_users', 'profiles', 'tenants', 'business_settings', 'reviews', 'audit_logs', 'usage_metrics'))
ORDER BY tc.table_name, tc.constraint_name;

-- ============================================================================
-- 3. ADD COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON CONSTRAINT profiles_tenant_id_fkey ON public.profiles IS 'Sets tenant_id to NULL when tenant is deleted';
