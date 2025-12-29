-- ========================================
-- MUVO MIGRATION SYSTEM - PART 2: EXTERNAL REFERENCES & DEDUPLICATION
-- ========================================

-- Enum for external data sources
CREATE TYPE public.external_source AS ENUM (
  'google_maps',
  'ioverlander',
  'yelp',
  'foursquare',
  'campendium',
  'freecampsites',
  'csv_import',
  'user_submission',
  'admin_entry',
  'other'
);

-- Enum for review status
CREATE TYPE public.import_review_status AS ENUM (
  'pending',
  'approved',
  'rejected',
  'merged',
  'needs_review'
);

-- External Place References Table
-- Links MUVO places to external IDs from various sources
CREATE TABLE public.external_place_references (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id UUID NOT NULL REFERENCES public.places(id) ON DELETE CASCADE,
  source external_source NOT NULL,
  external_id TEXT NOT NULL,
  external_url TEXT,
  imported_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_synced_at TIMESTAMP WITH TIME ZONE,
  raw_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(source, external_id)
);

-- Index for fast lookups
CREATE INDEX idx_external_refs_place_id ON public.external_place_references(place_id);
CREATE INDEX idx_external_refs_source_id ON public.external_place_references(source, external_id);

-- Import Queue Table
-- Staging area for imports that need review before becoming places
CREATE TABLE public.import_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source external_source NOT NULL,
  external_id TEXT,
  raw_data JSONB NOT NULL,
  
  -- Parsed data
  name TEXT NOT NULL,
  latitude NUMERIC NOT NULL,
  longitude NUMERIC NOT NULL,
  suggested_primary_category TEXT,
  suggested_tags TEXT[],
  
  -- Review status
  status import_review_status NOT NULL DEFAULT 'pending',
  review_notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  
  -- Potential duplicates detected
  potential_duplicate_id UUID REFERENCES public.places(id),
  duplicate_confidence NUMERIC,
  
  -- Resulting place (if approved/merged)
  resulting_place_id UUID REFERENCES public.places(id),
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_import_queue_status ON public.import_queue(status);
CREATE INDEX idx_import_queue_source ON public.import_queue(source);

-- Deduplication function
-- Checks for potential duplicates based on proximity and name similarity
CREATE OR REPLACE FUNCTION public.find_duplicate_places(
  _lat NUMERIC,
  _lng NUMERIC,
  _name TEXT,
  _radius_meters NUMERIC DEFAULT 200
)
RETURNS TABLE(
  place_id UUID,
  place_name TEXT,
  distance_meters DOUBLE PRECISION,
  name_similarity DOUBLE PRECISION,
  confidence_score DOUBLE PRECISION
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as place_id,
    p.name as place_name,
    -- Haversine distance in meters
    (6371000 * acos(
      LEAST(1, GREATEST(-1,
        cos(radians(_lat)) * cos(radians(p.latitude)) * 
        cos(radians(p.longitude) - radians(_lng)) + 
        sin(radians(_lat)) * sin(radians(p.latitude))
      ))
    )) as distance_meters,
    -- Simple name similarity (trigram would be better but this works)
    CASE 
      WHEN LOWER(p.name) = LOWER(_name) THEN 1.0
      WHEN LOWER(p.name) LIKE '%' || LOWER(_name) || '%' OR LOWER(_name) LIKE '%' || LOWER(p.name) || '%' THEN 0.7
      ELSE 0.3
    END as name_similarity,
    -- Combined confidence score
    CASE 
      WHEN LOWER(p.name) = LOWER(_name) THEN 0.95
      WHEN LOWER(p.name) LIKE '%' || LOWER(_name) || '%' OR LOWER(_name) LIKE '%' || LOWER(p.name) || '%' THEN 0.75
      ELSE 0.5
    END as confidence_score
  FROM public.places p
  WHERE 
    -- Bounding box filter (roughly _radius_meters converted to degrees)
    p.latitude BETWEEN _lat - (_radius_meters / 111000) AND _lat + (_radius_meters / 111000)
    AND p.longitude BETWEEN _lng - (_radius_meters / (111000 * cos(radians(_lat)))) AND _lng + (_radius_meters / (111000 * cos(radians(_lat))))
  ORDER BY distance_meters, name_similarity DESC
  LIMIT 10;
END;
$$;

-- Check if external reference already exists
CREATE OR REPLACE FUNCTION public.find_place_by_external_id(
  _source external_source,
  _external_id TEXT
)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT place_id FROM public.external_place_references
  WHERE source = _source AND external_id = _external_id
  LIMIT 1;
$$;

-- Enable RLS
ALTER TABLE public.external_place_references ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_queue ENABLE ROW LEVEL SECURITY;

-- RLS Policies for external_place_references
CREATE POLICY "Anyone can view external references"
  ON public.external_place_references FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage external references"
  ON public.external_place_references FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- RLS Policies for import_queue
CREATE POLICY "Admins can view import queue"
  ON public.import_queue FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage import queue"
  ON public.import_queue FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Trigger for updated_at on import_queue
CREATE TRIGGER update_import_queue_updated_at
  BEFORE UPDATE ON public.import_queue
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();