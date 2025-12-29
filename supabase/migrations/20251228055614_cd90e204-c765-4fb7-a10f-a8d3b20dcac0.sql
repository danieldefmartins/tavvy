-- MUVO Score Engine v2.0 - ChatGPT Spec Implementation
-- Fixes time decay half-life and implements the full sophisticated formula
-- Date: 2025-12-28

-- ============================================================================
-- PART 1: Fix Time Decay Half-Life (365 → 180 days)
-- ============================================================================

-- Updated scoring function with ChatGPT spec formula
CREATE OR REPLACE FUNCTION public.calculate_muvo_score_v2(
  p_pos_taps_weighted numeric,
  p_neg_taps_weighted numeric
)
RETURNS TABLE(score_raw numeric, score_shown numeric, confidence numeric)
LANGUAGE plpgsql
IMMUTABLE
SET search_path TO 'public'
AS $$
DECLARE
  v_alpha numeric := 1.00;      -- Positive weight (ChatGPT spec)
  v_beta numeric := 1.75;       -- Negative weight (ChatGPT spec) - negatives matter more!
  v_confidence_k numeric := 20; -- Confidence parameter (ChatGPT spec)
  
  v_p_prime numeric;
  v_n_prime numeric;
  v_net numeric;
  v_score_raw numeric;
  v_confidence numeric;
  v_score_shown numeric;
  v_volume numeric;
BEGIN
  -- Step 1: Square root transformations (ChatGPT spec)
  v_p_prime := SQRT(GREATEST(p_pos_taps_weighted, 0));
  v_n_prime := SQRT(GREATEST(p_neg_taps_weighted, 0));
  
  -- Step 2: Calculate net signal with weights (ChatGPT spec: α=1.00, β=1.75)
  v_net := (v_alpha * v_p_prime) - (v_beta * v_n_prime);
  
  -- Step 3: Sigmoid function to get score 0-100 (ChatGPT spec)
  -- sigmoid(x) = 1 / (1 + e^(-x))
  -- Score = 100 * sigmoid(Net / 2.0)
  v_score_raw := 100.0 / (1.0 + EXP(-v_net / 2.0));
  v_score_raw := GREATEST(0, LEAST(100, v_score_raw));
  
  -- Step 4: Confidence formula (ChatGPT spec: 1 - e^(-Volume/K))
  v_volume := p_pos_taps_weighted + p_neg_taps_weighted;
  v_confidence := 1.0 - EXP(-v_volume / v_confidence_k);
  v_confidence := GREATEST(0, LEAST(1, v_confidence));
  
  -- Step 5: Score shown with confidence shrink (ChatGPT spec)
  -- When confidence is low, score pulls toward 50 (neutral)
  v_score_shown := 50 + (v_score_raw - 50) * v_confidence;
  v_score_shown := GREATEST(0, LEAST(100, v_score_shown));
  
  score_raw := ROUND(v_score_raw, 1);
  score_shown := ROUND(v_score_shown, 1);
  confidence := ROUND(v_confidence, 3);
  
  RETURN NEXT;
END;
$$;

-- ============================================================================
-- PART 2: Updated Recompute Function with Correct Half-Life
-- ============================================================================

CREATE OR REPLACE FUNCTION public.recompute_place_muvo_aggregates_v2(p_place_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_pos_taps_raw integer;
  v_neg_taps_raw integer;
  v_neutral_taps integer;
  v_pos_taps_weighted numeric;
  v_neg_taps_weighted numeric;
  v_total_points integer;
  v_negative_ratio numeric;
  v_has_recurring_negative boolean;
  v_first_tap_at timestamp with time zone;
  v_active_weeks integer;
  v_score_result RECORD;
  v_old_medal public.muvo_medal_level;
  v_new_medal public.muvo_medal_level;
  v_half_life_days numeric := 180;  -- ✅ FIXED: ChatGPT spec says 180 days!
BEGIN
  -- Get current medal level for comparison
  SELECT muvo_medal_level INTO v_old_medal FROM public.places WHERE id = p_place_id;
  
  -- Calculate raw positive taps (sum of levels for positive polarity)
  SELECT COALESCE(SUM(level), 0) INTO v_pos_taps_raw
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
  
  -- ✅ Calculate time-weighted positive taps (ChatGPT spec)
  -- All taps decay over time, not just negatives!
  SELECT COALESCE(SUM(
    level * POWER(0.5, EXTRACT(DAY FROM (NOW() - created_at)) / v_half_life_days)
  ), 0) INTO v_pos_taps_weighted
  FROM public.review_signals
  WHERE place_id = p_place_id AND polarity = 'positive';
  
  -- ✅ Calculate time-weighted negative taps (ChatGPT spec)
  -- decay_factor = 0.5 ^ (age_days / 180)
  SELECT COALESCE(SUM(
    level * POWER(0.5, EXTRACT(DAY FROM (NOW() - created_at)) / v_half_life_days)
  ), 0) INTO v_neg_taps_weighted
  FROM public.review_signals
  WHERE place_id = p_place_id AND polarity = 'improvement';
  
  -- Total points (raw, for medal thresholds)
  v_total_points := v_pos_taps_raw + v_neg_taps_raw;
  
  -- Negative ratio (based on raw counts)
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
  
  -- ✅ Calculate MUVO score using v2.0 formula (ChatGPT spec)
  SELECT * INTO v_score_result
  FROM public.calculate_muvo_score_v2(v_pos_taps_weighted, v_neg_taps_weighted);
  
  -- Determine medal level using v1.0 quality gates (unchanged)
  v_new_medal := public.determine_medal_level_v1(
    v_total_points,
    v_score_result.score_shown,
    v_negative_ratio,
    v_has_recurring_negative
  );
  
  -- Update the place record
  UPDATE public.places
  SET
    pos_taps_total = v_pos_taps_raw,
    neg_taps_total = v_neg_taps_raw,
    neutral_taps_total = v_neutral_taps,
    neg_taps_decayed = v_neg_taps_weighted,  -- Store weighted value for display
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

-- ============================================================================
-- PART 3: Update Trigger to Use New Function
-- ============================================================================

-- Drop old trigger if exists
DROP TRIGGER IF EXISTS trigger_recompute_muvo_on_signal_change ON public.review_signals;

-- Update the trigger function to use v2
CREATE OR REPLACE FUNCTION public.trigger_recompute_muvo_aggregates()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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
  
  -- Recompute aggregates for the place using v2 function
  PERFORM public.recompute_place_muvo_aggregates_v2(v_place_id);
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- Create trigger using updated function
CREATE TRIGGER trigger_recompute_muvo_on_signal_change
  AFTER INSERT OR UPDATE OR DELETE ON public.review_signals
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_recompute_muvo_aggregates();