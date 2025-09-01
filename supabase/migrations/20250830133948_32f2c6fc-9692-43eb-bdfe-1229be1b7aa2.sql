-- Add user_id column to track invoice ownership
ALTER TABLE public.invoices 
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_id AND role = 'admin'
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Authenticated users can view invoices" ON public.invoices;
DROP POLICY IF EXISTS "Authenticated users can create invoices" ON public.invoices;
DROP POLICY IF EXISTS "Authenticated users can update invoices" ON public.invoices;
DROP POLICY IF EXISTS "Authenticated users can delete invoices" ON public.invoices;

-- Create secure RLS policies for invoices
CREATE POLICY "Users can view their own invoices or admins can view all"
ON public.invoices
FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Users can create invoices for themselves"
ON public.invoices
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own invoices or admins can update all"
ON public.invoices
FOR UPDATE
TO authenticated
USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Users can delete their own invoices or admins can delete all"
ON public.invoices
FOR DELETE
TO authenticated
USING (user_id = auth.uid() OR public.is_admin());

-- Create an admin user role for elevated access
INSERT INTO public.profiles (id, role) 
SELECT auth.uid(), 'admin'
WHERE NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid())
ON CONFLICT (id) DO UPDATE SET role = 'admin';