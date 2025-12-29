# MUVO Schema Gap Analysis
**Comparing existing schema vs comprehensive requirements**

---

## 📊 **Summary**

| Feature | Existing Schema | Required Schema | Status |
|---------|----------------|-----------------|--------|
| Users & Auth | Basic | Full OAuth + phone | ⚠️ **PARTIAL** |
| Categories | Simple | Primary + Secondary | ❌ **MISSING** |
| Places | Basic fields | Universal + robust | ⚠️ **PARTIAL** |
| Entrances | None | Multi-entrance support | ❌ **MISSING** |
| Hours | None | Day/time support | ❌ **MISSING** |
| Photos | None | Community + moderation | ❌ **MISSING** |
| External Ratings | None | Google/Yelp snapshots | ❌ **MISSING** |
| Signals | Simple | Category-scoped + buckets | ⚠️ **PARTIAL** |
| Reviews | Basic | Tap intensity + notes | ⚠️ **PARTIAL** |
| Aggregations | Materialized view | Real-time + cached | ⚠️ **PARTIAL** |
| Scoring | None | Score + medals + decay | ❌ **MISSING** |
| Memberships | None | User + place offers | ❌ **MISSING** |
| Warnings | None | Fast tap reporting | ❌ **MISSING** |
| Owner Posts | None | Tips + specials | ❌ **MISSING** |
| Moderation | None | Flags + status | ❌ **MISSING** |
| Legal | None | Terms + privacy consent | ❌ **MISSING** |

---

## ❌ **CRITICAL GAPS (Blockers)**

### **1. Category System** - ❌ **MISSING**

**What's missing:**
- Primary categories (1 per place)
- Secondary categories (0-2 per place)
- Category hierarchy
- Category-scoped signals

**Why critical:**
You said "any type of business from any category" - the current schema has NO category system! It only has a simple `place_types` array which is not robust.

**Impact:**
- Can't properly organize different business types
- Can't show category-specific signals
- Can't filter by category
- **BLOCKER for multi-category support**

---

### **2. Multi-Entrance Support** - ❌ **MISSING**

**What's missing:**
- `place_entrances` table
- Multiple GPS coordinates per place
- Entrance labels (Main, West, Car Rental, etc.)

**Why critical:**
Large venues (airports, malls, parks, resorts) have multiple entrances. Without this, users get lost.

**Impact:**
- Poor UX for large venues
- Can't navigate to correct entrance
- **BLOCKER for airports, malls, large parks**

---

### **3. Hours of Operation** - ❌ **MISSING**

**What's missing:**
- `place_hours` table
- Day of week + open/close times
- 24-hour support
- Closed days

**Why critical:**
Users need to know if a place is open NOW.

**Impact:**
- Users arrive when closed
- Poor UX
- **BLOCKER for restaurants, shops, services**

---

### **4. Photos System** - ❌ **MISSING**

**What's missing:**
- `place_photos` table
- Community uploads
- Owner photos
- Moderation flags
- Photo status (live/pending/removed)

**Why critical:**
Places without photos get skipped. Photos are the #1 engagement driver.

**Impact:**
- Low engagement
- Places look unprofessional
- **BLOCKER for visual appeal**

---

### **5. Scoring System** - ❌ **MISSING**

**What's missing:**
- `place_scores` table
- Score calculation (0-100)
- Time decay
- Confidence factor
- Medals (bronze/silver/gold/platinum)

**Why critical:**
You need to RANK places. Without scoring, how do you sort search results?

**Impact:**
- Can't sort by quality
- Can't show "best" places
- No gamification
- **BLOCKER for discovery**

---

## ⚠️ **HIGH PRIORITY GAPS**

### **6. External Ratings Integration** - ❌ **MISSING**

**What's missing:**
- `place_external_profiles` table
- `place_external_rating_snapshots` table
- Google/Yelp/TripAdvisor IDs
- Rating snapshots over time

**Why important:**
Users trust external ratings. Showing Google/Yelp ratings builds credibility.

**Impact:**
- Lower trust
- Users go to Google to verify
- Missed opportunity

---

### **7. Review Intensity (Tap Count)** - ⚠️ **PARTIAL**

**What's missing:**
- `intensity` field (1-3 taps per signal)
- Stronger signals = more weight

**Current schema:**
Just tracks which signals were tapped, not HOW MANY times.

**Why important:**
"Great Food ×3" is stronger than "Great Food ×1"

**Impact:**
- Less nuanced feedback
- Can't differentiate intensity
- Scoring is less accurate

---

### **8. Category-Scoped Signals** - ⚠️ **PARTIAL**

**What's missing:**
- Signals scoped to primary category
- Signals scoped to secondary category
- Global vs category-specific signals

**Current schema:**
Has `place_types` array but not proper category scoping.

**Why important:**
"Fresh Ingredients" only makes sense for restaurants, not RV parks.

**Impact:**
- Irrelevant signals shown
- Confusing UX
- Not scalable

---

### **9. Memberships System** - ❌ **MISSING**

**What's missing:**
- `memberships` table (Harvest Hosts, Passport America, etc.)
- `user_memberships` (user preferences)
- `place_membership_offers` (which places accept which memberships)

**Why important:**
RV users filter by memberships. Restaurant users filter by rewards programs.

**Impact:**
- Can't filter by membership
- Missed use case
- Lower value for specific user segments

---

### **10. Warnings System** - ❌ **MISSING**

**What's missing:**
- `warning_types` table
- `place_warnings` table
- `place_warning_confirmations` (crowd-sourced verification)

**Why important:**
Fast way to report issues (closed, moved, unsafe, etc.) without full review.

**Impact:**
- Outdated information
- Safety concerns
- Poor data quality

---

### **11. Owner Posts** - ❌ **MISSING**

**What's missing:**
- `place_owner_posts` table
- Owner tips, specials, updates
- Expiration dates

**Why important:**
Owners want to communicate with customers. "Chef's Special Today: Fish Tacos!"

**Impact:**
- No owner engagement
- Missed revenue opportunity
- Less dynamic content

---

### **12. Moderation System** - ❌ **MISSING**

**What's missing:**
- `content_flags` table
- Flag reasons
- Moderation workflow
- Status tracking

**Why important:**
You WILL get spam, inappropriate content, and abuse. You need moderation.

**Impact:**
- Platform quality degrades
- Legal liability
- User trust erodes
- **REQUIRED for scale**

---

## 🟢 **NICE-TO-HAVE GAPS**

### **13. Legal Consent Tracking** - ❌ **MISSING**

**What's missing:**
- `legal_documents` table
- `user_legal_acceptances` table
- Terms/Privacy version tracking

**Why useful:**
GDPR compliance, legal protection.

**Impact:**
- Legal risk
- Can't prove user consent
- Compliance issues

---

### **14. User Profiles Enhancement** - ⚠️ **PARTIAL**

**What's missing:**
- Username (unique, public)
- Display first/last name
- City/state/country
- Bio
- Avatar URL
- Public/private toggle

**Current schema:**
Basic user table, no rich profiles.

**Why useful:**
Social features, user identity, community building.

**Impact:**
- Less social engagement
- Anonymous feel
- Lower retention

---

## 🎯 **What You MUST Build**

### **For Multi-Category Support (Your Requirement):**

1. ✅ **Category System** (primary + secondary)
2. ✅ **Category-Scoped Signals** (different signals per category)
3. ✅ **Robust Place Fields** (universal + category-specific)
4. ✅ **Hours of Operation** (varies by category)
5. ✅ **Multi-Entrance Support** (large venues)

### **For Production Quality:**

6. ✅ **Photos System** (community + moderation)
7. ✅ **Scoring System** (rank/sort places)
8. ✅ **External Ratings** (Google/Yelp integration)
9. ✅ **Moderation** (flags + workflow)
10. ✅ **Warnings** (fast reporting)

### **For Business Model:**

11. ✅ **Memberships** (RV clubs, rewards programs)
12. ✅ **Owner Posts** (engagement + revenue)
13. ✅ **Review Intensity** (tap count 1-3)

---

## 📊 **Complexity Estimate**

| Feature | Tables | Complexity | Time (1 dev) |
|---------|--------|------------|--------------|
| Category System | 2 | Medium | 1 day |
| Multi-Entrance | 1 | Low | 4 hours |
| Hours | 1 | Low | 4 hours |
| Photos | 1 | Medium | 1 day |
| External Ratings | 2 | Medium | 1 day |
| Scoring | 1 | High | 2 days |
| Signals (category-scoped) | Modify existing | Medium | 1 day |
| Reviews (intensity) | Modify existing | Low | 4 hours |
| Aggregations | Modify existing | Medium | 1 day |
| Memberships | 3 | Medium | 1 day |
| Warnings | 3 | Low | 4 hours |
| Owner Posts | 1 | Low | 4 hours |
| Moderation | 1 | Low | 4 hours |
| Legal | 2 | Low | 2 hours |
| User Profiles | Modify existing | Low | 4 hours |

**Total: ~12-15 days (1 developer)**  
**With team of 5: ~3 days in parallel**

---

## 🚀 **Recommendation**

**Phase 1: Critical (3 days, team of 5)**
- Dev 1: Category system + category-scoped signals
- Dev 2: Photos + moderation
- Dev 3: Scoring system
- Dev 4: Hours + entrances + external ratings
- Dev 5: Review intensity + aggregations

**Phase 2: High Priority (2 days)**
- Memberships
- Warnings
- Owner posts
- Legal consent
- User profiles

**Total: 5 days to production-ready schema**

---

## ❓ **What Should I Build?**

I can build the **complete, production-ready schema** right now with ALL these features.

**Options:**

1. ✅ **Build complete schema** (all 16 features) - 3-4 hours
2. ✅ **Build critical only** (features 1-5) - 1-2 hours
3. ✅ **Build critical + high priority** (features 1-10) - 2-3 hours

**What do you want me to build?** 🤔
