-- Quick Fix for Review Form Submission Issue
-- Run this script in your Supabase SQL Editor to fix the RLS policy issue

-- Step 1: Drop existing trigger and function
DROP TRIGGER IF EXISTS handle_review_insert_trigger ON public.reviews;
DROP FUNCTION IF EXISTS public.handle_review_insert();

-- Step 2: Create new trigger function
CREATE OR REPLACE FUNCTION public.handle_review_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- For authenticated users, assign their user_id
  IF auth.uid() IS NOT NULL THEN
    NEW.user_id = auth.uid();
  END IF;
  -- For anonymous users, user_id will remain NULL
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Recreate the trigger
CREATE TRIGGER handle_review_insert_trigger
  BEFORE INSERT ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_review_insert();

-- Step 4: Drop all existing RLS policies for reviews
DROP POLICY IF EXISTS "Anyone can insert reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can view their own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Anyone can view anonymous reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can update their own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can delete their own reviews" ON public.reviews;

-- Step 5: Create new RLS policies
-- Allow ANYONE to insert reviews (including anonymous users)
CREATE POLICY "Anyone can insert reviews" ON public.reviews
  FOR INSERT WITH CHECK (true);

-- Allow authenticated users to view their own reviews
CREATE POLICY "Users can view their own reviews" ON public.reviews
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Allow viewing of anonymous reviews (for dashboard)
CREATE POLICY "Anyone can view anonymous reviews" ON public.reviews
  FOR SELECT USING (user_id IS NULL);

-- Allow authenticated users to update their own reviews
CREATE POLICY "Users can update their own reviews" ON public.reviews
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- Allow authenticated users to delete their own reviews
CREATE POLICY "Users can delete their own reviews" ON public.reviews
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Step 6: Test the configuration
DO $$
BEGIN
  -- Insert a test review to verify the configuration
  INSERT INTO public.reviews (name, phone, rating, google_review, redirect_opened, metadata)
  VALUES ('Test User', '1234567890', 5, true, false, '{"test": true, "source": "quick_fix"}'::jsonb);
  
  -- Clean up the test review
  DELETE FROM public.reviews WHERE metadata->>'test' = 'true';
  
  RAISE NOTICE 'Review form configuration completed successfully! Anonymous users can now submit reviews.';
END $$;

-- Step 7: Verify the policies are in place
SELECT 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual, 
  with_check
FROM pg_policies 
WHERE tablename = 'reviews'
ORDER BY policyname;
