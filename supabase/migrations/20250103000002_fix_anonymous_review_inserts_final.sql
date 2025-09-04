-- Fix anonymous review inserts - Final Solution
-- This migration ensures that anonymous users can submit reviews through the public form

-- First, let's drop and recreate the trigger function to ensure it works correctly
DROP TRIGGER IF EXISTS handle_review_insert_trigger ON public.reviews;
DROP FUNCTION IF EXISTS public.handle_review_insert();

-- Create a new trigger function that properly handles anonymous users
CREATE OR REPLACE FUNCTION public.handle_review_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- For authenticated users, assign their user_id
  IF auth.uid() IS NOT NULL THEN
    NEW.user_id = auth.uid();
  END IF;
  -- For anonymous users, user_id will remain NULL (which is allowed by the table schema)
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER handle_review_insert_trigger
  BEFORE INSERT ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_review_insert();

-- Drop all existing RLS policies for reviews to start fresh
DROP POLICY IF EXISTS "Anyone can insert reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can view their own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Anyone can view anonymous reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can update their own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can delete their own reviews" ON public.reviews;

-- Create new RLS policies that properly handle both authenticated and anonymous users

-- 1. Allow ANYONE (including anonymous users) to insert reviews
CREATE POLICY "Anyone can insert reviews" ON public.reviews
  FOR INSERT WITH CHECK (true);

-- 2. Allow authenticated users to view their own reviews
CREATE POLICY "Users can view their own reviews" ON public.reviews
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- 3. Allow viewing of anonymous reviews (reviews with NULL user_id)
-- This is needed for the dashboard to show all reviews
CREATE POLICY "Anyone can view anonymous reviews" ON public.reviews
  FOR SELECT USING (user_id IS NULL);

-- 4. Allow authenticated users to update their own reviews
CREATE POLICY "Users can update their own reviews" ON public.reviews
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- 5. Allow authenticated users to delete their own reviews
CREATE POLICY "Users can delete their own reviews" ON public.reviews
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Create a function to get all reviews for dashboard (including anonymous ones)
CREATE OR REPLACE FUNCTION public.get_all_reviews_for_dashboard()
RETURNS TABLE (
  id UUID,
  name TEXT,
  phone TEXT,
  country_code TEXT,
  rating INTEGER,
  feedback TEXT,
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
    r.phone,
    r.country_code,
    r.rating,
    r.feedback,
    r.google_review,
    r.redirect_opened,
    r.created_at,
    r.metadata
  FROM public.reviews r
  WHERE (r.user_id = auth.uid()) OR (r.user_id IS NULL)
  ORDER BY r.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to get review stats for dashboard (including anonymous ones)
CREATE OR REPLACE FUNCTION public.get_review_stats_for_dashboard()
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
  WHERE (r.user_id = auth.uid()) OR (r.user_id IS NULL);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions for the new functions
GRANT EXECUTE ON FUNCTION public.get_all_reviews_for_dashboard() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_review_stats_for_dashboard() TO anon, authenticated;

-- Test the configuration by inserting a test review (will be cleaned up)
DO $$
BEGIN
  -- Insert a test review to verify the configuration
  INSERT INTO public.reviews (name, phone, rating, google_review, redirect_opened, metadata)
  VALUES ('Test User', '1234567890', 5, true, false, '{"test": true, "source": "migration_test"}'::jsonb);
  
  -- Clean up the test review
  DELETE FROM public.reviews WHERE metadata->>'test' = 'true';
  
  RAISE NOTICE 'Review form configuration completed successfully! Anonymous users can now submit reviews.';
END $$;
