-- Create suggestion status enum
CREATE TYPE public.suggestion_status AS ENUM ('pending', 'approved', 'rejected');

-- Create place suggestions table
CREATE TABLE public.place_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id UUID NOT NULL REFERENCES public.places(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL,
  current_value TEXT,
  suggested_value TEXT NOT NULL,
  notes TEXT,
  status suggestion_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES public.profiles(id),
  rejection_reason TEXT,
  
  CONSTRAINT valid_field_name CHECK (field_name IN (
    'name', 'primary_category', 'price_level', 'packages_accepted', 
    'package_fee_required', 'package_fee_amount', 'features', 'latitude', 'longitude'
  ))
);

-- Enable RLS
ALTER TABLE public.place_suggestions ENABLE ROW LEVEL SECURITY;

-- Everyone can view suggestions (public visibility)
CREATE POLICY "Anyone can view suggestions"
ON public.place_suggestions
FOR SELECT
USING (true);

-- Only verified users can create suggestions for themselves
CREATE POLICY "Verified users can create suggestions"
ON public.place_suggestions
FOR INSERT
WITH CHECK (
  auth.uid() = user_id 
  AND public.is_verified_user(auth.uid())
);

-- Create index for efficient queries
CREATE INDEX idx_place_suggestions_place_id ON public.place_suggestions(place_id);
CREATE INDEX idx_place_suggestions_status ON public.place_suggestions(status);
CREATE INDEX idx_place_suggestions_user_id ON public.place_suggestions(user_id);