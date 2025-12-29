# MUVO Scoring Math - Implementation Analysis

**Comparing User's Specification vs Current Schema**

---

## 🎯 **Executive Summary**

**Status:** ⚠️ **PARTIAL IMPLEMENTATION**

The current schema has the **data structures** for scoring, but is **MISSING the actual math implementation** from the user's specification document.

---

## ✅ **What's Already Built (Data Structures)**

### **Tables:**
- ✅ `place_scores` - Stores final score, medal, confidence
- ✅ `place_reviews` - Stores reviews with timestamps
- ✅ `place_review_signal_taps` - Stores individual taps with intensity (1-3)
- ✅ `place_signal_aggregates` - Stores aggregated tap counts per signal
- ✅ `review_signals` - Defines signals with category (positive/neutral/negative)

### **Triggers:**
- ✅ Triggers update aggregates when reviews are created/updated
- ✅ Auto-update timestamps

---

## ❌ **What's MISSING (The Actual Math)**

The user's specification includes sophisticated scoring logic that is **NOT yet implemented**:

### **1. Time Decay Function** ❌
**User's Spec:**
```
HALF_LIFE_DAYS = 180
decay(age) = 0.5^(age_days / HALF_LIFE_DAYS)
weighted_intensity = intensity * decay(age_days)
```

**Current Schema:** No time decay implementation

---

### **2. Recurring Negative Multiplier** ❌
**User's Spec:**
```
If negative signal appears ≥3 times in last 120 days:
  recurrence_factor = 1.3 (upweight)
Else:
  recurrence_factor = 0.6 (downweight)
  
N_adj = Σ(weighted_intensity * recurrence_factor(signal))
```

**Current Schema:** No recurrence logic

---

### **3. Quality Ratio with Epsilon** ❌
**User's Spec:**
```
R = P / (P + N_adj + ε)
where ε = 1e-9
```

**Current Schema:** No ratio calculation

---

### **4. Confidence Shrink (Bayesian-style)** ❌
**User's Spec:**
```
C = volume / (volume + K)  where K = 30
B = 0.70  (baseline for unknown places)
R_shrunk = C * R + (1 - C) * B
score = 100 * R_shrunk
```

**Current Schema:** Has `confidence` field but no shrink logic

---

### **5. Medal Eligibility Logic** ❌
**User's Spec:**

**BRONZE:**
- volume_now ≥ 25
- score_now ≥ 78
- top recurring negative < 35% of N_adj

**SILVER:**
- volume_now ≥ 60
- score_now ≥ 84
- at least 30 days since first review

**GOLD:**
- volume_now ≥ 120
- score_now ≥ 90
- at least 90 days since first review
- last 30 days score ≥ 88

**PLATINUM:**
- volume_now ≥ 250
- score_now ≥ 94
- at least 180 days since first review
- last 90 days score ≥ 92

**Current Schema:** Has `medal` field but no eligibility logic

---

### **6. Neutral Signal Handling** ⚠️ PARTIAL
**User's Spec:**
```
Neutral signals:
- have tap intensity (×N)
- appear in UI
- NEVER affect score
```

**Current Schema:** 
- ✅ Neutral signals defined in `review_signals`
- ✅ Tracked in aggregates
- ❌ No explicit "ignore in score" logic (needs to be in function)

---

### **7. Review Submission Limits** ❌
**User's Spec:**
```
Per review:
- POSITIVE: 1-5 signals (required at least 1)
- NEUTRAL: 0-3 signals
- NEGATIVE: 0-2 signals
```

**Current Schema:** No constraints enforcing these limits

---

### **8. Anti-Spam Protection** ❌
**User's Spec:**
```
- Up to 5 reviews without phone verification
- On 6th review: require phone verification
- Optional: rate limiting (max 10/day)
```

**Current Schema:** No phone verification tracking or rate limiting

---

## 📊 **Gap Summary**

| Feature | Status | Priority |
|---------|--------|----------|
| Time Decay | ❌ Missing | **CRITICAL** |
| Recurring Negative Logic | ❌ Missing | **CRITICAL** |
| Quality Ratio | ❌ Missing | **CRITICAL** |
| Confidence Shrink | ❌ Missing | **CRITICAL** |
| Medal Eligibility | ❌ Missing | **HIGH** |
| Review Limits | ❌ Missing | **MEDIUM** |
| Anti-Spam | ❌ Missing | **MEDIUM** |
| Neutral Ignore Logic | ⚠️ Partial | **HIGH** |

---

## 🎯 **What Needs to Be Built**

### **1. SQL Function: `calculate_place_score(place_id)`**

This function should:
1. Get all reviews for the place with timestamps
2. Calculate time decay for each tap
3. Sum decayed positive taps (P)
4. Calculate recurring negative multiplier for each negative signal
5. Sum adjusted negative taps (N_adj)
6. Calculate quality ratio R
7. Calculate confidence factor C
8. Apply Bayesian shrink to get R_shrunk
9. Calculate final score (0-100)
10. Determine medal eligibility
11. Update `place_scores` table

### **2. SQL Function: `check_recurring_negative(place_id, signal_id)`**

Returns recurrence_factor (0.6 or 1.3) based on:
- Count of reviews in last 120 days containing this signal
- If count ≥ 3: return 1.3
- Else: return 0.6

### **3. SQL Function: `check_medal_eligibility(place_id, score, volume)`**

Returns medal ('bronze', 'silver', 'gold', 'platinum', or NULL) based on:
- Volume thresholds
- Score thresholds
- Time consistency (days since first review)
- Recent score health (last 30/90 days)
- Recurring negative severity

### **4. Table Constraints**

Add to `place_reviews`:
```sql
-- Count positive/neutral/negative signals per review
-- Enforce limits via trigger or check constraint
```

### **5. Anti-Spam Tables**

```sql
CREATE TABLE user_verification_status (
  user_id uuid PRIMARY KEY,
  review_count int DEFAULT 0,
  phone_verified boolean DEFAULT false,
  phone_verified_at timestamptz,
  last_review_at timestamptz
);
```

---

## 💡 **Implementation Approach**

### **Option A: PostgreSQL Functions** (Recommended)
- Write scoring logic in PL/pgSQL
- Call function after each review submission
- Pros: Fast, database-native, transactional
- Cons: Complex SQL

### **Option B: Application Layer**
- Implement scoring in TypeScript/JavaScript
- Run as background job
- Pros: Easier to test, more readable
- Cons: Slower, requires job queue

### **Option C: Hybrid**
- Core math in PostgreSQL functions
- Medal eligibility in application layer
- Pros: Balance of performance and maintainability
- Cons: Split logic across layers

---

## 🚀 **Recommendation**

**I should build the complete scoring implementation NOW:**

1. **SQL Functions** (2-3 hours):
   - `calculate_place_score(place_id)` with full math
   - `check_recurring_negative(place_id, signal_id)`
   - `check_medal_eligibility(place_id, score, volume)`

2. **Triggers** (30 min):
   - Auto-call scoring function when reviews change
   - Update `place_scores` table

3. **Constraints** (30 min):
   - Review submission limits
   - Anti-spam tracking

4. **Testing SQL** (1 hour):
   - Create sample data
   - Verify math matches specification
   - Test edge cases

**Total: 4-5 hours to complete scoring system**

---

## ❓ **Should I Build This Now?**

**YES, because:**
- Your team needs the complete scoring logic
- The math is complex and error-prone
- Better to have it working from day 1
- Testing requires real implementation

**NO, if:**
- Your team prefers to implement in application layer
- You want to iterate on the math first
- You have a data scientist who wants to own this

---

## 📋 **What You Have vs What You Need**

**Current State:**
- ✅ Data structures (tables, indexes)
- ✅ Basic aggregation (tap counts)
- ❌ Scoring math (time decay, recurrence, shrink)
- ❌ Medal logic
- ❌ Review limits
- ❌ Anti-spam

**After I Build:**
- ✅ Complete scoring implementation
- ✅ All math from specification
- ✅ Medal eligibility
- ✅ Review limits enforced
- ✅ Anti-spam tracking
- ✅ Ready for production

---

**Want me to build the complete scoring implementation?** 🚀
