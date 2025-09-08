-- Apply Platform Migrations Script
-- Run this in Supabase SQL Editor to apply all new platform features

-- =====================================================
-- 1. CREATE PLATFORM ANALYTICS FUNCTION
-- =====================================================

-- Drop existing function if it exists with different signature
DROP FUNCTION IF EXISTS get_platform_analytics();

-- Create new function with updated signature
CREATE FUNCTION get_platform_analytics()
RETURNS TABLE (
  total_tenants BIGINT,
  active_tenants BIGINT,
  total_users BIGINT,
  total_reviews BIGINT,
  reviews_this_month BIGINT,
  reviews_last_month BIGINT,
  average_rating NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    -- Total tenants count
    COUNT(DISTINCT t.id) as total_tenants,

    -- Active tenants count (status = 'active')
    COUNT(DISTINCT CASE WHEN t.status = 'active' THEN t.id END) as active_tenants,

    -- Total users across all tenants
    COUNT(DISTINCT p.id) as total_users,

    -- Total reviews across all tenants
    COUNT(DISTINCT r.id) as total_reviews,

    -- Reviews this month
    COUNT(DISTINCT CASE
      WHEN r.created_at >= date_trunc('month', CURRENT_DATE)
      THEN r.id
    END) as reviews_this_month,

    -- Reviews last month
    COUNT(DISTINCT CASE
      WHEN r.created_at >= date_trunc('month', CURRENT_DATE - INTERVAL '1 month')
      AND r.created_at < date_trunc('month', CURRENT_DATE)
      THEN r.id
    END) as reviews_last_month,

    -- Average rating across all reviews
    COALESCE(AVG(r.rating), 0) as average_rating

  FROM tenants t
  LEFT JOIN profiles p ON p.tenant_id = t.id
  LEFT JOIN reviews r ON r.tenant_id = t.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_platform_analytics() TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION get_platform_analytics() IS 'Returns comprehensive platform analytics for super admin dashboard';

-- =====================================================
-- 2. ADD TENANT REVIEW FORM URL SUPPORT
-- =====================================================

-- Add review_form_url column to tenants table
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS review_form_url TEXT;

-- Ensure tenant_id column exists in reviews table
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_reviews_tenant_id ON reviews(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenants_review_form_url ON tenants(review_form_url);

-- Update RLS policies for tenant-specific review forms
DROP POLICY IF EXISTS "tenant_review_access" ON reviews;
CREATE POLICY "tenant_review_access" ON reviews
  FOR ALL TO authenticated
  USING (tenant_id = get_current_tenant_id());

-- Grant permissions
GRANT ALL ON reviews TO authenticated;
GRANT ALL ON tenants TO authenticated;

-- Add comments for documentation
COMMENT ON COLUMN tenants.review_form_url IS 'Unique URL for tenant-specific review form';
COMMENT ON COLUMN reviews.tenant_id IS 'Tenant ID for multi-tenant isolation';

-- Update existing tenants to have review form URLs if they don't exist
-- Note: Replace 'https://your-domain.com' with your actual domain
UPDATE tenants
SET review_form_url = CONCAT('https://your-domain.com/review/', id)
WHERE review_form_url IS NULL;

-- =====================================================
-- 3. VERIFICATION QUERIES
-- =====================================================

-- Verify the platform analytics function works
SELECT * FROM get_platform_analytics();

-- Check that tenants have review form URLs
SELECT id, name, review_form_url FROM tenants LIMIT 5;

-- Check that reviews table has tenant_id column
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'reviews' AND column_name = 'tenant_id';

-- Check that RLS policies are in place
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'reviews' AND policyname = 'tenant_review_access';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'Platform migrations completed successfully!';
    RAISE NOTICE 'Functions created: get_platform_analytics()';
    RAISE NOTICE 'Columns added: tenants.review_form_url, reviews.tenant_id';
    RAISE NOTICE 'Indexes created: idx_reviews_tenant_id, idx_tenants_review_form_url';
    RAISE NOTICE 'RLS policies updated for tenant isolation';
END $$;
