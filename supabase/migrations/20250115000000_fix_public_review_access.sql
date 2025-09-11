-- Fix public access for review forms
-- This migration ensures anonymous users can access tenant and business settings for review forms

-- ============================================================================
-- DROP EXISTING POLICIES THAT BLOCK PUBLIC ACCESS
-- ============================================================================

-- Drop existing tenant policies that require authentication
DROP POLICY IF EXISTS "super_admin_tenants" ON public.tenants;
DROP POLICY IF EXISTS "tenant_admin_own_tenant" ON public.tenants;
DROP POLICY IF EXISTS "tenant_admin_update_own_tenant" ON public.tenants;

-- Drop existing business_settings policies that require authentication
DROP POLICY IF EXISTS "super_admin_business_settings" ON public.business_settings;
DROP POLICY IF EXISTS "tenant_business_settings" ON public.business_settings;

-- ============================================================================
-- CREATE NEW POLICIES FOR PUBLIC ACCESS
-- ============================================================================

-- Allow super admins full access to tenants
CREATE POLICY "super_admin_tenants_full_access" ON public.tenants
  FOR ALL USING (public.is_super_admin(auth.uid()));

-- Allow tenant admins to view and update their own tenant
CREATE POLICY "tenant_admin_own_tenant_access" ON public.tenants
  FOR SELECT USING (
    public.is_tenant_admin(auth.uid(), id)
  );

CREATE POLICY "tenant_admin_update_own_tenant_access" ON public.tenants
  FOR UPDATE USING (
    public.is_tenant_admin(auth.uid(), id)
  );

-- Allow public (anonymous) access to active tenants for review forms
CREATE POLICY "public_active_tenants_read" ON public.tenants
  FOR SELECT TO anon USING (status = 'active');

-- Allow authenticated users to read tenants they have access to
CREATE POLICY "authenticated_tenants_read" ON public.tenants
  FOR SELECT TO authenticated USING (
    public.is_super_admin(auth.uid()) OR
    public.is_tenant_admin(auth.uid(), id) OR
    id = public.get_current_tenant_id()
  );

-- ============================================================================
-- BUSINESS SETTINGS POLICIES
-- ============================================================================

-- Allow super admins full access to business settings
CREATE POLICY "super_admin_business_settings_full_access" ON public.business_settings
  FOR ALL USING (public.is_super_admin(auth.uid()));

-- Allow tenant users to access their own business settings
CREATE POLICY "tenant_business_settings_access" ON public.business_settings
  FOR ALL USING (
    tenant_id = public.get_current_tenant_id()
  );

-- Allow public (anonymous) access to business settings for active tenants
CREATE POLICY "public_business_settings_read" ON public.business_settings
  FOR SELECT TO anon USING (
    tenant_id IN (
      SELECT id FROM public.tenants WHERE status = 'active'
    )
  );

-- ============================================================================
-- REVIEW POLICIES (ENSURE PUBLIC INSERT ACCESS)
-- ============================================================================

-- Ensure anonymous users can insert reviews
DROP POLICY IF EXISTS "anonymous_review_insert" ON public.reviews;
CREATE POLICY "anonymous_review_insert" ON public.reviews
  FOR INSERT TO anon WITH CHECK (true);

-- Allow authenticated users to insert reviews for their tenant
CREATE POLICY "authenticated_review_insert" ON public.reviews
  FOR INSERT TO authenticated WITH CHECK (
    tenant_id = public.get_current_tenant_id()
  );

-- ============================================================================
-- GRANT NECESSARY PERMISSIONS
-- ============================================================================

-- Grant anonymous users permission to read tenants and business_settings
GRANT SELECT ON public.tenants TO anon;
GRANT SELECT ON public.business_settings TO anon;

-- Ensure anonymous users can insert reviews
GRANT INSERT ON public.reviews TO anon;

-- ============================================================================
-- UPDATE EXISTING TEST TENANT AND BUSINESS SETTINGS
-- ============================================================================

-- Update existing test tenant to ensure it's active and has proper settings
UPDATE public.tenants 
SET 
  name = 'Demo Business',
  domain = 'demo.alphabusinessdesigns.co.in',
  status = 'active',
  plan_type = 'basic',
  settings = '{"review_form_url": "https://demo.alphabusinessdesigns.co.in/review/36dcb9ba-9dec-4cb1-9465-a084e73329c4"}'::jsonb,
  updated_at = NOW()
WHERE id = '36dcb9ba-9dec-4cb1-9465-a084e73329c4';

-- Insert or update test business settings for the demo tenant
-- First, try to update existing business settings
UPDATE public.business_settings 
SET 
  business_name = 'Demo Business',
  business_email = 'demo@alphabusinessdesigns.co.in',
  business_phone = '+1-555-0123',
  business_address = '123 Demo Street, Demo City, DC 12345',
  google_business_url = 'https://g.page/demo-business',
  form_customization = '{
    "primary_color": "#3b82f6",
    "secondary_color": "#1e40af",
    "welcome_message": "Share your experience with Demo Business",
    "thank_you_message": "Thank you for your feedback!",
    "required_fields": ["customer_name", "rating"],
    "optional_fields": ["customer_phone", "review_text"]
  }'::jsonb,
  updated_at = NOW()
WHERE tenant_id = '36dcb9ba-9dec-4cb1-9465-a084e73329c4';

-- If no rows were updated, insert new business settings
INSERT INTO public.business_settings (
  tenant_id,
  business_name,
  business_email,
  business_phone,
  business_address,
  google_business_url,
  form_customization,
  created_at,
  updated_at
)
SELECT 
  '36dcb9ba-9dec-4cb1-9465-a084e73329c4',
  'Demo Business',
  'demo@alphabusinessdesigns.co.in',
  '+1-555-0123',
  '123 Demo Street, Demo City, DC 12345',
  'https://g.page/demo-business',
  '{
    "primary_color": "#3b82f6",
    "secondary_color": "#1e40af",
    "welcome_message": "Share your experience with Demo Business",
    "thank_you_message": "Thank you for your feedback!",
    "required_fields": ["customer_name", "rating"],
    "optional_fields": ["customer_phone", "review_text"]
  }'::jsonb,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public.business_settings 
  WHERE tenant_id = '36dcb9ba-9dec-4cb1-9465-a084e73329c4'
);

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON POLICY "public_active_tenants_read" ON public.tenants IS 'Allows anonymous users to read active tenants for public review forms';
COMMENT ON POLICY "public_business_settings_read" ON public.business_settings IS 'Allows anonymous users to read business settings for active tenants';
COMMENT ON POLICY "anonymous_review_insert" ON public.reviews IS 'Allows anonymous users to submit reviews via public forms';
