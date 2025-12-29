# MUVO Schema Migration Guide
**From Simple Schema → Complete Production Schema**

---

## 📊 **Overview**

This guide helps you migrate from the existing simple schema to the complete production-ready schema with full multi-category support.

**Migration complexity:** Medium  
**Estimated time:** 2-4 hours (with team of 5: 1 hour in parallel)  
**Data loss risk:** Low (if following instructions)  
**Rollback:** Possible (keep backup)

---

## ⚠️ **BEFORE YOU START**

### **1. Backup Everything**
```sql
-- Export existing data
pg_dump your_database > backup_before_migration.sql
```

### **2. Test on Staging First**
- NEVER run this on production first
- Test the complete migration on a staging database
- Verify all data migrated correctly
- Test application functionality

### **3. Plan Downtime**
- Estimated downtime: 30-60 minutes
- Schedule during low-traffic period
- Notify users in advance

---

## 🎯 **Migration Strategy**

### **Option A: Fresh Start** (RECOMMENDED for new projects)
- Drop old schema
- Run complete new schema
- No data to migrate
- **Time:** 10 minutes
- **Risk:** None (no existing data)

### **Option B: Data Migration** (for existing data)
- Keep existing data
- Create new tables
- Migrate data with transformations
- Drop old tables
- **Time:** 2-4 hours
- **Risk:** Medium (data transformation)

---

## 🚀 **Option A: Fresh Start (Recommended)**

### **Step 1: Drop Old Schema**
```sql
-- WARNING: This deletes ALL data!
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
```

### **Step 2: Run Complete Schema**
```bash
psql your_database < muvo-complete-schema.sql
```

### **Step 3: Verify**
```sql
-- Check tables were created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Should see 30+ tables
```

### **Done!** ✅

---

## 🔄 **Option B: Data Migration (Existing Data)**

### **Phase 1: Prepare (10 min)**

#### **1. Backup**
```bash
pg_dump your_database > backup_$(date +%Y%m%d_%H%M%S).sql
```

#### **2. Create Migration Schema**
```sql
CREATE SCHEMA migration;
```

#### **3. Move Old Tables**
```sql
ALTER TABLE places SET SCHEMA migration;
ALTER TABLE reviews SET SCHEMA migration;
ALTER TABLE signals SET SCHEMA migration;
ALTER TABLE review_signals SET SCHEMA migration;
ALTER TABLE aggregated_signals SET SCHEMA migration;
```

---

### **Phase 2: Create New Schema (5 min)**

```bash
psql your_database < muvo-complete-schema.sql
```

This creates all new tables in `public` schema.

---

### **Phase 3: Migrate Data (30-60 min)**

#### **3.1: Migrate Users**
```sql
-- If you have existing users, migrate them
INSERT INTO users (id, email, created_at)
SELECT 
  id,
  email,
  created_at
FROM migration.users
ON CONFLICT (id) DO NOTHING;

-- Create basic profiles
INSERT INTO user_profiles (user_id, username, display_first_name, display_last_name)
SELECT 
  id,
  LOWER(REGEXP_REPLACE(email, '@.*', '')), -- username from email
  'User', -- placeholder
  SPLIT_PART(email, '@', 1) -- placeholder
FROM users
ON CONFLICT (user_id) DO NOTHING;
```

#### **3.2: Create Default Categories**
```sql
-- Categories are already seeded in new schema
-- Get category IDs for migration
SELECT id, slug, name FROM categories_primary;
SELECT id, slug, name FROM categories_secondary;
```

#### **3.3: Migrate Places**
```sql
-- Map old place_types to new categories
-- This is a MANUAL mapping - adjust based on your data

INSERT INTO places (
  id, name, description, lat, lng,
  primary_category_id, -- NEW: must map from old place_types
  address_line1, city, state_region, postal_code, country_code,
  phone_e164, website_url,
  created_at, updated_at, created_by,
  is_active
)
SELECT 
  p.id,
  p.name,
  p.description,
  p.latitude AS lat,
  p.longitude AS lng,
  
  -- MAP OLD place_types TO NEW primary_category_id
  CASE 
    WHEN 'restaurant' = ANY(p.place_types) THEN 
      (SELECT id FROM categories_primary WHERE slug = 'food_drink')
    WHEN 'rv_park' = ANY(p.place_types) OR 'campground' = ANY(p.place_types) THEN
      (SELECT id FROM categories_primary WHERE slug = 'lodging')
    ELSE
      (SELECT id FROM categories_primary WHERE slug = 'services') -- default
  END AS primary_category_id,
  
  p.address,
  p.city,
  p.state,
  p.zip_code,
  'US', -- default country
  p.phone,
  p.website,
  p.created_at,
  p.updated_at,
  p.created_by,
  p.is_active
FROM migration.places p
ON CONFLICT (id) DO NOTHING;

-- Add secondary categories (if applicable)
INSERT INTO place_secondary_categories (place_id, secondary_id, sort_order)
SELECT 
  p.id,
  CASE 
    WHEN 'italian' = ANY(p.place_types) THEN 
      (SELECT id FROM categories_secondary WHERE slug = 'restaurant' LIMIT 1)
    WHEN 'rv_park' = ANY(p.place_types) THEN
      (SELECT id FROM categories_secondary WHERE slug = 'rv_park' LIMIT 1)
    WHEN 'campground' = ANY(p.place_types) THEN
      (SELECT id FROM categories_secondary WHERE slug = 'campground' LIMIT 1)
  END AS secondary_id,
  0 AS sort_order
FROM migration.places p
WHERE secondary_id IS NOT NULL
ON CONFLICT (place_id, secondary_id) DO NOTHING;
```

#### **3.4: Migrate Signals**
```sql
-- Map old signals to new category-scoped signals

INSERT INTO review_signals (
  id, slug, label, emoji, bucket,
  is_global, primary_category_id,
  sort_order, is_active
)
SELECT 
  s.id,
  LOWER(REGEXP_REPLACE(s.name, ' ', '_', 'g')) AS slug,
  s.name AS label,
  s.emoji,
  CASE s.category
    WHEN 'what_stood_out' THEN 'positive'
    WHEN 'whats_it_like' THEN 'neutral'
    WHEN 'what_didnt_work' THEN 'negative'
  END AS bucket,
  
  -- Determine if global or category-specific
  CASE 
    WHEN 'all' = ANY(s.place_types) THEN true
    ELSE false
  END AS is_global,
  
  -- Map to primary category if not global
  CASE 
    WHEN 'all' = ANY(s.place_types) THEN NULL
    WHEN 'restaurant' = ANY(s.place_types) OR 'cafe' = ANY(s.place_types) THEN
      (SELECT id FROM categories_primary WHERE slug = 'food_drink')
    WHEN 'rv_park' = ANY(s.place_types) OR 'campground' = ANY(s.place_types) THEN
      (SELECT id FROM categories_primary WHERE slug = 'lodging')
    ELSE NULL
  END AS primary_category_id,
  
  0 AS sort_order,
  true AS is_active
FROM migration.signals s
ON CONFLICT (slug) DO NOTHING;
```

#### **3.5: Migrate Reviews**
```sql
INSERT INTO place_reviews (
  id, place_id, user_id,
  created_at, updated_at,
  public_note, -- if you had comments
  source, status
)
SELECT 
  r.id,
  r.place_id,
  r.user_id,
  r.created_at,
  r.updated_at,
  r.comment, -- if exists
  'app' AS source,
  'live' AS status
FROM migration.reviews r
ON CONFLICT (id) DO NOTHING;
```

#### **3.6: Migrate Review Signal Taps**
```sql
-- Old schema didn't have intensity, default to 1
INSERT INTO place_review_signal_taps (
  id, review_id, place_id, signal_id,
  intensity, -- NEW: default to 1
  created_at
)
SELECT 
  gen_random_uuid(),
  rs.review_id,
  r.place_id,
  rs.signal_id,
  1 AS intensity, -- default intensity
  r.created_at
FROM migration.review_signals rs
JOIN migration.reviews r ON r.id = rs.review_id
ON CONFLICT DO NOTHING;
```

#### **3.7: Rebuild Aggregates**
```sql
-- Aggregates will be auto-populated by triggers
-- But you can manually refresh:

-- This will take time if you have lots of data
SELECT signal_id, place_id, COUNT(*), SUM(intensity)
FROM place_review_signal_taps
GROUP BY signal_id, place_id;

-- Verify aggregates were created
SELECT COUNT(*) FROM place_signal_aggregates;
```

#### **3.8: Calculate Scores**
```sql
-- Calculate scores for all places
SELECT calculate_place_score(id) FROM places;

-- Verify scores
SELECT place_id, score_value, confidence, total_reviews
FROM place_scores
ORDER BY score_value DESC
LIMIT 10;
```

---

### **Phase 4: Verify Migration (15 min)**

#### **4.1: Check Counts**
```sql
-- Compare old vs new counts
SELECT 'Old Places' AS source, COUNT(*) FROM migration.places
UNION ALL
SELECT 'New Places', COUNT(*) FROM places;

SELECT 'Old Reviews' AS source, COUNT(*) FROM migration.reviews
UNION ALL
SELECT 'New Reviews', COUNT(*) FROM place_reviews;

SELECT 'Old Signals' AS source, COUNT(*) FROM migration.signals
UNION ALL
SELECT 'New Signals', COUNT(*) FROM review_signals;
```

#### **4.2: Spot Check Data**
```sql
-- Check a few places migrated correctly
SELECT 
  p.id,
  p.name,
  p.lat,
  p.lng,
  cp.name AS primary_category,
  p.created_at
FROM places p
JOIN categories_primary cp ON cp.id = p.primary_category_id
LIMIT 10;

-- Check reviews and signals
SELECT 
  pr.id,
  p.name AS place_name,
  COUNT(prst.id) AS signal_count
FROM place_reviews pr
JOIN places p ON p.id = pr.place_id
LEFT JOIN place_review_signal_taps prst ON prst.review_id = pr.id
GROUP BY pr.id, p.name
LIMIT 10;
```

#### **4.3: Check Aggregates**
```sql
-- Verify aggregates match raw data
SELECT 
  place_id,
  signal_id,
  tap_total,
  review_count
FROM place_signal_aggregates
ORDER BY tap_total DESC
LIMIT 20;
```

#### **4.4: Check Scores**
```sql
-- Verify scores were calculated
SELECT 
  p.name,
  ps.score_value,
  ps.confidence,
  ps.total_reviews
FROM place_scores ps
JOIN places p ON p.id = ps.place_id
ORDER BY ps.score_value DESC
LIMIT 20;
```

---

### **Phase 5: Cleanup (5 min)**

#### **5.1: Drop Old Schema** (ONLY after verification!)
```sql
-- DANGER: This deletes old data permanently!
-- Make sure migration was successful first!

DROP SCHEMA migration CASCADE;
```

#### **5.2: Vacuum & Analyze**
```sql
VACUUM ANALYZE;
```

---

## 🎯 **Post-Migration Checklist**

### **Database**
- [ ] All tables created
- [ ] All data migrated
- [ ] Counts match (places, reviews, signals)
- [ ] Aggregates populated
- [ ] Scores calculated
- [ ] Indexes created
- [ ] Triggers working
- [ ] RLS policies enabled

### **Application**
- [ ] Update database connection
- [ ] Update queries for new schema
- [ ] Update API endpoints
- [ ] Test place listing
- [ ] Test place detail
- [ ] Test review submission
- [ ] Test search
- [ ] Test filters (by category)

### **Performance**
- [ ] Run EXPLAIN ANALYZE on key queries
- [ ] Check index usage
- [ ] Monitor query performance
- [ ] Set up monitoring/alerts

---

## 🚨 **Rollback Plan**

If something goes wrong:

### **Option 1: Restore from Backup**
```bash
# Drop new schema
psql your_database -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# Restore backup
psql your_database < backup_before_migration.sql
```

### **Option 2: Restore from Migration Schema**
```sql
-- If you kept migration schema
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;

ALTER TABLE migration.places SET SCHEMA public;
ALTER TABLE migration.reviews SET SCHEMA public;
-- ... restore all tables
```

---

## 📊 **Expected Results**

### **New Tables (30+)**
- users, user_profiles
- categories_primary, categories_secondary
- places, place_secondary_categories
- place_entrances, place_hours, place_photos
- place_external_profiles, place_external_rating_snapshots
- review_signals, place_reviews, place_review_signal_taps
- place_signal_aggregates, place_scores
- memberships, user_memberships, place_membership_offers
- warning_types, place_warnings, place_warning_confirmations
- place_owner_posts
- content_flags
- legal_documents, user_legal_acceptances

### **New Features**
✅ Multi-category support (primary + secondary)  
✅ Category-scoped signals  
✅ Multi-entrance support  
✅ Hours of operation  
✅ Photo uploads with moderation  
✅ External ratings (Google/Yelp)  
✅ Scoring system with medals  
✅ Review intensity (1-3 taps)  
✅ Memberships  
✅ Warnings system  
✅ Owner posts  
✅ Content moderation  
✅ Legal consent tracking  

---

## ❓ **Need Help?**

### **Common Issues**

**Issue:** "Column doesn't exist"  
**Solution:** Your old schema has different column names. Update the migration SQL to match your actual column names.

**Issue:** "Foreign key violation"  
**Solution:** Migrate parent tables before child tables. Order: users → categories → places → reviews → signals.

**Issue:** "Aggregates don't match"  
**Solution:** Re-run the aggregate calculation: `SELECT calculate_place_score(id) FROM places;`

**Issue:** "Scores are all 0"  
**Solution:** Make sure reviews and signal taps were migrated first, then recalculate scores.

---

## 🎉 **Migration Complete!**

Once migration is successful:

1. ✅ Update application code to use new schema
2. ✅ Test all features thoroughly
3. ✅ Monitor performance
4. ✅ Set up backups
5. ✅ Document any custom changes

**You now have a production-ready, multi-category MUVO platform!** 🚀
