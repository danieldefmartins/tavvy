-- ========================================
-- MUVO MIGRATION SYSTEM - PART 3: DATA PROVENANCE & CLAIMING
-- ========================================

-- Place Data Provenance Table
-- Tracks the source and verification status of each field
CREATE TABLE public.place_data_provenance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id UUID NOT NULL REFERENCES public.places(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL,
  source external_source NOT NULL,
  value_at_import TEXT,
  imported_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_verified_at TIMESTAMP WITH TIME ZONE,
  verified_by UUID REFERENCES auth.users(id),
  confidence_score NUMERIC DEFAULT 0.5,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(place_id, field_name, source)
);

CREATE INDEX idx_provenance_place_id ON public.place_data_provenance(place_id);
CREATE INDEX idx_provenance_field ON public.place_data_provenance(field_name);

-- Place Claim / Ownership Table
CREATE TABLE public.place_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id UUID NOT NULL REFERENCES public.places(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Claim status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'revoked')),
  claim_type TEXT NOT NULL DEFAULT 'owner' CHECK (claim_type IN ('owner', 'manager', 'representative')),
  
  -- Verification
  verification_method TEXT,
  verification_notes TEXT,
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMP WITH TIME ZONE,
  
  -- Business info
  business_name TEXT,
  business_phone TEXT,
  business_email TEXT,
  business_website TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(place_id, user_id)
);

CREATE INDEX idx_claims_place_id ON public.place_claims(place_id);
CREATE INDEX idx_claims_user_id ON public.place_claims(user_id);
CREATE INDEX idx_claims_status ON public.place_claims(status);

-- Add new columns to places table for category system and metadata
ALTER TABLE public.places 
  ADD COLUMN IF NOT EXISTS category_id TEXT REFERENCES public.primary_categories(id),
  ADD COLUMN IF NOT EXISTS is_claimed BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS claimed_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS needs_review BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS import_source external_source,
  ADD COLUMN IF NOT EXISTS data_quality_score NUMERIC DEFAULT 0.5,
  ADD COLUMN IF NOT EXISTS last_verified_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS state TEXT,
  ADD COLUMN IF NOT EXISTS zip_code TEXT,
  ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'USA',
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS website TEXT,
  ADD COLUMN IF NOT EXISTS hours_of_operation JSONB;

-- Category Mapping Table
-- Maps external category names to MUVO categories
CREATE TABLE public.category_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source external_source NOT NULL,
  external_category TEXT NOT NULL,
  muvo_primary_category TEXT NOT NULL REFERENCES public.primary_categories(id),
  muvo_secondary_tags TEXT[],
  confidence NUMERIC NOT NULL DEFAULT 0.8,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(source, external_category)
);

-- Insert common category mappings for Google Maps
INSERT INTO public.category_mappings (source, external_category, muvo_primary_category, muvo_secondary_tags, confidence) VALUES
  ('google_maps', 'rv_park', 'rv_park', '{}', 1.0),
  ('google_maps', 'campground', 'campground', '{}', 1.0),
  ('google_maps', 'park', 'state_park', '{}', 0.6),
  ('google_maps', 'gas_station', 'fuel_station', '{}', 0.8),
  ('google_maps', 'restaurant', 'restaurant', '{}', 1.0),
  ('google_maps', 'cafe', 'cafe', '{}', 1.0),
  ('google_maps', 'lodging', 'hotel_motel', '{}', 0.8),
  ('google_maps', 'grocery_or_supermarket', 'grocery_store', '{}', 1.0),
  ('google_maps', 'hospital', 'hospital', '{}', 1.0),
  ('google_maps', 'pharmacy', 'pharmacy', '{}', 1.0),
  ('google_maps', 'car_repair', 'mechanic', '{}', 0.7),
  ('google_maps', 'hardware_store', 'hardware_store', '{}', 1.0),
  ('google_maps', 'museum', 'museum', '{}', 1.0),
  ('google_maps', 'tourist_attraction', 'landmark', '{}', 0.7);

-- Insert common category mappings for iOverlander
INSERT INTO public.category_mappings (source, external_category, muvo_primary_category, muvo_secondary_tags, confidence) VALUES
  ('ioverlander', 'Camp Spot', 'campground', '{}', 0.9),
  ('ioverlander', 'Wild Camping', 'boondocking', ARRAY['free'], 1.0),
  ('ioverlander', 'Established Campground', 'campground', ARRAY['paid'], 0.9),
  ('ioverlander', 'Informal Campsite', 'boondocking', '{}', 0.9),
  ('ioverlander', 'Water', 'water_fill', ARRAY['water_only'], 1.0),
  ('ioverlander', 'Dump Station', 'dump_station', ARRAY['dump_only'], 1.0),
  ('ioverlander', 'Propane', 'propane', '{}', 1.0),
  ('ioverlander', 'Gas Station', 'fuel_station', '{}', 0.9),
  ('ioverlander', 'Mechanic', 'rv_repair', '{}', 0.7),
  ('ioverlander', 'Parking Lot Camping', 'overnight_parking', '{}', 0.9),
  ('ioverlander', 'Rest Area', 'rest_area', '{}', 1.0);

-- Enable RLS
ALTER TABLE public.place_data_provenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.place_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.category_mappings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for place_data_provenance
CREATE POLICY "Anyone can view provenance"
  ON public.place_data_provenance FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage provenance"
  ON public.place_data_provenance FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- RLS Policies for place_claims
CREATE POLICY "Anyone can view approved claims"
  ON public.place_claims FOR SELECT
  USING (status = 'approved');

CREATE POLICY "Users can view own claims"
  ON public.place_claims FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Verified users can create claims"
  ON public.place_claims FOR INSERT
  WITH CHECK (auth.uid() = user_id AND is_verified_user(auth.uid()));

CREATE POLICY "Users can update own pending claims"
  ON public.place_claims FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Admins can manage all claims"
  ON public.place_claims FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- RLS Policies for category_mappings (read-only for all, admin-managed)
CREATE POLICY "Anyone can view category mappings"
  ON public.category_mappings FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage category mappings"
  ON public.category_mappings FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Triggers for updated_at
CREATE TRIGGER update_provenance_updated_at
  BEFORE UPDATE ON public.place_data_provenance
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_claims_updated_at
  BEFORE UPDATE ON public.place_claims
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();