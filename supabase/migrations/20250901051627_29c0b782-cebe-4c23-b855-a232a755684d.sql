-- Update reviews table to replace email with phone number and country code
ALTER TABLE public.reviews DROP COLUMN IF EXISTS email;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS country_code text NOT NULL DEFAULT '+1';
ALTER TABLE public.reviews ALTER COLUMN phone DROP DEFAULT;
ALTER TABLE public.reviews ALTER COLUMN phone SET NOT NULL;