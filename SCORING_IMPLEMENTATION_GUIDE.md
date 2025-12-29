# MUVO Scoring System - Implementation Guide

**Complete implementation of the MUVO review scoring algorithm**

---

## 🎯 **What This Is**

This is the **complete SQL implementation** of the MUVO scoring system as specified in `Pasted_content_17.txt`.

All the math is now implemented and ready to deploy!

---

## ✅ **What's Implemented**

### **1. Time Decay Function** ✅
```sql
calculate_time_decay(review_timestamp, half_life_days)
```
- Returns decay factor (0..1) based on age
- Default half-life: 180 days (6 months)
- Formula: `0.5^(age_days / 180)`

### **2. Recurring Negative Multiplier** ✅
```sql
check_recurring_negative(place_id, signal_id)
```
- Checks if negative signal appears ≥3 times in last 120 days
- Returns 1.3 if recurring (upweight)
- Returns 0.6 if not recurring (downweight)

### **3. Complete Scoring Algorithm** ✅
```sql
calculate_place_score(place_id)
```

**Steps:**
1. Calculate time-decayed positive sum (P)
2. Calculate time-decayed negative sum with recurrence multiplier (N_adj)
3. Track neutral sum (doesn't affect score)
4. Calculate quality ratio: R = P / (P + N_adj + ε)
5. Calculate confidence factor: C = volume / (volume + 30)
6. Apply Bayesian shrink: R_shrunk = C * R + (1 - C) * 0.70
7. Calculate final score: score = 100 * R_shrunk
8. Determine medal eligibility
9. Update `place_scores` table

### **4. Medal Eligibility Logic** ✅
```sql
check_medal_eligibility(place_id, score, volume)
```

**Criteria:**

**BRONZE:**
- Volume ≥ 25
- Score ≥ 78

**SILVER:**
- Volume ≥ 60
- Score ≥ 84
- At least 30 days since first review

**GOLD:**
- Volume ≥ 120
- Score ≥ 90
- At least 90 days since first review
- Last 30 days score ≥ 88

**PLATINUM:**
- Volume ≥ 250
- Score ≥ 94
- At least 180 days since first review
- Last 90 days score ≥ 92

### **5. Review Submission Limits** ✅
Enforced via trigger:
- **POSITIVE:** 1-5 signals (required at least 1)
- **NEUTRAL:** 0-3 signals
- **NEGATIVE:** 0-2 signals

### **6. Anti-Spam Protection** ✅
```sql
user_verification_status table
track_user_review_submission() trigger
```

**Features:**
- Track review count per user
- Require phone verification after 5 reviews
- Rate limit: max 10 reviews per day
- Track last review timestamp

### **7. Display Helper Functions** ✅
```sql
get_top_signals_for_place(place_id, category, limit)
get_place_card_signals(place_id)
```

**Place Card Display (3 lines):**
- Line 1: Top 1 POSITIVE signal (label + ×N)
- Line 2: Top 1 NEUTRAL signal (label + ×N)
- Line 3: Top 1 NEGATIVE signal (label + ×N) - only if exists

### **8. Auto-Recalculation Triggers** ✅
- Score recalculates automatically when:
  - New review is submitted
  - Review is updated
  - Review is deleted
  - Signal taps are modified

---

## 📋 **Files Included**

### **1. scoring-implementation.sql**
- Complete SQL implementation
- All functions, triggers, tables
- Ready to run on Supabase/PostgreSQL

### **2. scoring-test.sql**
- Comprehensive test suite
- 8 test scenarios
- Sample data for verification

### **3. SCORING_MATH_ANALYSIS.md**
- Gap analysis (what was missing)
- Comparison with specification
- Implementation approach

### **4. This guide**
- Deployment instructions
- Usage examples
- Troubleshooting

---

## 🚀 **Deployment Instructions**

### **Step 1: Run Base Schema**
```sql
-- First, run the base schema if not already done
\i muvo-complete-schema.sql
```

### **Step 2: Run Scoring Implementation**
```sql
-- Then run the scoring implementation
\i scoring-implementation.sql
```

### **Step 3: Verify Installation**
```sql
-- Check that all functions exist
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname LIKE '%score%' OR proname LIKE '%medal%';

-- Should see:
-- - calculate_place_score
-- - calculate_time_decay
-- - check_recurring_negative
-- - check_medal_eligibility
-- - trigger_recalculate_place_score
-- - get_top_signals_for_place
-- - get_place_card_signals
```

### **Step 4: Run Tests (Optional)**
```sql
-- Run the test suite to verify everything works
\i scoring-test.sql

-- Review test output to ensure all tests pass
```

### **Step 5: Seed Initial Data**
```sql
-- Make sure you have:
-- - Categories (primary + secondary)
-- - Signals (positive, neutral, negative)
-- - At least one place to test with
```

---

## 💡 **Usage Examples**

### **Example 1: Calculate Score for a Place**
```sql
-- Manually trigger score calculation
SELECT calculate_place_score('your-place-uuid-here');

-- View the result
SELECT * FROM place_scores WHERE place_id = 'your-place-uuid-here';
```

### **Example 2: Get Top Signals for Display**
```sql
-- Get top 5 positive signals
SELECT * FROM get_top_signals_for_place('place-uuid', 'positive', 5);

-- Get top 3 neutral signals
SELECT * FROM get_top_signals_for_place('place-uuid', 'neutral', 3);

-- Get top 2 negative signals
SELECT * FROM get_top_signals_for_place('place-uuid', 'negative', 2);
```

### **Example 3: Get Place Card Display (3 lines)**
```sql
-- Get the 3-line summary for a place card
SELECT * FROM get_place_card_signals('place-uuid');

-- Returns:
-- top_positive, top_positive_count
-- top_neutral, top_neutral_count
-- top_negative, top_negative_count
```

### **Example 4: Check if Negative is Recurring**
```sql
-- Check if a specific negative signal is recurring
SELECT check_recurring_negative('place-uuid', 'signal-uuid');

-- Returns:
-- 1.3 if recurring (≥3 times in last 120 days)
-- 0.6 if not recurring
```

### **Example 5: Submit a Review (with limits enforced)**
```sql
-- This will automatically:
-- 1. Check review limits (1-5 positive, 0-3 neutral, 0-2 negative)
-- 2. Track user review count
-- 3. Check phone verification (after 5 reviews)
-- 4. Recalculate place score

INSERT INTO place_reviews (place_id, user_id) 
VALUES ('place-uuid', 'user-uuid')
RETURNING id;

-- Then add signal taps
INSERT INTO place_review_signal_taps (review_id, signal_id, intensity) VALUES
  ('review-uuid', 'positive-signal-uuid', 3),  -- Great Food ×3
  ('review-uuid', 'positive-signal-uuid-2', 2), -- Clean ×2
  ('review-uuid', 'neutral-signal-uuid', 1),    -- Modern ×1
  ('review-uuid', 'negative-signal-uuid', 1);   -- Slow Service ×1

-- Score is automatically recalculated!
```

---

## 🔧 **Configuration**

### **Tunable Constants**

You can adjust these in the functions if needed:

**Time Decay:**
```sql
HALF_LIFE_DAYS = 180  -- Default: 6 months
-- Change to 365 for slower decay (1 year)
-- Change to 90 for faster decay (3 months)
```

**Confidence Shrink:**
```sql
K_SMOOTHING = 30  -- Default: need ~30 decayed points for confidence
BASELINE = 0.70   -- Default: unknown places start at 70%
```

**Recurring Negative:**
```sql
RECURRENCE_WINDOW_DAYS = 120  -- Default: check last 4 months
RECURRENCE_MIN_COUNT = 3      -- Default: ≥3 times = recurring
```

**Medal Thresholds:**
```sql
-- Adjust in check_medal_eligibility function:
-- BRONZE: volume ≥25, score ≥78
-- SILVER: volume ≥60, score ≥84, 30+ days
-- GOLD: volume ≥120, score ≥90, 90+ days
-- PLATINUM: volume ≥250, score ≥94, 180+ days
```

---

## 🎯 **Key Behaviors**

### **1. Old Negatives Fade Away** ✅
- Time decay reduces impact of old complaints
- After 180 days (1 half-life), a complaint has 50% weight
- After 360 days (2 half-lives), only 25% weight
- After 540 days (3 half-lives), only 12.5% weight

### **2. Recurring Problems Stay Heavy** ✅
- If a negative appears ≥3 times in 120 days: weight × 1.3
- If a negative is one-off: weight × 0.6
- This ensures repeated issues matter, one-off complaints don't

### **3. New Places Don't Look Perfect** ✅
- Confidence shrink pulls scores toward 70% baseline
- With only 1 review (volume ~3), confidence is low
- Score gets pulled down even if review is perfect
- As more reviews come in, confidence increases

### **4. Neutral Never Affects Score** ✅
- Neutral signals are tracked and displayed
- But they never enter the score calculation
- Users can filter by neutral (e.g., "Modern" vs "Rustic")

### **5. Medals Are Earned, Not Given** ✅
- Require both score AND volume AND time consistency
- PLATINUM requires 250+ volume, 94+ score, 180+ days
- Prevents gaming the system with a few fake reviews

---

## 🐛 **Troubleshooting**

### **Problem: Scores not updating**
**Solution:**
```sql
-- Check if triggers are enabled
SELECT tgname, tgenabled FROM pg_trigger 
WHERE tgname LIKE '%score%';

-- Manually recalculate
SELECT calculate_place_score('place-uuid');
```

### **Problem: Review submission fails**
**Possible causes:**
1. Not enough positive signals (need at least 1)
2. Too many signals (positive max 5, neutral max 3, negative max 2)
3. Phone verification required (after 5 reviews)
4. Daily limit reached (10 reviews per day)

**Check:**
```sql
SELECT * FROM user_verification_status WHERE user_id = 'user-uuid';
```

### **Problem: Medal not awarded**
**Check eligibility:**
```sql
SELECT 
  score_value,
  total_positive_taps + total_negative_taps as volume,
  medal,
  check_medal_eligibility(place_id, score_value, total_positive_taps + total_negative_taps) as should_be
FROM place_scores
WHERE place_id = 'place-uuid';
```

### **Problem: Recurring negative not detected**
**Check:**
```sql
-- Count recent occurrences
SELECT COUNT(DISTINCT pr.id)
FROM place_reviews pr
JOIN place_review_signal_taps prst ON pr.id = prst.review_id
WHERE pr.place_id = 'place-uuid'
  AND prst.signal_id = 'signal-uuid'
  AND pr.created_at >= (now() - interval '120 days');

-- Should be ≥3 for recurring
```

---

## 📊 **Performance Considerations**

### **Indexing**
All necessary indexes are included:
- `place_scores_score_idx` - For sorting by score
- `place_scores_medal_idx` - For filtering by medal
- `place_signal_aggregates_place_signal_idx` - For signal lookups

### **Optimization Tips**

1. **Batch Score Recalculation:**
```sql
-- If you need to recalculate all places:
SELECT calculate_place_score(id) FROM places;

-- Or use a background job
```

2. **Materialized Aggregates:**
The `place_signal_aggregates` table is updated via triggers, so reads are fast.

3. **Disable Triggers for Bulk Import:**
```sql
-- During initial data import:
ALTER TABLE place_reviews DISABLE TRIGGER recalculate_score_on_review_change;
-- ... import data ...
ALTER TABLE place_reviews ENABLE TRIGGER recalculate_score_on_review_change;
-- Then recalculate all scores
SELECT calculate_place_score(id) FROM places;
```

---

## ✅ **Verification Checklist**

Before going to production:

- [ ] Run `scoring-implementation.sql` successfully
- [ ] Run `scoring-test.sql` and verify all tests pass
- [ ] Create a test place and submit reviews
- [ ] Verify scores are calculated correctly
- [ ] Verify medals are awarded based on criteria
- [ ] Test review submission limits
- [ ] Test phone verification trigger (after 5 reviews)
- [ ] Test recurring negative detection
- [ ] Test time decay (create old reviews)
- [ ] Test display functions (place card, top signals)
- [ ] Performance test with 1000+ reviews

---

## 🎉 **You're Ready!**

The complete MUVO scoring system is now implemented and ready for production!

**What you have:**
- ✅ All math from specification
- ✅ Time decay (180-day half-life)
- ✅ Recurring negative multiplier
- ✅ Confidence shrink (Bayesian)
- ✅ Medal eligibility logic
- ✅ Review submission limits
- ✅ Anti-spam protection
- ✅ Auto-recalculation triggers
- ✅ Display helper functions
- ✅ Comprehensive test suite

**Next steps:**
1. Deploy to Supabase
2. Run tests
3. Integrate with frontend
4. Launch! 🚀

---

## 📞 **Support**

**If you need to modify the math:**
- Edit the functions in `scoring-implementation.sql`
- Adjust constants at the top of `calculate_place_score()`
- Re-run the function definitions
- Recalculate all scores

**If you find bugs:**
- Check the test suite output
- Verify your data matches expected format
- Review function comments for usage

**Good luck with MUVO!** 🎉
