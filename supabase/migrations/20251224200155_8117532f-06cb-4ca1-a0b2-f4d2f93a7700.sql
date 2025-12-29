-- ========================================
-- MUVO PLACE ENTRANCES - Add support for up to 6 entrances per place
-- ========================================

-- Entrance 1
ALTER TABLE public.places
  ADD COLUMN IF NOT EXISTS entrance_1_name TEXT,
  ADD COLUMN IF NOT EXISTS entrance_1_latitude NUMERIC,
  ADD COLUMN IF NOT EXISTS entrance_1_longitude NUMERIC,
  ADD COLUMN IF NOT EXISTS entrance_1_road TEXT,
  ADD COLUMN IF NOT EXISTS entrance_1_notes TEXT,
  ADD COLUMN IF NOT EXISTS entrance_1_is_primary BOOLEAN DEFAULT false;

-- Entrance 2
ALTER TABLE public.places
  ADD COLUMN IF NOT EXISTS entrance_2_name TEXT,
  ADD COLUMN IF NOT EXISTS entrance_2_latitude NUMERIC,
  ADD COLUMN IF NOT EXISTS entrance_2_longitude NUMERIC,
  ADD COLUMN IF NOT EXISTS entrance_2_road TEXT,
  ADD COLUMN IF NOT EXISTS entrance_2_notes TEXT,
  ADD COLUMN IF NOT EXISTS entrance_2_is_primary BOOLEAN DEFAULT false;

-- Entrance 3
ALTER TABLE public.places
  ADD COLUMN IF NOT EXISTS entrance_3_name TEXT,
  ADD COLUMN IF NOT EXISTS entrance_3_latitude NUMERIC,
  ADD COLUMN IF NOT EXISTS entrance_3_longitude NUMERIC,
  ADD COLUMN IF NOT EXISTS entrance_3_road TEXT,
  ADD COLUMN IF NOT EXISTS entrance_3_notes TEXT,
  ADD COLUMN IF NOT EXISTS entrance_3_is_primary BOOLEAN DEFAULT false;

-- Entrance 4
ALTER TABLE public.places
  ADD COLUMN IF NOT EXISTS entrance_4_name TEXT,
  ADD COLUMN IF NOT EXISTS entrance_4_latitude NUMERIC,
  ADD COLUMN IF NOT EXISTS entrance_4_longitude NUMERIC,
  ADD COLUMN IF NOT EXISTS entrance_4_road TEXT,
  ADD COLUMN IF NOT EXISTS entrance_4_notes TEXT,
  ADD COLUMN IF NOT EXISTS entrance_4_is_primary BOOLEAN DEFAULT false;

-- Entrance 5
ALTER TABLE public.places
  ADD COLUMN IF NOT EXISTS entrance_5_name TEXT,
  ADD COLUMN IF NOT EXISTS entrance_5_latitude NUMERIC,
  ADD COLUMN IF NOT EXISTS entrance_5_longitude NUMERIC,
  ADD COLUMN IF NOT EXISTS entrance_5_road TEXT,
  ADD COLUMN IF NOT EXISTS entrance_5_notes TEXT,
  ADD COLUMN IF NOT EXISTS entrance_5_is_primary BOOLEAN DEFAULT false;

-- Entrance 6
ALTER TABLE public.places
  ADD COLUMN IF NOT EXISTS entrance_6_name TEXT,
  ADD COLUMN IF NOT EXISTS entrance_6_latitude NUMERIC,
  ADD COLUMN IF NOT EXISTS entrance_6_longitude NUMERIC,
  ADD COLUMN IF NOT EXISTS entrance_6_road TEXT,
  ADD COLUMN IF NOT EXISTS entrance_6_notes TEXT,
  ADD COLUMN IF NOT EXISTS entrance_6_is_primary BOOLEAN DEFAULT false;