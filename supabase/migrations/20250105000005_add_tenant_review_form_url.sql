-- Add Tenant-Specific Review Forms
-- This migration adds review_form_url column and ensures tenant isolation

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
UPDATE tenants
SET review_form_url = CONCAT('https://your-domain.com/review/', id)
WHERE review_form_url IS NULL;
