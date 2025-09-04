-- Fix Multi-Tenant Data Isolation
-- This migration ensures each user only sees their own data

-- Add user_id column to business_settings table
ALTER TABLE public.business_settings 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id column to reviews table
ALTER TABLE public.reviews 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update existing records to assign to the first user (if any exist)
-- This is a temporary fix for existing data
UPDATE public.business_settings 
SET user_id = (SELECT id FROM auth.users LIMIT 1)
WHERE user_id IS NULL;

UPDATE public.reviews 
SET user_id = (SELECT id FROM auth.users LIMIT 1)
WHERE user_id IS NULL;

-- Make user_id NOT NULL after setting default values
ALTER TABLE public.business_settings 
ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE public.reviews 
ALTER COLUMN user_id SET NOT NULL;

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Users can manage their own business settings" ON public.business_settings;
DROP POLICY IF EXISTS "Anyone can insert reviews" ON public.reviews;
DROP POLICY IF EXISTS "Authenticated users can view reviews" ON public.reviews;
DROP POLICY IF EXISTS "Authenticated users can update reviews" ON public.reviews;

-- Create secure RLS policies for business_settings
CREATE POLICY "Users can view their own business settings"
ON public.business_settings
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own business settings"
ON public.business_settings
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own business settings"
ON public.business_settings
FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own business settings"
ON public.business_settings
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Create secure RLS policies for reviews
-- Allow anonymous inserts (for public review forms)
CREATE POLICY "Anyone can insert reviews"
ON public.reviews
FOR INSERT
WITH CHECK (true);

-- Users can only view their own reviews
CREATE POLICY "Users can view their own reviews"
ON public.reviews
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Users can only update their own reviews
CREATE POLICY "Users can update their own reviews"
ON public.reviews
FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- Users can only delete their own reviews
CREATE POLICY "Users can delete their own reviews"
ON public.reviews
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Create function to automatically assign user_id on insert
CREATE OR REPLACE FUNCTION public.handle_business_settings_insert()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_id IS NULL THEN
    NEW.user_id = auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for business_settings
CREATE TRIGGER handle_business_settings_insert_trigger
  BEFORE INSERT ON public.business_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_business_settings_insert();

-- Create function to automatically assign user_id on review insert
CREATE OR REPLACE FUNCTION public.handle_review_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- For authenticated users, assign their user_id
  IF auth.uid() IS NOT NULL THEN
    NEW.user_id = auth.uid();
  END IF;
  -- For anonymous users, we'll need to handle this differently
  -- For now, we'll require authentication for review submission
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for reviews
CREATE TRIGGER handle_review_insert_trigger
  BEFORE INSERT ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_review_insert();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_business_settings_user_id ON public.business_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON public.reviews(created_at DESC);

-- Create function to get user's business settings
CREATE OR REPLACE FUNCTION public.get_user_business_settings()
RETURNS TABLE (
  id UUID,
  google_business_url TEXT,
  business_name TEXT,
  business_email TEXT,
  business_phone TEXT,
  business_address TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    bs.id,
    bs.google_business_url,
    bs.business_name,
    bs.business_email,
    bs.business_phone,
    bs.business_address,
    bs.created_at,
    bs.updated_at
  FROM public.business_settings bs
  WHERE bs.user_id = auth.uid()
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get user's reviews
CREATE OR REPLACE FUNCTION public.get_user_reviews()
RETURNS TABLE (
  id UUID,
  name TEXT,
  email TEXT,
  rating INTEGER,
  google_review BOOLEAN,
  redirect_opened BOOLEAN,
  created_at TIMESTAMPTZ,
  metadata JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.name,
    r.email,
    r.rating,
    r.google_review,
    r.redirect_opened,
    r.created_at,
    r.metadata
  FROM public.reviews r
  WHERE r.user_id = auth.uid()
  ORDER BY r.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get user's review stats
CREATE OR REPLACE FUNCTION public.get_user_review_stats()
RETURNS TABLE (
  total_reviews INTEGER,
  average_rating NUMERIC,
  high_rating_reviews INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as total_reviews,
    COALESCE(AVG(r.rating), 0) as average_rating,
    COUNT(CASE WHEN r.rating >= 4 THEN 1 END)::INTEGER as high_rating_reviews
  FROM public.reviews r
  WHERE r.user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
