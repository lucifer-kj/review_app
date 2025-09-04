-- Fix anonymous review inserts
-- This migration ensures that anonymous users can submit reviews through the public form

-- Update the handle_review_insert function to properly handle anonymous users
CREATE OR REPLACE FUNCTION public.handle_review_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- For authenticated users, assign their user_id
  IF auth.uid() IS NOT NULL THEN
    NEW.user_id = auth.uid();
  END IF;
  -- For anonymous users, user_id will remain NULL (which is allowed)
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update RLS policies to allow anonymous inserts and proper viewing
-- Drop existing policies first
DROP POLICY IF EXISTS "Anyone can insert reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can view their own reviews" ON public.reviews;

-- Create updated policies
-- Allow anonymous inserts (for public review forms)
CREATE POLICY "Anyone can insert reviews" ON public.reviews
  FOR INSERT WITH CHECK (true);

-- Users can view their own reviews (authenticated users)
CREATE POLICY "Users can view their own reviews" ON public.reviews
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Also allow viewing reviews without user_id (for anonymous submissions)
CREATE POLICY "Anyone can view anonymous reviews" ON public.reviews
  FOR SELECT USING (user_id IS NULL);

-- Users can only update their own reviews
CREATE POLICY "Users can update their own reviews" ON public.reviews
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- Users can only delete their own reviews
CREATE POLICY "Users can delete their own reviews" ON public.reviews
  FOR DELETE TO authenticated USING (user_id = auth.uid());
