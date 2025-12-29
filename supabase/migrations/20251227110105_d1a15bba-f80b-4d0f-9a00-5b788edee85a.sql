-- Add place_external_id to places for bulk import matching
ALTER TABLE public.places 
ADD COLUMN IF NOT EXISTS place_external_id text UNIQUE;

-- Create index on place_external_id
CREATE INDEX IF NOT EXISTS idx_places_external_id ON public.places(place_external_id) WHERE place_external_id IS NOT NULL;

-- Create normalized entrances table for places
CREATE TABLE IF NOT EXISTS public.entrances (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  place_id uuid NOT NULL REFERENCES public.places(id) ON DELETE CASCADE,
  entrance_external_id text UNIQUE,
  entrance_name text NOT NULL,
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  
  -- RV-specific fields
  max_rv_length_ft integer,
  max_rv_height_ft numeric,
  road_type text CHECK (road_type IS NULL OR road_type IN ('paved', 'gravel', 'dirt')),
  grade text CHECK (grade IS NULL OR grade IN ('flat', 'moderate', 'steep')),
  tight_turns boolean,
  low_clearance_warning boolean,
  seasonal_access text CHECK (seasonal_access IS NULL OR seasonal_access IN ('year_round', 'seasonal')),
  seasonal_notes text,
  entrance_notes text,
  is_primary boolean DEFAULT false,
  
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create indexes for entrances
CREATE INDEX IF NOT EXISTS idx_entrances_place_id ON public.entrances(place_id);
CREATE INDEX IF NOT EXISTS idx_entrances_external_id ON public.entrances(entrance_external_id) WHERE entrance_external_id IS NOT NULL;

-- Enable RLS
ALTER TABLE public.entrances ENABLE ROW LEVEL SECURITY;

-- RLS Policies for entrances
CREATE POLICY "Anyone can view entrances"
ON public.entrances FOR SELECT
USING (true);

CREATE POLICY "Admins can manage entrances"
ON public.entrances FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Verified users can insert entrances"
ON public.entrances FOR INSERT
WITH CHECK (is_verified_user(auth.uid()));

-- Trigger to update updated_at
CREATE TRIGGER update_entrances_updated_at
BEFORE UPDATE ON public.entrances
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();