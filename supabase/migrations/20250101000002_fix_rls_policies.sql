-- Fix RLS policies for reviews table to allow anonymous access
-- This migration ensures the public review form can work properly

-- Enable RLS on reviews table (if not already enabled)
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Anyone can insert reviews" ON public.reviews;
DROP POLICY IF EXISTS "Anyone can update reviews" ON public.reviews;
DROP POLICY IF EXISTS "Authenticated users can view reviews" ON public.reviews;
DROP POLICY IF EXISTS "Authenticated users can update reviews" ON public.reviews;
DROP POLICY IF EXISTS "Allow anonymous inserts" ON public.reviews;
DROP POLICY IF EXISTS "Allow anonymous updates" ON public.reviews;
DROP POLICY IF EXISTS "Allow authenticated users to view reviews" ON public.reviews;
DROP POLICY IF EXISTS "Allow authenticated users to insert reviews" ON public.reviews;
DROP POLICY IF EXISTS "Allow authenticated users to update reviews" ON public.reviews;

-- Create comprehensive RLS policies for reviews table

-- 1. Allow anonymous users to insert reviews (for public review form)
CREATE POLICY "Allow anonymous inserts" ON public.reviews
  FOR INSERT 
  TO anon 
  WITH CHECK (true);

-- 2. Allow anonymous users to update reviews (for feedback submission)
CREATE POLICY "Allow anonymous updates" ON public.reviews
  FOR UPDATE 
  TO anon 
  USING (true);

-- 3. Allow anonymous users to select their own reviews (for feedback flow)
CREATE POLICY "Allow anonymous selects" ON public.reviews
  FOR SELECT 
  TO anon 
  USING (true);

-- 4. Allow authenticated users to view all reviews (for dashboard)
CREATE POLICY "Allow authenticated users to view reviews" ON public.reviews
  FOR SELECT 
  TO authenticated 
  USING (true);

-- 5. Allow authenticated users to insert reviews
CREATE POLICY "Allow authenticated users to insert reviews" ON public.reviews
  FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

-- 6. Allow authenticated users to update reviews
CREATE POLICY "Allow authenticated users to update reviews" ON public.reviews
  FOR UPDATE 
  TO authenticated 
  USING (true);

-- 7. Allow authenticated users to delete reviews (admin functionality)
CREATE POLICY "Allow authenticated users to delete reviews" ON public.reviews
  FOR DELETE 
  TO authenticated 
  USING (true);
