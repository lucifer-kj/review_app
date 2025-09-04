-- Remove invoice functionality from the database

-- Drop the invoices table
DROP TABLE IF EXISTS public.invoices CASCADE;

-- Remove invoice_template_url column from business_settings
ALTER TABLE public.business_settings 
DROP COLUMN IF EXISTS invoice_template_url;

-- Drop the invoice-templates storage bucket if it exists
-- Note: This will also drop all policies associated with this bucket
DROP POLICY IF EXISTS "Authenticated users can upload invoice templates" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view invoice templates" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete their invoice templates" ON storage.objects;

-- Remove the storage bucket (this will fail if bucket doesn't exist, but that's okay)
-- We'll handle this manually if needed since DROP BUCKET might not be available in all contexts
