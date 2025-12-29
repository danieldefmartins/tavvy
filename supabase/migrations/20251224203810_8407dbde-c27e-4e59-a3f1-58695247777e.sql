-- Update the public_reviews view to include reviewer_medal
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
  r.reviewer_medal,
  p.display_name as user_display_name,
  p.trusted_contributor,
  p.reviewer_medal as current_reviewer_medal
FROM public.reviews r
LEFT JOIN public.profiles p ON p.id = r.user_id;

GRANT SELECT ON public.public_reviews TO authenticated, anon;