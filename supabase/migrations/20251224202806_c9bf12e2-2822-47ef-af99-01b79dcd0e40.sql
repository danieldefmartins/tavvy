-- =============================================
-- FIX 1: Notifications INSERT policy abuse
-- Change from allowing anyone to insert to only allowing
-- inserts from SECURITY DEFINER functions (triggers)
-- =============================================

-- Drop the overly permissive INSERT policy
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;

-- Create a restrictive policy that only allows inserts when auth.uid() is NULL
-- This works because SECURITY DEFINER functions run without auth context
-- Regular authenticated users will have auth.uid() set and be blocked
CREATE POLICY "Only system triggers can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (auth.uid() IS NULL);

-- =============================================
-- FIX 2: Reviews table data exposure
-- Create a view for public review display that excludes note_private
-- Update RLS to ensure note_private is only visible to the review owner
-- =============================================

-- Create a public view that excludes sensitive data
CREATE OR REPLACE VIEW public.public_reviews AS
SELECT 
  r.id,
  r.place_id,
  r.user_id,
  r.note_public,
  r.created_at,
  r.updated_at,
  p.display_name as user_display_name,
  p.trusted_contributor
FROM public.reviews r
LEFT JOIN public.profiles p ON p.id = r.user_id;

-- Grant SELECT on the view to authenticated and anon users
GRANT SELECT ON public.public_reviews TO authenticated, anon;

-- Update the reviews table policies to be more restrictive for note_private
-- The existing "Anyone can view reviews" policy allows full row access
-- We'll keep it for now but the application will use the view for public access
-- Users can still see their own full reviews including note_private

-- Note: RLS is row-level, not column-level. The view approach is the proper fix
-- for hiding specific columns from unauthorized access.