-- Drop the view and recreate with SECURITY INVOKER to ensure RLS is applied
DROP VIEW IF EXISTS public.public_place_claims;

CREATE VIEW public.public_place_claims 
WITH (security_invoker = true)
AS
SELECT 
  id,
  place_id,
  status,
  claim_type,
  verified_at
FROM public.place_claims
WHERE status = 'approved';