-- Add county enrichment fields to places table
ALTER TABLE public.places
ADD COLUMN IF NOT EXISTS county_normalized text,
ADD COLUMN IF NOT EXISTS county_source text,
ADD COLUMN IF NOT EXISTS county_last_enriched_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS county_confidence text,
ADD COLUMN IF NOT EXISTS county_notes text;

-- Add index for county search
CREATE INDEX IF NOT EXISTS idx_places_county ON public.places (county);
CREATE INDEX IF NOT EXISTS idx_places_county_normalized ON public.places (county_normalized);

-- Index for finding places needing enrichment
CREATE INDEX IF NOT EXISTS idx_places_county_enrichment 
ON public.places (latitude, longitude) 
WHERE county IS NULL AND latitude IS NOT NULL AND longitude IS NOT NULL;