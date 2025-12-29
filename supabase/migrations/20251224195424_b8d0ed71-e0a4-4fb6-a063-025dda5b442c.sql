-- ========================================
-- MUVO PLACE SCHEMA EXTENSION - PART 1: CORE FIELDS
-- ========================================

-- Create enums for new field types
CREATE TYPE public.yes_no_some AS ENUM ('yes', 'no', 'some', 'unknown');
CREATE TYPE public.yes_no_unknown AS ENUM ('yes', 'no', 'unknown');
CREATE TYPE public.yes_no_restricted AS ENUM ('yes', 'no', 'restricted', 'unknown');
CREATE TYPE public.yes_no_seasonal AS ENUM ('yes', 'no', 'seasonal', 'unknown');
CREATE TYPE public.road_type AS ENUM ('paved', 'gravel', 'dirt', 'sand', 'mixed', 'unknown');
CREATE TYPE public.road_condition AS ENUM ('good', 'ok', 'rough', 'muddy', 'unknown');
CREATE TYPE public.grade_type AS ENUM ('flat', 'moderate', 'steep', 'unknown');
CREATE TYPE public.electric_type AS ENUM ('none', '15a', '30a', '50a', 'mix', 'unknown');
CREATE TYPE public.water_type_enum AS ENUM ('potable', 'non_potable', 'unknown');
CREATE TYPE public.safety_level AS ENUM ('safe', 'use_caution', 'avoid_at_night', 'unknown');
CREATE TYPE public.noise_level AS ENUM ('quiet', 'moderate', 'loud', 'unknown');
CREATE TYPE public.pin_accuracy AS ENUM ('exact', 'approximate', 'unknown');
CREATE TYPE public.pool_heating AS ENUM ('both_heated', 'pool_only', 'hot_tub_only', 'not_heated', 'unknown');
CREATE TYPE public.photo_tag AS ENUM ('entrance', 'site', 'hookups', 'dump', 'water', 'bathrooms', 'sign', 'view', 'amenities', 'other');

-- Extend places table with all new fields
ALTER TABLE public.places
  -- Location extended
  ADD COLUMN IF NOT EXISTS address_line1 TEXT,
  ADD COLUMN IF NOT EXISTS address_line2 TEXT,
  ADD COLUMN IF NOT EXISTS county TEXT,
  ADD COLUMN IF NOT EXISTS postal_code TEXT,
  ADD COLUMN IF NOT EXISTS entrance_latitude NUMERIC,
  ADD COLUMN IF NOT EXISTS entrance_longitude NUMERIC,
  ADD COLUMN IF NOT EXISTS no_formal_address BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS pin_accuracy pin_accuracy DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS elevation_ft INTEGER,
  ADD COLUMN IF NOT EXISTS timezone TEXT,
  
  -- Contact extended
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS instagram_url TEXT,
  ADD COLUMN IF NOT EXISTS facebook_url TEXT,
  
  -- Hours/Season
  ADD COLUMN IF NOT EXISTS is_24_7 BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS hours_json JSONB,
  ADD COLUMN IF NOT EXISTS seasonal_open_months TEXT[],
  ADD COLUMN IF NOT EXISTS seasonal_notes TEXT,
  
  -- Short summary
  ADD COLUMN IF NOT EXISTS short_summary TEXT,
  
  -- Pricing extended
  ADD COLUMN IF NOT EXISTS nightly_rate_min NUMERIC,
  ADD COLUMN IF NOT EXISTS nightly_rate_max NUMERIC,
  ADD COLUMN IF NOT EXISTS fees_json JSONB,
  ADD COLUMN IF NOT EXISTS taxes_included yes_no_unknown DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS payment_types TEXT[],
  
  -- RV Core
  ADD COLUMN IF NOT EXISTS big_rig_friendly yes_no_some DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS max_rv_length_ft INTEGER,
  ADD COLUMN IF NOT EXISTS max_height_ft NUMERIC,
  ADD COLUMN IF NOT EXISTS road_type road_type DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS road_condition road_condition DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS grade grade_type DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS turnaround_available yes_no_unknown DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS towing_friendly yes_no_unknown DEFAULT 'unknown',
  
  -- Hookups
  ADD COLUMN IF NOT EXISTS electric electric_type DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS water_hookup yes_no_some DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS sewer_hookup yes_no_some DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS full_hookups yes_no_unknown DEFAULT 'unknown',
  
  -- Dump/Water
  ADD COLUMN IF NOT EXISTS dump_station yes_no_unknown DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS dump_fee_required yes_no_unknown DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS dump_fee_amount NUMERIC,
  ADD COLUMN IF NOT EXISTS fresh_water_fill yes_no_unknown DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS water_type water_type_enum DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS water_notes TEXT,
  
  -- Amenities
  ADD COLUMN IF NOT EXISTS restrooms yes_no_unknown DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS showers yes_no_unknown DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS laundry yes_no_unknown DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS wifi yes_no_unknown DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS cell_signal_notes TEXT,
  ADD COLUMN IF NOT EXISTS trash yes_no_unknown DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS recycling yes_no_unknown DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS fire_pits yes_no_unknown DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS picnic_tables yes_no_unknown DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS playground yes_no_unknown DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS dog_park yes_no_unknown DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS store_on_site yes_no_unknown DEFAULT 'unknown',
  
  -- Pool/Hot tub
  ADD COLUMN IF NOT EXISTS swimming_pool yes_no_unknown DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS hot_tub yes_no_unknown DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS pool_open_year_round yes_no_unknown DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS pool_heating pool_heating DEFAULT 'unknown',
  
  -- Packages/Delivery
  ADD COLUMN IF NOT EXISTS delivery_notes TEXT,
  
  -- Safety & Rules
  ADD COLUMN IF NOT EXISTS safety_level safety_level DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS noise_level noise_level DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS generators_allowed yes_no_restricted DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS generator_hours TEXT,
  ADD COLUMN IF NOT EXISTS campfires_allowed yes_no_seasonal DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS pets_allowed yes_no_restricted DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS rules_notes TEXT,
  
  -- Verification & Audit
  ADD COLUMN IF NOT EXISTS is_verified_place BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS created_by_user_id UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS external_refs_json JSONB;

-- Update place_photos to add tags
ALTER TABLE public.place_photos
  ADD COLUMN IF NOT EXISTS tags photo_tag[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS caption TEXT;

-- Create place drafts table for save-as-draft functionality
CREATE TABLE public.place_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  place_id UUID REFERENCES public.places(id) ON DELETE CASCADE, -- null for new places
  draft_data JSONB NOT NULL,
  current_step INTEGER DEFAULT 1,
  is_edit BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_place_drafts_user ON public.place_drafts(user_id);

-- Enable RLS on drafts
ALTER TABLE public.place_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own drafts"
  ON public.place_drafts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Verified users can create drafts"
  ON public.place_drafts FOR INSERT
  WITH CHECK (auth.uid() = user_id AND is_verified_user(auth.uid()));

CREATE POLICY "Users can update own drafts"
  ON public.place_drafts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own drafts"
  ON public.place_drafts FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_place_drafts_updated_at
  BEFORE UPDATE ON public.place_drafts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();