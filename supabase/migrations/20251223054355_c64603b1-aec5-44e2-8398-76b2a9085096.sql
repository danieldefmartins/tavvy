-- Create place_stamp_aggregates table for storing aggregated stamp data
CREATE TABLE public.place_stamp_aggregates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  place_id UUID NOT NULL REFERENCES public.places(id) ON DELETE CASCADE,
  dimension public.review_dimension NOT NULL,
  polarity public.signal_polarity NOT NULL,
  total_votes INTEGER NOT NULL DEFAULT 0,
  review_count INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(place_id, dimension, polarity)
);

-- Add review_count to places table
ALTER TABLE public.places ADD COLUMN review_count INTEGER NOT NULL DEFAULT 0;

-- Enable RLS
ALTER TABLE public.place_stamp_aggregates ENABLE ROW LEVEL SECURITY;

-- Anyone can view aggregates (public data)
CREATE POLICY "Anyone can view stamp aggregates"
  ON public.place_stamp_aggregates
  FOR SELECT
  USING (true);

-- Only system can modify (via triggers)
CREATE POLICY "System can manage aggregates"
  ON public.place_stamp_aggregates
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX idx_place_stamp_aggregates_place_id ON public.place_stamp_aggregates(place_id);
CREATE INDEX idx_place_stamp_aggregates_ranking ON public.place_stamp_aggregates(place_id, polarity, total_votes DESC);

-- Function to update stamp aggregates when a review signal is added
CREATE OR REPLACE FUNCTION public.update_stamp_aggregate_on_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.place_stamp_aggregates (place_id, dimension, polarity, total_votes, review_count)
  VALUES (NEW.place_id, NEW.dimension, NEW.polarity, NEW.level, 1)
  ON CONFLICT (place_id, dimension, polarity)
  DO UPDATE SET
    total_votes = place_stamp_aggregates.total_votes + NEW.level,
    review_count = place_stamp_aggregates.review_count + 1,
    updated_at = now();
  RETURN NEW;
END;
$$;

-- Function to update stamp aggregates when a review signal is deleted
CREATE OR REPLACE FUNCTION public.update_stamp_aggregate_on_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.place_stamp_aggregates
  SET 
    total_votes = GREATEST(0, total_votes - OLD.level),
    review_count = GREATEST(0, review_count - 1),
    updated_at = now()
  WHERE place_id = OLD.place_id 
    AND dimension = OLD.dimension 
    AND polarity = OLD.polarity;
  
  -- Clean up zero-count rows
  DELETE FROM public.place_stamp_aggregates
  WHERE place_id = OLD.place_id 
    AND dimension = OLD.dimension 
    AND polarity = OLD.polarity
    AND review_count = 0;
  
  RETURN OLD;
END;
$$;

-- Function to update stamp aggregates when a review signal is updated
CREATE OR REPLACE FUNCTION public.update_stamp_aggregate_on_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Decrement old values
  UPDATE public.place_stamp_aggregates
  SET 
    total_votes = GREATEST(0, total_votes - OLD.level),
    review_count = GREATEST(0, review_count - 1),
    updated_at = now()
  WHERE place_id = OLD.place_id 
    AND dimension = OLD.dimension 
    AND polarity = OLD.polarity;
  
  -- Increment new values
  INSERT INTO public.place_stamp_aggregates (place_id, dimension, polarity, total_votes, review_count)
  VALUES (NEW.place_id, NEW.dimension, NEW.polarity, NEW.level, 1)
  ON CONFLICT (place_id, dimension, polarity)
  DO UPDATE SET
    total_votes = place_stamp_aggregates.total_votes + NEW.level,
    review_count = place_stamp_aggregates.review_count + 1,
    updated_at = now();
  
  -- Clean up zero-count rows
  DELETE FROM public.place_stamp_aggregates
  WHERE review_count = 0;
  
  RETURN NEW;
END;
$$;

-- Function to update place review count
CREATE OR REPLACE FUNCTION public.update_place_review_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.places
    SET review_count = review_count + 1
    WHERE id = NEW.place_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.places
    SET review_count = GREATEST(0, review_count - 1)
    WHERE id = OLD.place_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Create triggers for review_signals
CREATE TRIGGER trigger_stamp_aggregate_insert
  AFTER INSERT ON public.review_signals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_stamp_aggregate_on_insert();

CREATE TRIGGER trigger_stamp_aggregate_delete
  AFTER DELETE ON public.review_signals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_stamp_aggregate_on_delete();

CREATE TRIGGER trigger_stamp_aggregate_update
  AFTER UPDATE ON public.review_signals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_stamp_aggregate_on_update();

-- Create triggers for reviews (for review count)
CREATE TRIGGER trigger_place_review_count_insert
  AFTER INSERT ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_place_review_count();

CREATE TRIGGER trigger_place_review_count_delete
  AFTER DELETE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_place_review_count();

-- Backfill existing data
INSERT INTO public.place_stamp_aggregates (place_id, dimension, polarity, total_votes, review_count)
SELECT 
  place_id,
  dimension,
  polarity,
  SUM(level) as total_votes,
  COUNT(*) as review_count
FROM public.review_signals
GROUP BY place_id, dimension, polarity
ON CONFLICT (place_id, dimension, polarity)
DO UPDATE SET
  total_votes = EXCLUDED.total_votes,
  review_count = EXCLUDED.review_count,
  updated_at = now();

-- Backfill place review counts
UPDATE public.places p
SET review_count = (
  SELECT COUNT(*) FROM public.reviews r WHERE r.place_id = p.id
);