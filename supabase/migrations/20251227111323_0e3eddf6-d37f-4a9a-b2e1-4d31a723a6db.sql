-- MUVO Score Engine v1.0
-- Add 'neutral' to signal_polarity enum
ALTER TYPE public.signal_polarity ADD VALUE IF NOT EXISTS 'neutral';

-- Add new fields for Score Engine v1.0
ALTER TABLE public.places ADD COLUMN IF NOT EXISTS muvo_score_raw numeric DEFAULT NULL;
ALTER TABLE public.places ADD COLUMN IF NOT EXISTS muvo_score_shown numeric DEFAULT NULL;
ALTER TABLE public.places ADD COLUMN IF NOT EXISTS muvo_confidence numeric DEFAULT 0;
ALTER TABLE public.places ADD COLUMN IF NOT EXISTS muvo_total_points integer DEFAULT 0;
ALTER TABLE public.places ADD COLUMN IF NOT EXISTS muvo_negative_ratio numeric DEFAULT 0;
ALTER TABLE public.places ADD COLUMN IF NOT EXISTS neutral_taps_total integer DEFAULT 0;
ALTER TABLE public.places ADD COLUMN IF NOT EXISTS neg_taps_decayed numeric DEFAULT 0;

-- Replace the calculate_muvo_score function with Score Engine v1.0 formula
CREATE OR REPLACE FUNCTION public.calculate_muvo_score_v1(
  p_pos_taps integer,
  p_neg_taps_decayed numeric
)
RETURNS TABLE(score_raw numeric, score_shown numeric, confidence numeric)
LANGUAGE plpgsql
IMMUTABLE
SET search_path TO 'public'
AS $$
DECLARE
  v_prior_k numeric := 30;
  v_confidence_c numeric := 60;
  v_total numeric;
  v_score_raw numeric;
  v_confidence numeric;
  v_score_shown numeric;
BEGIN
  v_total := p_pos_taps::numeric + p_neg_taps_decayed;
  
  -- Score raw formula: 50 + 50 * (P - N) / (P + N + K)
  v_score_raw := 50 + 50 * (p_pos_taps::numeric - p_neg_taps_decayed) / GREATEST(v_total + v_prior_k, 1);
  v_score_raw := GREATEST(0, LEAST(100, v_score_raw));
  
  -- Confidence: MIN(1, (P + N) / C)
  v_confidence := LEAST(1, v_total / v_confidence_c);
  
  -- Score shown with confidence shrink: 50 + (score_raw - 50) * confidence
  v_score_shown := 50 + (v_score_raw - 50) * v_confidence;
  v_score_shown := GREATEST(0, LEAST(100, v_score_shown));
  
  score_raw := ROUND(v_score_raw, 1);
  score_shown := ROUND(v_score_shown, 1);
  confidence := ROUND(v_confidence, 3);
  
  RETURN NEXT;
END;
$$;

-- Replace determine_medal_level with v1.0 quality gates
CREATE OR REPLACE FUNCTION public.determine_medal_level_v1(
  p_total_points integer,
  p_score_shown numeric,
  p_negative_ratio numeric,
  p_has_recurring_negative boolean
)
RETURNS muvo_medal_level
LANGUAGE plpgsql
IMMUTABLE
SET search_path TO 'public'
AS $$
BEGIN
  -- Platinum: total_points >= 2500, score >= 88, neg_ratio <= 0.18, no recurring negatives
  IF p_total_points >= 2500 
     AND p_score_shown >= 88 
     AND p_negative_ratio <= 0.18 
     AND NOT p_has_recurring_negative THEN
    RETURN 'platinum';
  END IF;
  
  -- Gold: total_points >= 1000, score >= 80, neg_ratio <= 0.25, no recurring negatives
  IF p_total_points >= 1000 
     AND p_score_shown >= 80 
     AND p_negative_ratio <= 0.25 
     AND NOT p_has_recurring_negative THEN
    RETURN 'gold';
  END IF;
  
  -- Silver: total_points >= 500, score >= 70 (recurring negatives allowed)
  IF p_total_points >= 500 AND p_score_shown >= 70 THEN
    RETURN 'silver';
  END IF;
  
  -- Bronze: total_points >= 100, score >= 60 (recurring negatives allowed)
  IF p_total_points >= 100 AND p_score_shown >= 60 THEN
    RETURN 'bronze';
  END IF;
  
  RETURN 'none';
END;
$$;

-- Updated recompute function with time-decay for negatives
CREATE OR REPLACE FUNCTION public.recompute_place_muvo_aggregates(p_place_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_pos_taps integer;
  v_neg_taps_raw integer;
  v_neutral_taps integer;
  v_neg_taps_decayed numeric;
  v_total_points integer;
  v_negative_ratio numeric;
  v_has_recurring_negative boolean;
  v_first_tap_at timestamp with time zone;
  v_active_weeks integer;
  v_score_result RECORD;
  v_old_medal public.muvo_medal_level;
  v_new_medal public.muvo_medal_level;
  v_half_life_days numeric := 365;
BEGIN
  -- Get current medal level for comparison
  SELECT muvo_medal_level INTO v_old_medal FROM public.places WHERE id = p_place_id;
  
  -- Calculate positive taps (sum of levels for positive polarity)
  SELECT COALESCE(SUM(level), 0) INTO v_pos_taps
  FROM public.review_signals
  WHERE place_id = p_place_id AND polarity = 'positive';
  
  -- Calculate raw negative taps (sum of levels for improvement polarity)
  SELECT COALESCE(SUM(level), 0) INTO v_neg_taps_raw
  FROM public.review_signals
  WHERE place_id = p_place_id AND polarity = 'improvement';
  
  -- Calculate neutral taps (sum of levels for neutral polarity) - informational only
  SELECT COALESCE(SUM(level), 0) INTO v_neutral_taps
  FROM public.review_signals
  WHERE place_id = p_place_id AND polarity = 'neutral';
  
  -- Calculate time-decayed negative taps
  -- decay_factor = 0.5 ^ (age_days / half_life_days)
  SELECT COALESCE(SUM(
    level * POWER(0.5, EXTRACT(DAY FROM (NOW() - created_at)) / v_half_life_days)
  ), 0) INTO v_neg_taps_decayed
  FROM public.review_signals
  WHERE place_id = p_place_id AND polarity = 'improvement';
  
  -- Total points (raw, for medal thresholds)
  v_total_points := v_pos_taps + v_neg_taps_raw;
  
  -- Negative ratio
  v_negative_ratio := CASE 
    WHEN v_total_points > 0 THEN v_neg_taps_raw::numeric / v_total_points::numeric
    ELSE 0
  END;
  
  -- Check for recurring negative (any single stamp_id with >= 12 points in last 90 days)
  SELECT EXISTS (
    SELECT 1
    FROM public.review_signals
    WHERE place_id = p_place_id 
      AND polarity = 'improvement'
      AND stamp_id IS NOT NULL
      AND created_at > NOW() - INTERVAL '90 days'
    GROUP BY stamp_id
    HAVING SUM(level) >= 12
  ) INTO v_has_recurring_negative;
  
  -- Get first MUVO tap timestamp
  SELECT MIN(created_at) INTO v_first_tap_at
  FROM public.review_signals
  WHERE place_id = p_place_id;
  
  -- Calculate active weeks (distinct weeks with activity)
  SELECT COUNT(DISTINCT date_trunc('week', created_at)) INTO v_active_weeks
  FROM public.review_signals
  WHERE place_id = p_place_id;
  
  -- Calculate MUVO score using v1.0 formula
  SELECT * INTO v_score_result
  FROM public.calculate_muvo_score_v1(v_pos_taps, v_neg_taps_decayed);
  
  -- Determine medal level using v1.0 quality gates
  v_new_medal := public.determine_medal_level_v1(
    v_total_points,
    v_score_result.score_shown,
    v_negative_ratio,
    v_has_recurring_negative
  );
  
  -- Update the place record
  UPDATE public.places
  SET
    pos_taps_total = v_pos_taps,
    neg_taps_total = v_neg_taps_raw,
    neutral_taps_total = v_neutral_taps,
    neg_taps_decayed = v_neg_taps_decayed,
    qual_taps_total = v_total_points,
    muvo_total_points = v_total_points,
    muvo_negative_ratio = v_negative_ratio,
    first_muvo_tap_at = v_first_tap_at,
    active_weeks_count = v_active_weeks,
    muvo_score_raw = v_score_result.score_raw,
    muvo_score_shown = v_score_result.score_shown,
    muvo_confidence = v_score_result.confidence,
    muvo_score = v_score_result.score_shown, -- Keep legacy field in sync
    muvo_medal_level = v_new_medal,
    medal_awarded_at = CASE
      WHEN v_old_medal = 'none' AND v_new_medal != 'none' THEN NOW()
      WHEN v_new_medal::text > v_old_medal::text THEN NOW()
      ELSE medal_awarded_at
    END
  WHERE id = p_place_id;
END;
$$;