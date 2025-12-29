-- Create stamp_definitions table for category-specific stamps
CREATE TABLE public.stamp_definitions (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  label TEXT NOT NULL,
  polarity TEXT NOT NULL CHECK (polarity IN ('positive', 'improvement')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_stamp_definitions_category ON public.stamp_definitions(category);
CREATE INDEX idx_stamp_definitions_category_polarity ON public.stamp_definitions(category, polarity, sort_order);

-- Enable RLS
ALTER TABLE public.stamp_definitions ENABLE ROW LEVEL SECURITY;

-- Anyone can view stamp definitions (public data)
CREATE POLICY "Anyone can view stamp definitions"
  ON public.stamp_definitions
  FOR SELECT
  USING (true);

-- Add stamp_id column to review_signals (nullable for migration)
ALTER TABLE public.review_signals ADD COLUMN stamp_id TEXT REFERENCES public.stamp_definitions(id);

-- Add stamp_id column to place_stamp_aggregates
ALTER TABLE public.place_stamp_aggregates ADD COLUMN stamp_id TEXT REFERENCES public.stamp_definitions(id);

-- Create category mapping function
CREATE OR REPLACE FUNCTION public.get_review_category(place_category public.place_category)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE place_category
    WHEN 'National Park' THEN 'national_parks'
    WHEN 'State Park' THEN 'national_parks'
    WHEN 'County / Regional Park' THEN 'national_parks'
    WHEN 'RV Campground' THEN 'campgrounds'
    WHEN 'Luxury RV Resort' THEN 'campgrounds'
    WHEN 'Overnight Parking' THEN 'campgrounds'
    WHEN 'Boondocking' THEN 'campgrounds'
    WHEN 'Business Allowing Overnight' THEN 'campgrounds'
    WHEN 'Rest Area / Travel Plaza' THEN 'campgrounds'
    WHEN 'Fairgrounds / Event Grounds' THEN 'campgrounds'
    ELSE 'campgrounds'
  END
$$;

-- Update trigger functions to handle new stamp_id
CREATE OR REPLACE FUNCTION public.update_stamp_aggregate_on_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Handle both old dimension-based and new stamp_id-based signals
  IF NEW.stamp_id IS NOT NULL THEN
    INSERT INTO public.place_stamp_aggregates (place_id, stamp_id, polarity, total_votes, review_count)
    VALUES (NEW.place_id, NEW.stamp_id, NEW.polarity, NEW.level, 1)
    ON CONFLICT (place_id, stamp_id) WHERE stamp_id IS NOT NULL
    DO UPDATE SET
      total_votes = place_stamp_aggregates.total_votes + NEW.level,
      review_count = place_stamp_aggregates.review_count + 1,
      updated_at = now();
  ELSIF NEW.dimension IS NOT NULL THEN
    INSERT INTO public.place_stamp_aggregates (place_id, dimension, polarity, total_votes, review_count)
    VALUES (NEW.place_id, NEW.dimension, NEW.polarity, NEW.level, 1)
    ON CONFLICT (place_id, dimension, polarity) WHERE dimension IS NOT NULL
    DO UPDATE SET
      total_votes = place_stamp_aggregates.total_votes + NEW.level,
      review_count = place_stamp_aggregates.review_count + 1,
      updated_at = now();
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_stamp_aggregate_on_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF OLD.stamp_id IS NOT NULL THEN
    UPDATE public.place_stamp_aggregates
    SET 
      total_votes = GREATEST(0, total_votes - OLD.level),
      review_count = GREATEST(0, review_count - 1),
      updated_at = now()
    WHERE place_id = OLD.place_id 
      AND stamp_id = OLD.stamp_id;
    
    DELETE FROM public.place_stamp_aggregates
    WHERE place_id = OLD.place_id 
      AND stamp_id = OLD.stamp_id
      AND review_count = 0;
  ELSIF OLD.dimension IS NOT NULL THEN
    UPDATE public.place_stamp_aggregates
    SET 
      total_votes = GREATEST(0, total_votes - OLD.level),
      review_count = GREATEST(0, review_count - 1),
      updated_at = now()
    WHERE place_id = OLD.place_id 
      AND dimension = OLD.dimension 
      AND polarity = OLD.polarity;
    
    DELETE FROM public.place_stamp_aggregates
    WHERE place_id = OLD.place_id 
      AND dimension = OLD.dimension 
      AND polarity = OLD.polarity
      AND review_count = 0;
  END IF;
  
  RETURN OLD;
END;
$$;

-- Add unique constraint for stamp_id aggregates
CREATE UNIQUE INDEX idx_place_stamp_aggregates_stamp_id 
  ON public.place_stamp_aggregates(place_id, stamp_id) 
  WHERE stamp_id IS NOT NULL;