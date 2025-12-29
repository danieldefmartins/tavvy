# MUVO 2.0 - Universal Review Platform

**The Google Maps Killer** 🚀

---

## 🎯 What Is MUVO 2.0?

MUVO 2.0 is a universal review platform that replaces star ratings with **frequency-based signals**. Instead of averaging opinions, MUVO shows you what ACTUALLY matters through tap-based reviews.

**Core Innovation:** Users tap signals (not stars), and you see how many people experienced each aspect. "89 people loved the food, 12 people noted slow service" - now YOU decide what matters!

---

## ✨ Key Features

### **For Users:**
- **Tap, Don't Type** - Review in 10 seconds by tapping signals
- **See Both Sides** - All feedback visible (good AND bad)
- **Your Decision** - No hidden reviews, no manipulation
- **Universal** - Works for ANY business (restaurants, hotels, RV parks, shops, services)

### **For Businesses:**
- **Fair Scoring** - Time decay means old negatives fade away
- **Recurring Detection** - One-off complaints don't tank your rating
- **Medals** - Bronze, Silver, Gold, Platinum for quality
- **Transparent** - Users see real feedback, not averaged stars

### **For Partners (B2B API):**
- **Network Effects** - Integrate MUVO into your app
- **Shared Database** - Everyone contributes, everyone benefits
- **Easy Integration** - JavaScript SDK, React components
- **Revenue Share** - Grow together

---

## 📦 What's In This Package?

### **Complete Codebase:**
- 90+ React components (production-tested UI)
- 27 custom hooks (data fetching, state management)
- 18 pages (complete user flows)
- Mobile-first, responsive design

### **Production Database:**
- 26 tables (places, reviews, signals, scores, medals)
- 57 indexes (optimized for read-heavy workload)
- 9 triggers (real-time aggregations)
- 7 helper functions (scoring, display)

### **Advanced Scoring:**
- Time decay (old reviews fade)
- Confidence shrink (Bayesian approach for new places)
- Recurring negative detection (upweight persistent problems)
- Medal system (bronze, silver, gold, platinum)
- Intensity support (1-3 taps per signal)

### **B2B API Platform:**
- REST API endpoints
- API key management
- JavaScript SDK
- React components
- Complete documentation

### **Documentation:**
- Component migration guide (24KB)
- API documentation
- Scoring implementation guide
- Deployment guide (this file)
- Schema documentation

---

## 🚀 Quick Start

### **For Your Team of 5:**

**Timeline:** 7 days to production

**Day 1:** Deploy database (Schema B + scoring)  
**Day 2:** Update hooks and core components  
**Day 3:** Update review flow with intensity  
**Day 4:** Add scoring display and medals  
**Day 5:** Integration testing  
**Day 6:** Polish and staging deploy  
**Day 7:** Production launch! 🎉  

**See `MUVO_2.0_DEPLOYMENT_GUIDE.md` for detailed instructions.**

---

## 🏗️ Architecture

### **Frontend:**
- React 19 + TypeScript
- Tailwind CSS 4
- React Query (data fetching)
- Wouter (routing)
- Capacitor (mobile apps)

### **Backend:**
- Supabase (PostgreSQL + Auth + Storage)
- PostGIS (spatial queries)
- Full-text search (tsvector + trigram)
- Row Level Security (RLS)

### **Scoring Algorithm:**
```
1. Time Decay: decay(age) = 0.5^(age_days / 180)
2. Recurring Multiplier: 1.3x if ≥3 occurrences, 0.6x if one-off
3. Quality Ratio: R = P / (P + N_adj + ε)
4. Confidence Shrink: R_shrunk = C * R + (1 - C) * 0.70
5. Final Score: score = 100 * R_shrunk
```

**Result:** Fair, transparent, time-aware scoring that rewards quality and forgives old mistakes.

---

## 📊 Database Schema

### **Core Tables:**
- `places` - Any business (restaurants, hotels, RV parks, etc.)
- `review_signals` - 45 pre-defined signals (15 per category)
- `place_reviews` - User reviews
- `place_review_signal_taps` - Individual taps (with intensity 1-3)
- `place_signal_aggregates` - Real-time counts (updated via triggers)
- `place_scores` - MUVO scores + medals

### **Advanced Features:**
- `place_entrances` - Multiple GPS coordinates for large venues
- `place_hours` - Open/close times per day
- `place_photos` - Community photos with moderation
- `place_membership_offers` - RV clubs, discount cards
- `place_warnings` - Crowd-sourced alerts (closed, moved, unsafe)
- `place_owner_posts` - Tips, specials, updates from owners

### **B2B API:**
- `api_partners` - Partner companies
- `api_keys` - Authentication keys
- `api_usage_logs` - Request tracking
- `api_webhooks` - Real-time notifications

**See `muvo-complete-schema.sql` for full schema.**

---

## 🎨 UI Components

### **Key Components (From GitHub Repo):**
- `UniversalPlaceCard` - Place cards for listing
- `PlaceDetail` - Full place page with all sections
- `PlaceSignalSummary` - Grouped signals by category
- `ReviewSubmit` - Tap-based review interface
- `MuvoMedalBadge` - Medal display (bronze, silver, gold, platinum)

### **Layouts:**
- **Places Page** - Grid/list view with search and filters
- **Place Detail** - Hero image, score, signals, reviews, photos
- **Review Flow** - 3 categories (positive, neutral, negative)

**All layouts are production-tested from live muvo.app!**

---

## 🔧 Migration from Schema A (RV-only)

If you have existing data from the RV-only version:

**Step 1:** Export existing data  
**Step 2:** Deploy Schema B  
**Step 3:** Import data with category mapping  
**Step 4:** Update component queries  
**Step 5:** Test and deploy  

**See `COMPONENT_MIGRATION_GUIDE.md` for detailed steps.**

---

## 📈 Roadmap

### **Phase 1: Launch** (Week 1)
- Deploy MUVO 2.0
- 100+ places
- 1,000+ reviews
- 50+ daily active users

### **Phase 2: B2B API** (Month 2-3)
- Deploy partner API
- Onboard 5-10 partners
- Publish SDK to NPM
- Start network effects

### **Phase 3: Mobile Apps** (Month 3-4)
- iOS app
- Android app
- Push notifications
- Offline mode

### **Phase 4: Advanced Features** (Month 4-6)
- Photo uploads
- Owner posts
- Warnings system
- External ratings integration

---

## 💡 Why MUVO Will Win

### **Problem with Star Ratings:**
- ❌ One bad review tanks everything
- ❌ Hidden reviews (platforms manipulate)
- ❌ No context (why 3 stars?)
- ❌ Businesses can't recover from old mistakes

### **MUVO Solution:**
- ✅ Frequency-based (89 loved food, 12 noted slow service)
- ✅ Transparent (all feedback visible)
- ✅ Time decay (old negatives fade)
- ✅ Fair to businesses (recurring detection)
- ✅ User empowerment (YOU decide what matters)

**Result:** Better for users, fairer to businesses, more accurate than stars!

---

## 🎯 Target Market

### **Primary:**
- Restaurants, cafes, bars
- Hotels, motels, B&Bs
- RV parks, campgrounds
- Shops, boutiques
- Services (salons, mechanics, etc.)

### **Secondary (B2B Partners):**
- Travel apps (RoadTrip Pro, iOverlander)
- Food apps (OpenTable, Resy)
- Booking platforms (Airbnb, Booking.com)
- Navigation apps (Waze, HERE)

**Total Addressable Market:** Every business with customer reviews = $10B+ market

---

## 📞 Support

### **Documentation:**
- `MUVO_2.0_DEPLOYMENT_GUIDE.md` - Deployment instructions
- `COMPONENT_MIGRATION_GUIDE.md` - Component updates
- `API_DOCUMENTATION.md` - B2B API reference
- `SCORING_IMPLEMENTATION_GUIDE.md` - Math explanation
- `SCHEMA_DOCUMENTATION.md` - Database reference

### **Key Files:**
- `muvo-complete-schema.sql` - Database schema (1,074 lines)
- `scoring-implementation.sql` - Scoring functions
- `api-schema-additions.sql` - B2B API tables

---

## 🏆 Success Metrics

### **Month 1:**
- 100+ places added
- 1,000+ reviews submitted
- 50+ daily active users
- <2 second page load times
- >95% review submission success rate

### **Month 3:**
- 1,000+ places
- 10,000+ reviews
- 500+ daily active users
- 10+ partner inquiries
- First B2B API customer

### **Month 6:**
- 10,000+ places
- 100,000+ reviews
- 5,000+ daily active users
- 5+ paying B2B partners
- Revenue positive

---

## 🎉 You're Ready!

**Everything you need to launch MUVO 2.0:**
- ✅ Complete codebase (4.4MB package)
- ✅ Production database (26 tables)
- ✅ Advanced scoring (time decay, medals)
- ✅ B2B API platform
- ✅ Complete documentation
- ✅ 7-day deployment plan
- ✅ Team roles assigned

**Timeline:** 7 days to production with team of 5

**Result:** Universal review platform ready to compete with Google Maps!

---

## 🚀 Let's Build the Future of Reviews!

**MUVO 2.0 is not just a review platform.**

**It's a movement toward:**
- Transparency (no hidden reviews)
- Fairness (businesses can recover)
- User empowerment (YOU decide)
- Network effects (everyone benefits)

**Together, we're building the Google Maps killer!** 💪

---

**Ready to deploy? Open `MUVO_2.0_DEPLOYMENT_GUIDE.md` and let's go!** 🎯
