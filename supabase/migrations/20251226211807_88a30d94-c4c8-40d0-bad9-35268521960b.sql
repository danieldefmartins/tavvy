-- MUVO Score + Medal System v1.4.2
-- Add medal_level enum
CREATE TYPE public.muvo_medal_level AS ENUM ('none', 'bronze', 'silver', 'gold', 'platinum');

-- Add MUVO score and medal columns to places table
ALTER TABLE public.places
ADD COLUMN IF NOT EXISTS pos_taps_total integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS neg_taps_total integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS qual_taps_total integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS neg_label_counts jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS top_neg_taps integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS repeat_neg_ratio numeric NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS neg_types_count integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS first_muvo_tap_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS active_weeks_count integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS muvo_score numeric,
ADD COLUMN IF NOT EXISTS muvo_medal_level public.muvo_medal_level NOT NULL DEFAULT 'none',
ADD COLUMN IF NOT EXISTS medal_awarded_at timestamp with time zone;

-- Function to calculate MUVO score based on the formula
CREATE OR REPLACE FUNCTION public.calculate_muvo_score(
  p_pos_taps integer,
  p_neg_taps integer,
  p_active_weeks integer,
  p_repeat_neg_ratio numeric,
  p_neg_types_count integer
)
RETURNS numeric
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  v_t integer;
  v_base numeric;
  v_repeat_penalty numeric;
  v_diversity_penalty numeric;
  v_time_bonus numeric;
  v_raw_score numeric;
  v_shrink numeric;
  v_score numeric;
  v_global_mean numeric := 75;
  v_k numeric := 80;
BEGIN
  v_t := p_pos_taps + p_neg_taps;
  
  -- Step 1: Base Quality
  v_base := 100.0 * (p_pos_taps::numeric / GREATEST(v_t, 1)::numeric);
  
  -- Step 2: Recurring Negative Penalty
  v_repeat_penalty := 1.0 - (0.35 * p_repeat_neg_ratio);
  v_repeat_penalty := GREATEST(0.65, LEAST(1.0, v_repeat_penalty));
  
  -- Step 3: Diversity Negative Penalty
  v_diversity_penalty := 1.0 - LEAST(0.20, 0.05 * p_neg_types_count);
  v_diversity_penalty := GREATEST(0.80, LEAST(1.0, v_diversity_penalty));
  
  -- Step 4: Time Consistency Bonus
  v_time_bonus := 1.0 + LEAST(0.10, 0.02 * p_active_weeks);
  v_time_bonus := GREATEST(1.0, LEAST(1.10, v_time_bonus));
  
  -- Raw Score
  v_raw_score := v_base * v_repeat_penalty * v_diversity_penalty * v_time_bonus;
  
  -- Step 5: Confidence Shrink
  v_shrink := v_t::numeric / (v_t::numeric + v_k);
  v_score := (v_shrink * v_raw_score) + ((1.0 - v_shrink) * v_global_mean);
  
  -- Clamp final score
  v_score := GREATEST(0, LEAST(100, v_score));
  
  RETURN ROUND(v_score, 1);
END;
$$;

-- Function to determine medal level based on thresholds
CREATE OR REPLACE FUNCTION public.determine_medal_level(
  p_qual_taps integer,
  p_days_since_first integer,
  p_repeat_neg_ratio numeric
)
RETURNS public.muvo_medal_level
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
BEGIN
  -- Platinum: T >= 2500, Days >= 180, RepeatNegRatio <= 0.40
  IF p_qual_taps >= 2500 AND p_days_since_first >= 180 AND p_repeat_neg_ratio <= 0.40 THEN
    RETURN 'platinum';
  END IF;
  
  -- Gold: T >= 1000, Days >= 90, RepeatNegRatio <= 0.50
  IF p_qual_taps >= 1000 AND p_days_since_first >= 90 AND p_repeat_neg_ratio <= 0.50 THEN
    RETURN 'gold';
  END IF;
  
  -- Silver: T >= 500, Days >= 45, RepeatNegRatio <= 0.60
  IF p_qual_taps >= 500 AND p_days_since_first >= 45 AND p_repeat_neg_ratio <= 0.60 THEN
    RETURN 'silver';
  END IF;
  
  -- Bronze: T >= 100, Days >= 14, RepeatNegRatio <= 0.70
  IF p_qual_taps >= 100 AND p_days_since_first >= 14 AND p_repeat_neg_ratio <= 0.70 THEN
    RETURN 'bronze';
  END IF;
  
  RETURN 'none';
END;
$$;

-- Function to recompute all aggregates for a place
CREATE OR REPLACE FUNCTION public.recompute_place_muvo_aggregates(p_place_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pos_taps integer;
  v_neg_taps integer;
  v_qual_taps integer;
  v_neg_label_counts jsonb;
  v_top_neg_taps integer;
  v_repeat_neg_ratio numeric;
  v_neg_types_count integer;
  v_first_tap_at timestamp with time zone;
  v_active_weeks integer;
  v_days_since_first integer;
  v_muvo_score numeric;
  v_old_medal public.muvo_medal_level;
  v_new_medal public.muvo_medal_level;
BEGIN
  -- Get current medal level for comparison
  SELECT muvo_medal_level INTO v_old_medal FROM public.places WHERE id = p_place_id;
  
  -- Calculate positive taps (sum of levels for positive polarity)
  SELECT COALESCE(SUM(level), 0) INTO v_pos_taps
  FROM public.review_signals
  WHERE place_id = p_place_id AND polarity = 'positive';
  
  -- Calculate negative taps (sum of levels for improvement polarity)
  SELECT COALESCE(SUM(level), 0) INTO v_neg_taps
  FROM public.review_signals
  WHERE place_id = p_place_id AND polarity = 'improvement';
  
  v_qual_taps := v_pos_taps + v_neg_taps;
  
  -- Calculate negative label counts (group by stamp_id for improvement signals)
  SELECT COALESCE(jsonb_object_agg(stamp_id, total), '{}'::jsonb)
  INTO v_neg_label_counts
  FROM (
    SELECT stamp_id, SUM(level) as total
    FROM public.review_signals
    WHERE place_id = p_place_id 
      AND polarity = 'improvement' 
      AND stamp_id IS NOT NULL
    GROUP BY stamp_id
  ) sub;
  
  -- Calculate top negative taps (max value from neg_label_counts)
  SELECT COALESCE(MAX((value)::integer), 0) INTO v_top_neg_taps
  FROM jsonb_each_text(v_neg_label_counts);
  
  -- Calculate repeat negative ratio
  v_repeat_neg_ratio := CASE 
    WHEN v_neg_taps > 0 THEN v_top_neg_taps::numeric / v_neg_taps::numeric
    ELSE 0
  END;
  
  -- Calculate neg_types_count (count of negative labels with >= 3 taps)
  SELECT COUNT(*) INTO v_neg_types_count
  FROM jsonb_each_text(v_neg_label_counts)
  WHERE (value)::integer >= 3;
  
  -- Get first MUVO tap timestamp
  SELECT MIN(created_at) INTO v_first_tap_at
  FROM public.review_signals
  WHERE place_id = p_place_id;
  
  -- Calculate active weeks (distinct weeks with activity)
  SELECT COUNT(DISTINCT date_trunc('week', created_at)) INTO v_active_weeks
  FROM public.review_signals
  WHERE place_id = p_place_id;
  
  -- Calculate days since first tap
  v_days_since_first := COALESCE(
    EXTRACT(DAY FROM (NOW() - v_first_tap_at))::integer,
    0
  );
  
  -- Calculate MUVO score
  v_muvo_score := public.calculate_muvo_score(
    v_pos_taps,
    v_neg_taps,
    v_active_weeks,
    v_repeat_neg_ratio,
    v_neg_types_count
  );
  
  -- Determine medal level
  v_new_medal := public.determine_medal_level(
    v_qual_taps,
    v_days_since_first,
    v_repeat_neg_ratio
  );
  
  -- Update the place record
  UPDATE public.places
  SET
    pos_taps_total = v_pos_taps,
    neg_taps_total = v_neg_taps,
    qual_taps_total = v_qual_taps,
    neg_label_counts = v_neg_label_counts,
    top_neg_taps = v_top_neg_taps,
    repeat_neg_ratio = v_repeat_neg_ratio,
    neg_types_count = v_neg_types_count,
    first_muvo_tap_at = v_first_tap_at,
    active_weeks_count = v_active_weeks,
    muvo_score = v_muvo_score,
    muvo_medal_level = v_new_medal,
    medal_awarded_at = CASE
      WHEN v_old_medal = 'none' AND v_new_medal != 'none' THEN NOW()
      WHEN v_new_medal::text > v_old_medal::text THEN NOW()
      ELSE medal_awarded_at
    END
  WHERE id = p_place_id;
END;
$$;

-- Trigger function to update aggregates when review signals change
CREATE OR REPLACE FUNCTION public.trigger_recompute_muvo_aggregates()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_place_id uuid;
BEGIN
  -- Get the place_id from the affected row
  IF TG_OP = 'DELETE' THEN
    v_place_id := OLD.place_id;
  ELSE
    v_place_id := NEW.place_id;
  END IF;
  
  -- Recompute aggregates for the place
  PERFORM public.recompute_place_muvo_aggregates(v_place_id);
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- Create triggers on review_signals for real-time updates
DROP TRIGGER IF EXISTS trg_muvo_aggregates_insert ON public.review_signals;
DROP TRIGGER IF EXISTS trg_muvo_aggregates_update ON public.review_signals;
DROP TRIGGER IF EXISTS trg_muvo_aggregates_delete ON public.review_signals;

CREATE TRIGGER trg_muvo_aggregates_insert
AFTER INSERT ON public.review_signals
FOR EACH ROW
EXECUTE FUNCTION public.trigger_recompute_muvo_aggregates();

CREATE TRIGGER trg_muvo_aggregates_update
AFTER UPDATE ON public.review_signals
FOR EACH ROW
EXECUTE FUNCTION public.trigger_recompute_muvo_aggregates();

CREATE TRIGGER trg_muvo_aggregates_delete
AFTER DELETE ON public.review_signals
FOR EACH ROW
EXECUTE FUNCTION public.trigger_recompute_muvo_aggregates();