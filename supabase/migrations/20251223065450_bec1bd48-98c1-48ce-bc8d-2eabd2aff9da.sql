-- Add avg_intensity column to place_stamp_aggregates
-- This stores the computed average intensity (total_votes / review_count)
ALTER TABLE public.place_stamp_aggregates 
ADD COLUMN IF NOT EXISTS avg_intensity numeric(3,2) GENERATED ALWAYS AS (
  CASE WHEN review_count > 0 THEN (total_votes::numeric / review_count::numeric) ELSE 0 END
) STORED;

-- Update the insert trigger to handle the new calculation (avg_intensity is auto-computed)
CREATE OR REPLACE FUNCTION public.update_stamp_aggregate_on_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Handle both old dimension-based and new stamp_id-based signals
  IF NEW.stamp_id IS NOT NULL THEN
    INSERT INTO public.place_stamp_aggregates (place_id, stamp_id, dimension, polarity, total_votes, review_count)
    VALUES (NEW.place_id, NEW.stamp_id, NEW.dimension, NEW.polarity, NEW.level, 1)
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
$function$;

-- Update the delete trigger
CREATE OR REPLACE FUNCTION public.update_stamp_aggregate_on_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF OLD.stamp_id IS NOT NULL THEN
    UPDATE public.place_stamp_aggregates
    SET 
      total_votes = GREATEST(0, total_votes - OLD.level),
      review_count = GREATEST(0, review_count - 1),
      updated_at = now()
    WHERE place_id = OLD.place_id 
      AND stamp_id = OLD.stamp_id;
    
    -- Clean up zero-count rows
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
    
    -- Clean up zero-count rows
    DELETE FROM public.place_stamp_aggregates
    WHERE place_id = OLD.place_id 
      AND dimension = OLD.dimension 
      AND polarity = OLD.polarity
      AND review_count = 0;
  END IF;
  
  RETURN OLD;
END;
$function$;

-- Update the update trigger for signal changes
CREATE OR REPLACE FUNCTION public.update_stamp_aggregate_on_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Decrement old values
  IF OLD.stamp_id IS NOT NULL THEN
    UPDATE public.place_stamp_aggregates
    SET 
      total_votes = GREATEST(0, total_votes - OLD.level),
      review_count = GREATEST(0, review_count - 1),
      updated_at = now()
    WHERE place_id = OLD.place_id 
      AND stamp_id = OLD.stamp_id;
  ELSIF OLD.dimension IS NOT NULL THEN
    UPDATE public.place_stamp_aggregates
    SET 
      total_votes = GREATEST(0, total_votes - OLD.level),
      review_count = GREATEST(0, review_count - 1),
      updated_at = now()
    WHERE place_id = OLD.place_id 
      AND dimension = OLD.dimension 
      AND polarity = OLD.polarity;
  END IF;
  
  -- Increment new values
  IF NEW.stamp_id IS NOT NULL THEN
    INSERT INTO public.place_stamp_aggregates (place_id, stamp_id, dimension, polarity, total_votes, review_count)
    VALUES (NEW.place_id, NEW.stamp_id, NEW.dimension, NEW.polarity, NEW.level, 1)
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
  
  -- Clean up zero-count rows
  DELETE FROM public.place_stamp_aggregates
  WHERE review_count = 0;
  
  RETURN NEW;
END;
$function$;

-- Ensure triggers are attached to review_signals table
DROP TRIGGER IF EXISTS trigger_stamp_aggregate_insert ON public.review_signals;
CREATE TRIGGER trigger_stamp_aggregate_insert
  AFTER INSERT ON public.review_signals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_stamp_aggregate_on_insert();

DROP TRIGGER IF EXISTS trigger_stamp_aggregate_delete ON public.review_signals;
CREATE TRIGGER trigger_stamp_aggregate_delete
  AFTER DELETE ON public.review_signals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_stamp_aggregate_on_delete();

DROP TRIGGER IF EXISTS trigger_stamp_aggregate_update ON public.review_signals;
CREATE TRIGGER trigger_stamp_aggregate_update
  AFTER UPDATE ON public.review_signals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_stamp_aggregate_on_update();