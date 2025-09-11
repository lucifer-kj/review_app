-- Multi-Tenant Public Review URL System Migration
-- Date: January 18, 2025
-- Purpose: Implement slug-based public review URLs with anonymous submissions

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. UPDATE TENANTS TABLE
-- ============================================================================

-- Add new columns to tenants table for public review URL system
ALTER TABLE public.tenants 
ADD COLUMN IF NOT EXISTS business_name TEXT,
ADD COLUMN IF NOT EXISTS google_review_url TEXT,
ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS review_url TEXT,
ADD COLUMN IF NOT EXISTS branding JSONB DEFAULT '{}';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tenants_slug ON public.tenants(slug);
CREATE INDEX IF NOT EXISTS idx_tenants_business_name ON public.tenants(business_name);

-- Add comments for documentation
COMMENT ON COLUMN public.tenants.business_name IS 'Required business name for public review URL generation';
COMMENT ON COLUMN public.tenants.google_review_url IS 'Required Google review URL for high-rating redirects';
COMMENT ON COLUMN public.tenants.slug IS 'Unique slug for public review URL (e.g., "acme-restaurant")';
COMMENT ON COLUMN public.tenants.review_url IS 'Full public review URL (e.g., "https://yourapp.com/review/acme-restaurant")';
COMMENT ON COLUMN public.tenants.branding IS 'Branding settings (logo, colors, etc.) for public review page';

-- ============================================================================
-- 2. CREATE TENANT_USERS TABLE
-- ============================================================================

-- Create tenant_users mapping table for user-tenant relationships
CREATE TABLE IF NOT EXISTS public.tenant_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('owner', 'admin', 'staff')),
  invited_by UUID REFERENCES auth.users(id),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tenant_id, user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tenant_users_tenant_id ON public.tenant_users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_users_user_id ON public.tenant_users(user_id);
CREATE INDEX IF NOT EXISTS idx_tenant_users_role ON public.tenant_users(role);

-- Add comments for documentation
COMMENT ON TABLE public.tenant_users IS 'Mapping table for user-tenant relationships with roles';
COMMENT ON COLUMN public.tenant_users.role IS 'User role within the tenant: owner, admin, or staff';

-- ============================================================================
-- 3. UPDATE REVIEWS TABLE
-- ============================================================================

-- Update reviews table to support anonymous submissions
ALTER TABLE public.reviews 
ADD COLUMN IF NOT EXISTS reviewer_name TEXT,
ADD COLUMN IF NOT EXISTS reviewer_email TEXT,
ADD COLUMN IF NOT EXISTS reviewer_phone TEXT,
ADD COLUMN IF NOT EXISTS feedback_text TEXT,
ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'public_form',
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Make user_id nullable for anonymous submissions
ALTER TABLE public.reviews ALTER COLUMN user_id DROP NOT NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_reviews_tenant_id ON public.reviews(tenant_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON public.reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON public.reviews(created_at);
CREATE INDEX IF NOT EXISTS idx_reviews_is_anonymous ON public.reviews(is_anonymous);

-- Add comments for documentation
COMMENT ON COLUMN public.reviews.reviewer_name IS 'Name of the reviewer (for anonymous submissions)';
COMMENT ON COLUMN public.reviews.reviewer_email IS 'Email of the reviewer (optional)';
COMMENT ON COLUMN public.reviews.reviewer_phone IS 'Phone of the reviewer (optional)';
COMMENT ON COLUMN public.reviews.feedback_text IS 'Detailed feedback text from reviewer';
COMMENT ON COLUMN public.reviews.is_anonymous IS 'Whether this is an anonymous public submission';
COMMENT ON COLUMN public.reviews.source IS 'Source of the review (public_form, email, etc.)';

-- ============================================================================
-- 4. CREATE HELPER FUNCTIONS
-- ============================================================================

-- Function to generate slug from business name
CREATE OR REPLACE FUNCTION public.generate_slug(business_name TEXT)
RETURNS TEXT AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  -- Convert to lowercase, replace non-alphanumeric with hyphens, trim
  base_slug := lower(trim(regexp_replace(business_name, '[^a-zA-Z0-9\s]', '', 'g')));
  base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
  base_slug := trim(both '-' from base_slug);
  
  -- Ensure it's not empty
  IF base_slug = '' THEN
    base_slug := 'business';
  END IF;
  
  final_slug := base_slug;
  
  -- Check for uniqueness and add counter if needed
  WHILE EXISTS (SELECT 1 FROM public.tenants WHERE slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get tenant by slug
CREATE OR REPLACE FUNCTION public.get_tenant_by_slug(slug_param TEXT)
RETURNS TABLE (
  id UUID,
  name TEXT,
  business_name TEXT,
  google_review_url TEXT,
  slug TEXT,
  review_url TEXT,
  branding JSONB,
  status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.name,
    t.business_name,
    t.google_review_url,
    t.slug,
    t.review_url,
    t.branding,
    t.status
  FROM public.tenants t
  WHERE t.slug = slug_param
    AND t.status = 'active'
    AND t.business_name IS NOT NULL
    AND t.google_review_url IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is tenant owner
CREATE OR REPLACE FUNCTION public.is_tenant_owner(user_id UUID, tenant_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.tenant_users tu
    WHERE tu.user_id = user_id 
      AND tu.tenant_id = tenant_id 
      AND tu.role = 'owner'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is tenant admin or owner
CREATE OR REPLACE FUNCTION public.is_tenant_admin_or_owner(user_id UUID, tenant_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.tenant_users tu
    WHERE tu.user_id = user_id 
      AND tu.tenant_id = tenant_id 
      AND tu.role IN ('owner', 'admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 5. UPDATE RLS POLICIES
-- ============================================================================

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "tenant_isolation" ON public.tenants;
DROP POLICY IF EXISTS "tenants_tenant_isolation" ON public.tenants;
DROP POLICY IF EXISTS "tenant_review_access" ON public.reviews;
DROP POLICY IF EXISTS "Users can view their own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Anyone can insert reviews" ON public.reviews;
DROP POLICY IF EXISTS "Anyone can view anonymous reviews" ON public.reviews;
DROP POLICY IF EXISTS "reviews_tenant_isolation" ON public.reviews;
DROP POLICY IF EXISTS "reviews_anonymous_insert" ON public.reviews;
DROP POLICY IF EXISTS "reviews_authenticated_insert" ON public.reviews;
DROP POLICY IF EXISTS "reviews_authenticated_update" ON public.reviews;
DROP POLICY IF EXISTS "reviews_authenticated_delete" ON public.reviews;

-- Drop any existing policies on tenant_users table
DROP POLICY IF EXISTS "tenant_users_tenant_isolation" ON public.tenant_users;

-- Enable RLS on new table
ALTER TABLE public.tenant_users ENABLE ROW LEVEL SECURITY;

-- Tenants table policies
CREATE POLICY "tenants_tenant_isolation" ON public.tenants
  FOR ALL USING (
    -- Super admins can see all tenants
    public.is_super_admin() OR
    -- Tenant users can see their tenant
    id IN (
      SELECT tu.tenant_id FROM public.tenant_users tu 
      WHERE tu.user_id = auth.uid()
    )
  );

-- Tenant users table policies
CREATE POLICY "tenant_users_tenant_isolation" ON public.tenant_users
  FOR ALL USING (
    -- Super admins can see all
    public.is_super_admin() OR
    -- Users can see their own memberships
    user_id = auth.uid() OR
    -- Tenant admins can see their tenant's users
    tenant_id IN (
      SELECT tu.tenant_id FROM public.tenant_users tu 
      WHERE tu.user_id = auth.uid() AND tu.role IN ('owner', 'admin')
    )
  );

-- Reviews table policies
CREATE POLICY "reviews_tenant_isolation" ON public.reviews
  FOR SELECT USING (
    -- Super admins can see all reviews
    public.is_super_admin() OR
    -- Tenant users can see their tenant's reviews
    tenant_id IN (
      SELECT tu.tenant_id FROM public.tenant_users tu 
      WHERE tu.user_id = auth.uid()
    )
  );

-- Allow anonymous inserts for public review submissions
CREATE POLICY "reviews_anonymous_insert" ON public.reviews
  FOR INSERT WITH CHECK (
    -- Must have valid tenant_id
    tenant_id IS NOT NULL AND
    -- Tenant must exist and be active
    EXISTS (
      SELECT 1 FROM public.tenants t 
      WHERE t.id = tenant_id 
        AND t.status = 'active'
        AND t.business_name IS NOT NULL
        AND t.google_review_url IS NOT NULL
    )
  );

-- Allow authenticated users to insert reviews for their tenant
CREATE POLICY "reviews_authenticated_insert" ON public.reviews
  FOR INSERT WITH CHECK (
    -- Must be authenticated
    auth.uid() IS NOT NULL AND
    -- Must belong to the tenant
    tenant_id IN (
      SELECT tu.tenant_id FROM public.tenant_users tu 
      WHERE tu.user_id = auth.uid()
    )
  );

-- Allow users to update their own reviews
CREATE POLICY "reviews_authenticated_update" ON public.reviews
  FOR UPDATE USING (
    -- Super admins can update any review
    public.is_super_admin() OR
    -- Users can update their own reviews
    user_id = auth.uid() OR
    -- Tenant admins can update their tenant's reviews
    tenant_id IN (
      SELECT tu.tenant_id FROM public.tenant_users tu 
      WHERE tu.user_id = auth.uid() AND tu.role IN ('owner', 'admin')
    )
  );

-- Allow users to delete their own reviews
CREATE POLICY "reviews_authenticated_delete" ON public.reviews
  FOR DELETE USING (
    -- Super admins can delete any review
    public.is_super_admin() OR
    -- Users can delete their own reviews
    user_id = auth.uid() OR
    -- Tenant admins can delete their tenant's reviews
    tenant_id IN (
      SELECT tu.tenant_id FROM public.tenant_users tu 
      WHERE tu.user_id = auth.uid() AND tu.role IN ('owner', 'admin')
    )
  );

-- ============================================================================
-- 6. GRANT PERMISSIONS
-- ============================================================================

-- Grant permissions for anonymous users (public review submissions)
GRANT INSERT ON public.reviews TO anon;
GRANT SELECT ON public.tenants TO anon;

-- Grant permissions for authenticated users
GRANT ALL ON public.tenant_users TO authenticated;
GRANT SELECT, UPDATE ON public.tenants TO authenticated;
GRANT ALL ON public.reviews TO authenticated;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION public.generate_slug(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_tenant_by_slug(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_tenant_owner(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_tenant_admin_or_owner(UUID, UUID) TO authenticated;

-- ============================================================================
-- 7. CREATE TRIGGERS
-- ============================================================================

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tenant_users table
CREATE TRIGGER update_tenant_users_updated_at
  BEFORE UPDATE ON public.tenant_users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- 8. MIGRATION COMPLETE
-- ============================================================================

-- Add migration completion comment
COMMENT ON TABLE public.tenant_users IS 'Multi-tenant public review URL system migration completed successfully';
