-- ============================================================
-- MUVO SCORING SYSTEM - TEST SUITE
-- Verify the scoring implementation matches specification
-- ============================================================

-- ============================================================
-- TEST DATA SETUP
-- ============================================================

-- Create test users
INSERT INTO users (id, email, created_at) VALUES
  ('00000000-0000-0000-0000-000000000001', 'user1@test.com', now() - interval '365 days'),
  ('00000000-0000-0000-0000-000000000002', 'user2@test.com', now() - interval '300 days'),
  ('00000000-0000-0000-0000-000000000003', 'user3@test.com', now() - interval '200 days'),
  ('00000000-0000-0000-0000-000000000004', 'user4@test.com', now() - interval '100 days'),
  ('00000000-0000-0000-0000-000000000005', 'user5@test.com', now() - interval '30 days')
ON CONFLICT (id) DO NOTHING;

-- Create test place
INSERT INTO places (id, name, slug, latitude, longitude, created_at) VALUES
  ('00000000-0000-0000-0000-000000000100', 'Test RV Park', 'test-rv-park', 34.0522, -118.2437, now() - interval '365 days')
ON CONFLICT (id) DO NOTHING;

-- Create test signals (if not exists)
INSERT INTO review_signals (id, slug, name, category, sort_order) VALUES
  ('00000000-0000-0000-0000-000000000201', 'great-location', 'Great Location', 'positive', 1),
  ('00000000-0000-0000-0000-000000000202', 'clean-facilities', 'Clean Facilities', 'positive', 2),
  ('00000000-0000-0000-0000-000000000203', 'friendly-staff', 'Friendly Staff', 'positive', 3),
  ('00000000-0000-0000-0000-000000000204', 'modern', 'Modern', 'neutral', 1),
  ('00000000-0000-0000-0000-000000000205', 'rustic', 'Rustic', 'neutral', 2),
  ('00000000-0000-0000-0000-000000000206', 'long-wait', 'Long Wait', 'negative', 1),
  ('00000000-0000-0000-0000-000000000207', 'noisy', 'Noisy', 'negative', 2)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- TEST 1: Time Decay Function
-- ============================================================

SELECT '=== TEST 1: Time Decay Function ===' as test_name;

-- Test decay at different ages
SELECT 
  age_days,
  calculate_time_decay(now() - (age_days || ' days')::interval, 180) as decay_factor,
  CASE 
    WHEN age_days = 0 THEN 'Should be ~1.0'
    WHEN age_days = 180 THEN 'Should be ~0.5'
    WHEN age_days = 360 THEN 'Should be ~0.25'
    WHEN age_days = 540 THEN 'Should be ~0.125'
    ELSE 'Other'
  END as expected
FROM (VALUES (0), (180), (360), (540)) as t(age_days);

-- ============================================================
-- TEST 2: Review Submission Limits
-- ============================================================

SELECT '=== TEST 2: Review Submission Limits ===' as test_name;

-- This should FAIL (no positive signals)
DO $$
BEGIN
  INSERT INTO place_reviews (id, place_id, user_id, created_at) VALUES
    ('00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000100', '00000000-0000-0000-0000-000000000001', now());
  
  -- This will fail the trigger
  RAISE NOTICE 'ERROR: Should have failed - no positive signals!';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'PASS: Correctly rejected review with no positive signals';
    ROLLBACK;
END $$;

-- ============================================================
-- TEST 3: Basic Score Calculation
-- ============================================================

SELECT '=== TEST 3: Basic Score Calculation ===' as test_name;

-- Create a review with mostly positive signals
INSERT INTO place_reviews (id, place_id, user_id, created_at) VALUES
  ('00000000-0000-0000-0000-000000000302', '00000000-0000-0000-0000-000000000100', '00000000-0000-0000-0000-000000000001', now() - interval '30 days')
ON CONFLICT (id) DO NOTHING;

-- Add positive taps
INSERT INTO place_review_signal_taps (review_id, signal_id, intensity) VALUES
  ('00000000-0000-0000-0000-000000000302', '00000000-0000-0000-0000-000000000201', 3), -- Great Location ×3
  ('00000000-0000-0000-0000-000000000302', '00000000-0000-0000-0000-000000000202', 2), -- Clean Facilities ×2
  ('00000000-0000-0000-0000-000000000302', '00000000-0000-0000-0000-000000000203', 2)  -- Friendly Staff ×2
ON CONFLICT DO NOTHING;

-- Add neutral tap (should not affect score)
INSERT INTO place_review_signal_taps (review_id, signal_id, intensity) VALUES
  ('00000000-0000-0000-0000-000000000302', '00000000-0000-0000-0000-000000000204', 1)  -- Modern ×1
ON CONFLICT DO NOTHING;

-- Calculate score
SELECT calculate_place_score('00000000-0000-0000-0000-000000000100');

-- Check result
SELECT 
  score_value,
  confidence,
  total_positive_taps,
  total_negative_taps,
  total_neutral_taps,
  medal,
  CASE 
    WHEN score_value > 70 THEN 'PASS: Score looks reasonable for positive-only review'
    ELSE 'FAIL: Score should be high for positive-only review'
  END as result
FROM place_scores
WHERE place_id = '00000000-0000-0000-0000-000000000100';

-- ============================================================
-- TEST 4: Recurring Negative Logic
-- ============================================================

SELECT '=== TEST 4: Recurring Negative Logic ===' as test_name;

-- Add multiple reviews with same negative signal (to make it "recurring")
INSERT INTO place_reviews (id, place_id, user_id, created_at) VALUES
  ('00000000-0000-0000-0000-000000000303', '00000000-0000-0000-0000-000000000100', '00000000-0000-0000-0000-000000000002', now() - interval '90 days'),
  ('00000000-0000-0000-0000-000000000304', '00000000-0000-0000-0000-000000000100', '00000000-0000-0000-0000-000000000003', now() - interval '60 days'),
  ('00000000-0000-0000-0000-000000000305', '00000000-0000-0000-0000-000000000100', '00000000-0000-0000-0000-000000000004', now() - interval '30 days')
ON CONFLICT (id) DO NOTHING;

-- Each review has positive + the SAME negative (to make it recurring)
INSERT INTO place_review_signal_taps (review_id, signal_id, intensity) VALUES
  -- Review 303
  ('00000000-0000-0000-0000-000000000303', '00000000-0000-0000-0000-000000000201', 2), -- Positive
  ('00000000-0000-0000-0000-000000000303', '00000000-0000-0000-0000-000000000206', 1), -- Noisy (negative)
  -- Review 304
  ('00000000-0000-0000-0000-000000000304', '00000000-0000-0000-0000-000000000202', 2), -- Positive
  ('00000000-0000-0000-0000-000000000304', '00000000-0000-0000-0000-000000000206', 1), -- Noisy (negative) - 2nd time
  -- Review 305
  ('00000000-0000-0000-0000-000000000305', '00000000-0000-0000-0000-000000000203', 2), -- Positive
  ('00000000-0000-0000-0000-000000000305', '00000000-0000-0000-0000-000000000206', 1)  -- Noisy (negative) - 3rd time (now recurring!)
ON CONFLICT DO NOTHING;

-- Check recurrence factor
SELECT 
  check_recurring_negative('00000000-0000-0000-0000-000000000100', '00000000-0000-0000-0000-000000000206') as recurrence_factor,
  CASE 
    WHEN check_recurring_negative('00000000-0000-0000-0000-000000000100', '00000000-0000-0000-0000-000000000206') = 1.3 
    THEN 'PASS: Correctly identified as recurring (≥3 times)'
    ELSE 'FAIL: Should be 1.3 for recurring negative'
  END as result;

-- Recalculate score (should be lower now due to recurring negative)
SELECT calculate_place_score('00000000-0000-0000-0000-000000000100');

SELECT 
  score_value,
  total_negative_taps,
  CASE 
    WHEN score_value < 85 THEN 'PASS: Score decreased due to recurring negative'
    ELSE 'FAIL: Recurring negative should have lowered score'
  END as result
FROM place_scores
WHERE place_id = '00000000-0000-0000-0000-000000000100';

-- ============================================================
-- TEST 5: Confidence Shrink (Low Data)
-- ============================================================

SELECT '=== TEST 5: Confidence Shrink ===' as test_name;

-- Create a new place with only 1 perfect review
INSERT INTO places (id, name, slug, latitude, longitude, created_at) VALUES
  ('00000000-0000-0000-0000-000000000101', 'New Place', 'new-place', 34.0522, -118.2437, now() - interval '7 days')
ON CONFLICT (id) DO NOTHING;

INSERT INTO place_reviews (id, place_id, user_id, created_at) VALUES
  ('00000000-0000-0000-0000-000000000306', '00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000005', now() - interval '5 days')
ON CONFLICT (id) DO NOTHING;

INSERT INTO place_review_signal_taps (review_id, signal_id, intensity) VALUES
  ('00000000-0000-0000-0000-000000000306', '00000000-0000-0000-0000-000000000201', 3), -- Great Location ×3
  ('00000000-0000-0000-0000-000000000306', '00000000-0000-0000-0000-000000000202', 3), -- Clean Facilities ×3
  ('00000000-0000-0000-0000-000000000306', '00000000-0000-0000-0000-000000000203', 3)  -- Friendly Staff ×3
ON CONFLICT DO NOTHING;

SELECT calculate_place_score('00000000-0000-0000-0000-000000000101');

SELECT 
  score_value,
  confidence,
  total_positive_taps,
  CASE 
    WHEN score_value < 90 THEN 'PASS: Confidence shrink prevented perfect score with low data'
    ELSE 'FAIL: Should not have perfect score with only 1 review'
  END as result
FROM place_scores
WHERE place_id = '00000000-0000-0000-0000-000000000101';

-- ============================================================
-- TEST 6: Medal Eligibility
-- ============================================================

SELECT '=== TEST 6: Medal Eligibility ===' as test_name;

-- Check medals for both places
SELECT 
  p.name,
  ps.score_value,
  ps.total_positive_taps + ps.total_negative_taps as volume,
  ps.medal,
  CASE 
    WHEN p.id = '00000000-0000-0000-0000-000000000100' AND ps.medal IS NOT NULL 
    THEN 'PASS: Established place has medal'
    WHEN p.id = '00000000-0000-0000-0000-000000000101' AND ps.medal IS NULL 
    THEN 'PASS: New place has no medal (not enough data)'
    ELSE 'Check manually'
  END as result
FROM places p
JOIN place_scores ps ON p.id = ps.place_id
WHERE p.id IN ('00000000-0000-0000-0000-000000000100', '00000000-0000-0000-0000-000000000101');

-- ============================================================
-- TEST 7: Display Functions
-- ============================================================

SELECT '=== TEST 7: Display Functions ===' as test_name;

-- Test place card display (3 lines)
SELECT * FROM get_place_card_signals('00000000-0000-0000-0000-000000000100');

-- Test top signals by category
SELECT 'Top Positive:' as category, * FROM get_top_signals_for_place('00000000-0000-0000-0000-000000000100', 'positive', 5);
SELECT 'Top Neutral:' as category, * FROM get_top_signals_for_place('00000000-0000-0000-0000-000000000100', 'neutral', 3);
SELECT 'Top Negative:' as category, * FROM get_top_signals_for_place('00000000-0000-0000-0000-000000000100', 'negative', 2);

-- ============================================================
-- TEST 8: Anti-Spam Protection
-- ============================================================

SELECT '=== TEST 8: Anti-Spam Protection ===' as test_name;

-- Check verification status
SELECT 
  u.email,
  uvs.review_count,
  uvs.phone_verified,
  CASE 
    WHEN uvs.review_count >= 1 THEN 'PASS: Review count tracked'
    ELSE 'FAIL: Review count not tracked'
  END as result
FROM users u
LEFT JOIN user_verification_status uvs ON u.id = uvs.user_id
WHERE u.id = '00000000-0000-0000-0000-000000000001';

-- ============================================================
-- SUMMARY
-- ============================================================

SELECT '=== TEST SUMMARY ===' as summary;
SELECT 'All tests completed. Review results above.' as message;
SELECT 'Key things to verify:' as checklist;
SELECT '1. Time decay function returns correct values' as item;
SELECT '2. Review limits are enforced' as item;
SELECT '3. Scores are calculated and stored' as item;
SELECT '4. Recurring negatives have higher weight' as item;
SELECT '5. Low-data places have confidence shrink' as item;
SELECT '6. Medals are awarded based on criteria' as item;
SELECT '7. Display functions return correct data' as item;
SELECT '8. Anti-spam tracking works' as item;

-- ============================================================
-- CLEANUP (Optional)
-- ============================================================

-- Uncomment to remove test data:
-- DELETE FROM place_review_signal_taps WHERE review_id LIKE '00000000-0000-0000-0000-0000000003%';
-- DELETE FROM place_reviews WHERE id LIKE '00000000-0000-0000-0000-0000000003%';
-- DELETE FROM places WHERE id IN ('00000000-0000-0000-0000-000000000100', '00000000-0000-0000-0000-000000000101');
-- DELETE FROM users WHERE id LIKE '00000000-0000-0000-0000-0000000000%';
-- DELETE FROM review_signals WHERE id LIKE '00000000-0000-0000-0000-0000000002%';
