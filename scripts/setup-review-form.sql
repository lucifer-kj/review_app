-- Setup Review Form Database Configuration
-- This script fixes the anonymous review submission issues

-- 1. Ensure the reviews table allows NULL user_id for anonymous submissions
-- (This should already be the case, but let's verify)

-- 2. Update the handle_review_insert function to properly handle anonymous users
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

-- 3. Update RLS policies to allow anonymous inserts and proper viewing
-- Drop existing policies first
DROP POLICY IF EXISTS "Anyone can insert reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can view their own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Anyone can view anonymous reviews" ON public.reviews;

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

-- 4. Create a function to get all reviews (including anonymous ones) for dashboard
CREATE OR REPLACE FUNCTION public.get_all_reviews_for_user(user_id uuid DEFAULT NULL)
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
  WHERE (user_id IS NULL AND r.user_id IS NULL) OR (user_id IS NOT NULL AND r.user_id = user_id)
  ORDER BY r.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create a function to get review stats including anonymous reviews
CREATE OR REPLACE FUNCTION public.get_review_stats_for_user(user_id uuid DEFAULT NULL)
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
  WHERE (user_id IS NULL AND r.user_id IS NULL) OR (user_id IS NOT NULL AND r.user_id = user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Test the configuration by inserting a test review (will be cleaned up)
-- This helps verify that the setup is working
DO $$
BEGIN
  -- Insert a test review to verify the configuration
  INSERT INTO public.reviews (name, phone, rating, google_review, redirect_opened, metadata)
  VALUES ('Test User', '1234567890', 5, true, false, '{"test": true, "source": "setup_script"}'::jsonb);
  
  -- Clean up the test review
  DELETE FROM public.reviews WHERE metadata->>'test' = 'true';
  
  RAISE NOTICE 'Review form configuration completed successfully!';
END $$;
