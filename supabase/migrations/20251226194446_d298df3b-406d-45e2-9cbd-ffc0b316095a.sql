-- Create a public view that exposes only non-sensitive claim data
CREATE VIEW public.public_place_claims AS
SELECT 
  id,
  place_id,
  status,
  claim_type,
  verified_at
FROM public.place_claims
WHERE status = 'approved';

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Anyone can view approved claims" ON public.place_claims;

-- Create a restrictive policy that only allows owners and admins to see full claim details
CREATE POLICY "Claim owners and admins can view full claims"
  ON public.place_claims FOR SELECT
  USING (
    auth.uid() = user_id OR 
    has_role(auth.uid(), 'admin'::app_role)
  );