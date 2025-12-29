-- Fix: Private review notes exposed to public via SELECT policy
-- The current policy "Anyone can view reviews" allows reading note_private column

-- Drop the existing public SELECT policy
DROP POLICY IF EXISTS "Anyone can view reviews" ON public.reviews;

-- Create a new policy that only allows admins to see full reviews (including private notes)
CREATE POLICY "Admins can view all reviews" ON public.reviews
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Create a policy for non-admins that excludes private notes
-- We'll use a view for public review access instead of exposing the full table
-- This policy allows users to see their own reviews (they submitted the private note)
CREATE POLICY "Users can view own reviews" ON public.reviews
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- The public_reviews view already exists and is used by the app
-- It properly excludes note_private - verify this is being used consistently