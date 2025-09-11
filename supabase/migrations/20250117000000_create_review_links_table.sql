-- Create Review Links Table for Public Review Access
-- This table stores review links that can be accessed publicly without authentication
-- Date: January 17, 2025

-- ============================================================================
-- CREATE REVIEW LINKS TABLE
-- ============================================================================

CREATE TABLE public.review_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  link_code VARCHAR(50) UNIQUE NOT NULL, -- Short, memorable code for the link
  business_name TEXT NOT NULL,
  business_email TEXT,
  business_phone TEXT,
  business_address TEXT,
  google_business_url TEXT,
  form_customization JSONB DEFAULT '{}',
  email_template JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE, -- Optional expiration date
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- ============================================================================
-- CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

-- Index for fast lookup by link_code (most common query)
CREATE INDEX idx_review_links_code ON public.review_links(link_code);

-- Index for tenant-based queries
CREATE INDEX idx_review_links_tenant_id ON public.review_links(tenant_id);

-- Index for active links only
CREATE INDEX idx_review_links_active ON public.review_links(is_active) WHERE is_active = true;

-- ============================================================================
-- CREATE RLS POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE public.review_links ENABLE ROW LEVEL SECURITY;

-- Super admins can do everything
CREATE POLICY "review_links_super_admin_all" ON public.review_links
  FOR ALL USING (public.is_super_admin(auth.uid()));

-- Tenant admins can manage their own review links
CREATE POLICY "review_links_tenant_admin_all" ON public.review_links
  FOR ALL USING (
    tenant_id = public.get_current_tenant_id() AND
    public.is_tenant_admin(auth.uid(), tenant_id)
  );

-- Public read access for active review links (for the review form)
CREATE POLICY "review_links_public_read_active" ON public.review_links
  FOR SELECT TO anon USING (
    is_active = true AND
    (expires_at IS NULL OR expires_at > NOW())
  );

-- Authenticated users can read review links for their tenant
CREATE POLICY "review_links_authenticated_read" ON public.review_links
  FOR SELECT TO authenticated USING (
    public.is_super_admin(auth.uid()) OR
    tenant_id = public.get_current_tenant_id()
  );

-- ============================================================================
-- CREATE HELPER FUNCTIONS
-- ============================================================================

-- Function to get review link by code
CREATE OR REPLACE FUNCTION get_review_link_by_code(p_link_code TEXT)
RETURNS TABLE (
  id UUID,
  tenant_id UUID,
  business_name TEXT,
  business_email TEXT,
  business_phone TEXT,
  business_address TEXT,
  google_business_url TEXT,
  form_customization JSONB,
  email_template JSONB,
  is_active BOOLEAN,
  expires_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    rl.id,
    rl.tenant_id,
    rl.business_name,
    rl.business_email,
    rl.business_phone,
    rl.business_address,
    rl.google_business_url,
    rl.form_customization,
    rl.email_template,
    rl.is_active,
    rl.expires_at
  FROM public.review_links rl
  WHERE rl.link_code = p_link_code
    AND rl.is_active = true
    AND (rl.expires_at IS NULL OR rl.expires_at > NOW());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create a review link
CREATE OR REPLACE FUNCTION create_review_link(
  p_tenant_id UUID,
  p_business_name TEXT,
  p_business_email TEXT DEFAULT NULL,
  p_business_phone TEXT DEFAULT NULL,
  p_business_address TEXT DEFAULT NULL,
  p_google_business_url TEXT DEFAULT NULL,
  p_form_customization JSONB DEFAULT '{}',
  p_email_template JSONB DEFAULT '{}',
  p_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  link_code VARCHAR(50),
  review_url TEXT
) AS $$
DECLARE
  v_link_code VARCHAR(50);
  v_review_url TEXT;
BEGIN
  -- Generate a unique link code (8 characters)
  LOOP
    v_link_code := substring(md5(random()::text) from 1 for 8);
    -- Check if code already exists
    IF NOT EXISTS (SELECT 1 FROM public.review_links WHERE link_code = v_link_code) THEN
      EXIT;
    END IF;
  END LOOP;

  -- Insert the review link
  INSERT INTO public.review_links (
    tenant_id,
    link_code,
    business_name,
    business_email,
    business_phone,
    business_address,
    google_business_url,
    form_customization,
    email_template,
    expires_at
  ) VALUES (
    p_tenant_id,
    v_link_code,
    p_business_name,
    p_business_email,
    p_business_phone,
    p_business_address,
    p_google_business_url,
    p_form_customization,
    p_email_template,
    p_expires_at
  );

  -- Generate the review URL
  v_review_url := '/review/' || v_link_code;

  -- Return the created link info
  RETURN QUERY
  SELECT 
    rl.id,
    rl.link_code,
    v_review_url
  FROM public.review_links rl
  WHERE rl.link_code = v_link_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get all review links for a tenant
CREATE OR REPLACE FUNCTION get_tenant_review_links(p_tenant_id UUID)
RETURNS TABLE (
  id UUID,
  link_code VARCHAR(50),
  business_name TEXT,
  business_email TEXT,
  business_phone TEXT,
  business_address TEXT,
  google_business_url TEXT,
  is_active BOOLEAN,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE,
  review_url TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    rl.id,
    rl.link_code,
    rl.business_name,
    rl.business_email,
    rl.business_phone,
    rl.business_address,
    rl.google_business_url,
    rl.is_active,
    rl.expires_at,
    rl.created_at,
    '/review/' || rl.link_code as review_url
  FROM public.review_links rl
  WHERE rl.tenant_id = p_tenant_id
  ORDER BY rl.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- CREATE TRIGGERS
-- ============================================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_review_links_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_review_links_updated_at
  BEFORE UPDATE ON public.review_links
  FOR EACH ROW
  EXECUTE FUNCTION update_review_links_updated_at();

-- ============================================================================
-- INSERT SAMPLE DATA (for testing)
-- ============================================================================

-- Note: This will only work if the tenant exists
-- Uncomment and modify as needed for testing
/*
INSERT INTO public.review_links (
  tenant_id,
  link_code,
  business_name,
  business_email,
  business_phone,
  business_address,
  google_business_url,
  form_customization,
  email_template
) VALUES (
  '9509987d-21e5-4205-87c1-021560ba6581', -- Replace with actual tenant ID
  'demo1234',
  'Demo Business',
  'demo@business.com',
  '+1-555-0123',
  '123 Demo Street, Demo City, DC 12345',
  'https://g.page/demo-business',
  '{"primary_color": "#3b82f6", "secondary_color": "#1e40af", "welcome_message": "Share your experience with Demo Business"}',
  '{"subject": "Thank you for your review!", "body": "We appreciate your feedback."}'
);
*/

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant necessary permissions
GRANT SELECT ON public.review_links TO anon;
GRANT SELECT ON public.review_links TO authenticated;
GRANT ALL ON public.review_links TO service_role;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION get_review_link_by_code(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION get_review_link_by_code(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION create_review_link(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB, JSONB, TIMESTAMP WITH TIME ZONE) TO authenticated;
GRANT EXECUTE ON FUNCTION get_tenant_review_links(UUID) TO authenticated;
