-- Fix security warning: Add explicit admin-only SELECT policy to import_queue
-- The table already has an admin SELECT policy, but let's ensure it's comprehensive

-- First, check existing policies and add if missing
-- The import_queue table should only be viewable by admins

-- Add RV-specific entrance fields (for up to 6 entrances)
-- Entrance 1
ALTER TABLE public.places ADD COLUMN IF NOT EXISTS entrance_1_max_rv_length_ft integer;
ALTER TABLE public.places ADD COLUMN IF NOT EXISTS entrance_1_max_rv_height_ft numeric;
ALTER TABLE public.places ADD COLUMN IF NOT EXISTS entrance_1_road_type text;
ALTER TABLE public.places ADD COLUMN IF NOT EXISTS entrance_1_grade text;
ALTER TABLE public.places ADD COLUMN IF NOT EXISTS entrance_1_tight_turns boolean;
ALTER TABLE public.places ADD COLUMN IF NOT EXISTS entrance_1_low_clearance boolean;
ALTER TABLE public.places ADD COLUMN IF NOT EXISTS entrance_1_seasonal_access text;
ALTER TABLE public.places ADD COLUMN IF NOT EXISTS entrance_1_seasonal_notes text;

-- Entrance 2
ALTER TABLE public.places ADD COLUMN IF NOT EXISTS entrance_2_max_rv_length_ft integer;
ALTER TABLE public.places ADD COLUMN IF NOT EXISTS entrance_2_max_rv_height_ft numeric;
ALTER TABLE public.places ADD COLUMN IF NOT EXISTS entrance_2_road_type text;
ALTER TABLE public.places ADD COLUMN IF NOT EXISTS entrance_2_grade text;
ALTER TABLE public.places ADD COLUMN IF NOT EXISTS entrance_2_tight_turns boolean;
ALTER TABLE public.places ADD COLUMN IF NOT EXISTS entrance_2_low_clearance boolean;
ALTER TABLE public.places ADD COLUMN IF NOT EXISTS entrance_2_seasonal_access text;
ALTER TABLE public.places ADD COLUMN IF NOT EXISTS entrance_2_seasonal_notes text;

-- Entrance 3
ALTER TABLE public.places ADD COLUMN IF NOT EXISTS entrance_3_max_rv_length_ft integer;
ALTER TABLE public.places ADD COLUMN IF NOT EXISTS entrance_3_max_rv_height_ft numeric;
ALTER TABLE public.places ADD COLUMN IF NOT EXISTS entrance_3_road_type text;
ALTER TABLE public.places ADD COLUMN IF NOT EXISTS entrance_3_grade text;
ALTER TABLE public.places ADD COLUMN IF NOT EXISTS entrance_3_tight_turns boolean;
ALTER TABLE public.places ADD COLUMN IF NOT EXISTS entrance_3_low_clearance boolean;
ALTER TABLE public.places ADD COLUMN IF NOT EXISTS entrance_3_seasonal_access text;
ALTER TABLE public.places ADD COLUMN IF NOT EXISTS entrance_3_seasonal_notes text;

-- Entrance 4
ALTER TABLE public.places ADD COLUMN IF NOT EXISTS entrance_4_max_rv_length_ft integer;
ALTER TABLE public.places ADD COLUMN IF NOT EXISTS entrance_4_max_rv_height_ft numeric;
ALTER TABLE public.places ADD COLUMN IF NOT EXISTS entrance_4_road_type text;
ALTER TABLE public.places ADD COLUMN IF NOT EXISTS entrance_4_grade text;
ALTER TABLE public.places ADD COLUMN IF NOT EXISTS entrance_4_tight_turns boolean;
ALTER TABLE public.places ADD COLUMN IF NOT EXISTS entrance_4_low_clearance boolean;
ALTER TABLE public.places ADD COLUMN IF NOT EXISTS entrance_4_seasonal_access text;
ALTER TABLE public.places ADD COLUMN IF NOT EXISTS entrance_4_seasonal_notes text;

-- Entrance 5
ALTER TABLE public.places ADD COLUMN IF NOT EXISTS entrance_5_max_rv_length_ft integer;
ALTER TABLE public.places ADD COLUMN IF NOT EXISTS entrance_5_max_rv_height_ft numeric;
ALTER TABLE public.places ADD COLUMN IF NOT EXISTS entrance_5_road_type text;
ALTER TABLE public.places ADD COLUMN IF NOT EXISTS entrance_5_grade text;
ALTER TABLE public.places ADD COLUMN IF NOT EXISTS entrance_5_tight_turns boolean;
ALTER TABLE public.places ADD COLUMN IF NOT EXISTS entrance_5_low_clearance boolean;
ALTER TABLE public.places ADD COLUMN IF NOT EXISTS entrance_5_seasonal_access text;
ALTER TABLE public.places ADD COLUMN IF NOT EXISTS entrance_5_seasonal_notes text;

-- Entrance 6
ALTER TABLE public.places ADD COLUMN IF NOT EXISTS entrance_6_max_rv_length_ft integer;
ALTER TABLE public.places ADD COLUMN IF NOT EXISTS entrance_6_max_rv_height_ft numeric;
ALTER TABLE public.places ADD COLUMN IF NOT EXISTS entrance_6_road_type text;
ALTER TABLE public.places ADD COLUMN IF NOT EXISTS entrance_6_grade text;
ALTER TABLE public.places ADD COLUMN IF NOT EXISTS entrance_6_tight_turns boolean;
ALTER TABLE public.places ADD COLUMN IF NOT EXISTS entrance_6_low_clearance boolean;
ALTER TABLE public.places ADD COLUMN IF NOT EXISTS entrance_6_seasonal_access text;
ALTER TABLE public.places ADD COLUMN IF NOT EXISTS entrance_6_seasonal_notes text;