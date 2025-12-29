-- Fix the SECURITY DEFINER view issue by recreating with SECURITY INVOKER
DROP VIEW IF EXISTS public.public_reviews;

CREATE VIEW public.public_reviews 
WITH (security_invoker = true)
AS
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

-- Grant SELECT on the view
GRANT SELECT ON public.public_reviews TO authenticated, anon;