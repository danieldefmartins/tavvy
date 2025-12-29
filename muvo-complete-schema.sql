/* ============================================================
MUVO — COMPLETE PRODUCTION-READY DATABASE SCHEMA (POSTGRES/SUPABASE)
Goal: Universal places platform for ANY business category
Features: Multi-category, signals, scoring, photos, moderation, etc.
============================================================ */

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- for full-text search

/* ============================================================
1) USERS + AUTH + PROFILES
============================================================ */

CREATE TABLE users (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email               text UNIQUE,
  phone_e164          text UNIQUE,
  password_hash       text, -- if not using OAuth-only
  oauth_provider      text, -- 'google', 'apple', etc
  oauth_subject       text, -- provider user id
  is_phone_verified   boolean NOT NULL DEFAULT false,
  is_email_verified   boolean NOT NULL DEFAULT false,
  created_at          timestamptz NOT NULL DEFAULT now(),
  last_login_at       timestamptz,
  
  CONSTRAINT email_or_phone_required CHECK (
    email IS NOT NULL OR phone_e164 IS NOT NULL
  )
);

CREATE INDEX users_email_idx ON users(email) WHERE email IS NOT NULL;
CREATE INDEX users_phone_idx ON users(phone_e164) WHERE phone_e164 IS NOT NULL;
CREATE INDEX users_oauth_idx ON users(oauth_provider, oauth_subject) WHERE oauth_provider IS NOT NULL;

CREATE TABLE user_profiles (
  user_id             uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  username            text NOT NULL UNIQUE, -- lowercase, no special chars
  display_first_name  text NOT NULL,
  display_last_name   text NOT NULL,
  city                text,
  state_region        text,
  country             text DEFAULT 'US',
  avatar_url          text,
  bio                 text,
  is_public           boolean NOT NULL DEFAULT true,
  
  CONSTRAINT username_format CHECK (username ~ '^[a-z0-9_]{3,20}$')
);

CREATE INDEX user_profiles_username_idx ON user_profiles(username);
CREATE INDEX user_profiles_location_idx ON user_profiles(country, state_region, city);


/* ============================================================
2) CATEGORIES (Primary + Secondary)
Primary: 1 per place (e.g., "Food & Drink")
Secondary: 0-2 per place (e.g., "Italian Restaurant", "Pizza")
============================================================ */

CREATE TABLE categories_primary (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        text NOT NULL UNIQUE,  -- e.g. 'food_drink', 'lodging', 'recreation'
  name        text NOT NULL,         -- 'Food & Drink', 'Lodging', 'Recreation'
  icon_key    text,                  -- optional icon mapping
  sort_order  int NOT NULL DEFAULT 0,
  is_active   boolean NOT NULL DEFAULT true
);

CREATE INDEX categories_primary_sort_idx ON categories_primary(sort_order, name);

CREATE TABLE categories_secondary (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  primary_id    uuid NOT NULL REFERENCES categories_primary(id) ON DELETE CASCADE,
  slug          text NOT NULL,       -- e.g. 'italian_restaurant', 'pizza'
  name          text NOT NULL,       -- 'Italian Restaurant', 'Pizza'
  icon_key      text,
  sort_order    int NOT NULL DEFAULT 0,
  is_active     boolean NOT NULL DEFAULT true,
  
  UNIQUE(primary_id, slug)
);

CREATE INDEX categories_secondary_primary_idx ON categories_secondary(primary_id, sort_order);


/* ============================================================
3) PLACES (Universal)
Supports ANY business type with category-specific fields
============================================================ */

CREATE TABLE places (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  /* Identity */
  name                    text NOT NULL,
  description             text,
  slug                    text UNIQUE, -- URL-friendly name

  /* Categories */
  primary_category_id     uuid NOT NULL REFERENCES categories_primary(id),
  -- secondary categories live in join table (max 2)

  /* Geo / Address */
  lat                     double precision NOT NULL,
  lng                     double precision NOT NULL,
  geography               geography(POINT, 4326), -- PostGIS for spatial queries
  address_line1           text,
  address_line2           text,
  city                    text,
  state_region            text,
  postal_code             text,
  county                  text,     -- for US filtering like "Broward County"
  country_code            text NOT NULL DEFAULT 'US',     -- ISO-3166-1 alpha2
  plus_code               text,     -- Google Plus Code

  /* Contact */
  phone_e164              text,
  website_url             text,
  email                   text,

  /* Social */
  instagram_url           text,
  facebook_url            text,
  tiktok_url              text,
  youtube_url             text,

  /* Metadata */
  established_year        int,
  price_level             smallint CHECK (price_level BETWEEN 1 AND 4), -- 1=$ to 4=$$$$
  is_active               boolean NOT NULL DEFAULT true,
  is_permanently_closed   boolean NOT NULL DEFAULT false,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now(),
  created_by              uuid REFERENCES users(id) ON DELETE SET NULL,

  /* Ownership */
  owner_user_id           uuid REFERENCES users(id) ON DELETE SET NULL,
  claimed_at              timestamptz,

  /* Verification */
  verification_status     text NOT NULL DEFAULT 'unverified', -- 'unverified','pending','verified'
  verified_at             timestamptz,
  verified_by_count       int NOT NULL DEFAULT 0,
  
  /* Search */
  search_vector           tsvector -- for full-text search
);

-- Spatial index for nearby search
CREATE INDEX places_geography_idx ON places USING GIST (geography);

-- Traditional geo index for compatibility
CREATE INDEX places_lat_lng_idx ON places(lat, lng);

-- Location indexes
CREATE INDEX places_country_state_city_idx ON places(country_code, state_region, city);
CREATE INDEX places_county_idx ON places(country_code, state_region, county) WHERE county IS NOT NULL;

-- Category indexes
CREATE INDEX places_primary_cat_idx ON places(primary_category_id);
CREATE INDEX places_active_idx ON places(is_active, is_permanently_closed);

-- Search index
CREATE INDEX places_search_idx ON places USING GIN (search_vector);
CREATE INDEX places_name_trgm_idx ON places USING GIN (name gin_trgm_ops);

-- Slug index
CREATE INDEX places_slug_idx ON places(slug) WHERE slug IS NOT NULL;

-- Auto-update geography from lat/lng
CREATE OR REPLACE FUNCTION update_place_geography()
RETURNS TRIGGER AS $$
BEGIN
  NEW.geography = ST_SetSRID(ST_MakePoint(NEW.lng, NEW.lat), 4326)::geography;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER places_geography_trigger
  BEFORE INSERT OR UPDATE OF lat, lng ON places
  FOR EACH ROW
  EXECUTE FUNCTION update_place_geography();

-- Auto-update search_vector
CREATE OR REPLACE FUNCTION update_place_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector = 
    setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.city, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(NEW.state_region, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER places_search_vector_trigger
  BEFORE INSERT OR UPDATE OF name, description, city, state_region ON places
  FOR EACH ROW
  EXECUTE FUNCTION update_place_search_vector();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER places_updated_at_trigger
  BEFORE UPDATE ON places
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Secondary categories join (max 2 enforced by trigger)
CREATE TABLE place_secondary_categories (
  place_id        uuid NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  secondary_id    uuid NOT NULL REFERENCES categories_secondary(id) ON DELETE CASCADE,
  sort_order      smallint NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  
  PRIMARY KEY(place_id, secondary_id)
);

CREATE INDEX place_secondary_categories_place_idx ON place_secondary_categories(place_id);
CREATE INDEX place_secondary_categories_secondary_idx ON place_secondary_categories(secondary_id);

-- Enforce max 2 secondary categories
CREATE OR REPLACE FUNCTION enforce_max_secondary_categories()
RETURNS TRIGGER AS $$
DECLARE
  category_count int;
BEGIN
  SELECT COUNT(*) INTO category_count
  FROM place_secondary_categories
  WHERE place_id = NEW.place_id;
  
  IF category_count >= 2 THEN
    RAISE EXCEPTION 'A place can have at most 2 secondary categories';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER place_secondary_categories_limit_trigger
  BEFORE INSERT ON place_secondary_categories
  FOR EACH ROW
  EXECUTE FUNCTION enforce_max_secondary_categories();


/* ============================================================
4) ENTRANCES (Multi-entrance support)
Large venues can have multiple entrances with different GPS coordinates
============================================================ */

CREATE TABLE place_entrances (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id        uuid NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  label           text NOT NULL DEFAULT 'Main Entrance', -- 'West Entrance', 'Car Rental', 'Terminal A'
  lat             double precision NOT NULL,
  lng             double precision NOT NULL,
  geography       geography(POINT, 4326),
  address_line1   text,
  city            text,
  state_region    text,
  postal_code     text,
  country_code    text,
  is_main         boolean NOT NULL DEFAULT false,
  sort_order      int NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX place_entrances_place_idx ON place_entrances(place_id, sort_order);
CREATE INDEX place_entrances_geography_idx ON place_entrances USING GIST (geography);

-- Auto-update geography
CREATE TRIGGER entrance_geography_trigger
  BEFORE INSERT OR UPDATE OF lat, lng ON place_entrances
  FOR EACH ROW
  EXECUTE FUNCTION update_place_geography();

-- Ensure only one main entrance per place
CREATE UNIQUE INDEX place_entrances_main_idx ON place_entrances(place_id) WHERE is_main = true;


/* ============================================================
5) HOURS (Hours of operation)
============================================================ */

CREATE TABLE place_hours (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id      uuid NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  day_of_week   smallint NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday
  open_time     time,
  close_time    time,
  is_closed     boolean NOT NULL DEFAULT false,
  is_24h        boolean NOT NULL DEFAULT false,
  note          text, -- 'Happy Hour 4-6pm', 'Breakfast only'
  
  UNIQUE(place_id, day_of_week)
);

CREATE INDEX place_hours_place_idx ON place_hours(place_id, day_of_week);


/* ============================================================
6) PHOTOS (Community + Owner)
============================================================ */

CREATE TABLE place_photos (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id        uuid NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  uploaded_by     uuid REFERENCES users(id) ON DELETE SET NULL,
  url             text NOT NULL,
  thumbnail_url   text,
  caption         text,
  is_owner_photo  boolean NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now(),

  /* Moderation */
  status          text NOT NULL DEFAULT 'live', -- 'live','pending','removed'
  flagged_count   int NOT NULL DEFAULT 0,
  removed_reason  text,
  removed_at      timestamptz,
  removed_by      uuid REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX place_photos_place_idx ON place_photos(place_id, created_at DESC);
CREATE INDEX place_photos_status_idx ON place_photos(status);
CREATE INDEX place_photos_user_idx ON place_photos(uploaded_by) WHERE uploaded_by IS NOT NULL;


/* ============================================================
7) EXTERNAL RATINGS (Google/Yelp/TripAdvisor)
We store IDs + snapshot rating numbers (NOT proprietary content)
============================================================ */

CREATE TABLE place_external_profiles (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id          uuid NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  provider          text NOT NULL, -- 'google','yelp','tripadvisor','facebook'
  external_place_id text NOT NULL,
  external_url      text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  
  UNIQUE(provider, external_place_id),
  UNIQUE(place_id, provider)
);

CREATE INDEX place_external_profiles_place_idx ON place_external_profiles(place_id);

CREATE TABLE place_external_rating_snapshots (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id      uuid NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  provider      text NOT NULL,
  rating_value  numeric(3,2), -- e.g. 4.70
  rating_count  int,
  captured_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX external_rating_snapshots_place_provider_idx 
  ON place_external_rating_snapshots(place_id, provider, captured_at DESC);


/* ============================================================
8) SIGNAL CATALOG (The stamps/tags)
Signals can be global OR category-scoped
============================================================ */

CREATE TABLE review_signals (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  /* Signal identity */
  slug                  text NOT NULL UNIQUE,  -- 'great_food', 'felt_safe', 'rustic'
  label                 text NOT NULL,         -- user-facing text
  emoji                 text,                  -- optional
  icon_key              text,                  -- optional icon mapping

  /* Bucket: positive / neutral / negative */
  bucket                text NOT NULL CHECK (bucket IN ('positive','neutral','negative')),

  /* Scope control */
  is_global             boolean NOT NULL DEFAULT false,  -- can appear on any place
  primary_category_id   uuid REFERENCES categories_primary(id) ON DELETE CASCADE,
  secondary_category_id uuid REFERENCES categories_secondary(id) ON DELETE CASCADE,
  is_active             boolean NOT NULL DEFAULT true,

  sort_order            int NOT NULL DEFAULT 0,
  created_at            timestamptz NOT NULL DEFAULT now(),
  
  /* Ensure either global OR category-scoped, not both */
  CONSTRAINT signal_scope_check CHECK (
    (is_global = true AND primary_category_id IS NULL AND secondary_category_id IS NULL) OR
    (is_global = false AND primary_category_id IS NOT NULL)
  )
);

CREATE INDEX review_signals_bucket_idx ON review_signals(bucket, sort_order);
CREATE INDEX review_signals_scope_idx ON review_signals(primary_category_id, secondary_category_id);
CREATE INDEX review_signals_active_idx ON review_signals(is_active) WHERE is_active = true;


/* ============================================================
9) REVIEWS (Tap-based, not text)
Each review can include multiple signals with intensity (1-3 taps)
============================================================ */

CREATE TABLE place_reviews (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id            uuid NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  user_id             uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),

  /* Optional comments (kept separate from signals) */
  private_note_owner  text, -- only owner sees this
  public_note         text, -- everyone sees this

  /* Spam controls */
  source              text NOT NULL DEFAULT 'app', -- 'app','import','admin','api'
  status              text NOT NULL DEFAULT 'live', -- 'live','shadow','removed'
  
  /* Prevent spam: one review per user per place per day */
  UNIQUE(user_id, place_id, DATE(created_at))
);

CREATE INDEX place_reviews_place_idx ON place_reviews(place_id, created_at DESC);
CREATE INDEX place_reviews_user_idx ON place_reviews(user_id, created_at DESC);
CREATE INDEX place_reviews_status_idx ON place_reviews(status);

-- Auto-update updated_at
CREATE TRIGGER place_reviews_updated_at_trigger
  BEFORE UPDATE ON place_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Each review has many tapped signals with intensity
CREATE TABLE place_review_signal_taps (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id     uuid NOT NULL REFERENCES place_reviews(id) ON DELETE CASCADE,
  place_id      uuid NOT NULL REFERENCES places(id) ON DELETE CASCADE, -- denormalized for speed
  signal_id     uuid NOT NULL REFERENCES review_signals(id) ON DELETE RESTRICT,

  /* intensity = tap count for that signal in that review (1..3) */
  intensity     smallint NOT NULL CHECK (intensity BETWEEN 1 AND 3),

  created_at    timestamptz NOT NULL DEFAULT now(),
  
  /* One signal per review */
  UNIQUE(review_id, signal_id)
);

CREATE INDEX review_signal_taps_place_idx ON place_review_signal_taps(place_id, signal_id);
CREATE INDEX review_signal_taps_signal_idx ON place_review_signal_taps(signal_id);
CREATE INDEX review_signal_taps_review_idx ON place_review_signal_taps(review_id);


/* ============================================================
10) AGGREGATIONS (Fast read) — "×N" counts
Per-place signal totals for fast display
============================================================ */

CREATE TABLE place_signal_aggregates (
  place_id       uuid NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  signal_id      uuid NOT NULL REFERENCES review_signals(id) ON DELETE CASCADE,
  bucket         text NOT NULL CHECK (bucket IN ('positive','neutral','negative')),
  tap_total      int NOT NULL DEFAULT 0,     -- sum of intensities across all reviews
  review_count   int NOT NULL DEFAULT 0,     -- number of reviews that included this signal
  last_tap_at    timestamptz,
  
  PRIMARY KEY(place_id, signal_id)
);

CREATE INDEX place_signal_aggs_place_bucket_idx ON place_signal_aggregates(place_id, bucket, tap_total DESC);
CREATE INDEX place_signal_aggs_signal_idx ON place_signal_aggregates(signal_id);

-- Function to update aggregates when taps change
CREATE OR REPLACE FUNCTION update_signal_aggregates()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO place_signal_aggregates (place_id, signal_id, bucket, tap_total, review_count, last_tap_at)
    SELECT 
      NEW.place_id,
      NEW.signal_id,
      rs.bucket,
      NEW.intensity,
      1,
      NEW.created_at
    FROM review_signals rs
    WHERE rs.id = NEW.signal_id
    ON CONFLICT (place_id, signal_id) DO UPDATE
    SET 
      tap_total = place_signal_aggregates.tap_total + NEW.intensity,
      review_count = place_signal_aggregates.review_count + 1,
      last_tap_at = NEW.created_at;
      
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE place_signal_aggregates
    SET 
      tap_total = GREATEST(0, tap_total - OLD.intensity),
      review_count = GREATEST(0, review_count - 1)
    WHERE place_id = OLD.place_id AND signal_id = OLD.signal_id;
    
    -- Remove aggregate if count reaches 0
    DELETE FROM place_signal_aggregates
    WHERE place_id = OLD.place_id AND signal_id = OLD.signal_id AND review_count = 0;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_signal_aggregates_trigger
  AFTER INSERT OR DELETE ON place_review_signal_taps
  FOR EACH ROW
  EXECUTE FUNCTION update_signal_aggregates();


/* ============================================================
11) SCORE + MEDALS (Computed + stored)
Score changes over time via decay
============================================================ */

CREATE TABLE place_scores (
  place_id            uuid PRIMARY KEY REFERENCES places(id) ON DELETE CASCADE,

  /* Score 0-100 */
  score_value         numeric(6,2) NOT NULL DEFAULT 0,

  /* Confidence controls */
  confidence          numeric(5,2) NOT NULL DEFAULT 0, -- 0..100
  total_positive_taps int NOT NULL DEFAULT 0,
  total_negative_taps int NOT NULL DEFAULT 0,
  total_neutral_taps  int NOT NULL DEFAULT 0, -- tracked but not scored
  total_reviews       int NOT NULL DEFAULT 0,

  /* Medal */
  medal               text CHECK (medal IN ('bronze','silver','gold','platinum')),
  medal_awarded_at    timestamptz,

  /* External ratings (cached for display) */
  google_rating_value numeric(3,2),
  google_rating_count int,
  yelp_rating_value   numeric(3,2),
  yelp_rating_count   int,

  last_computed_at    timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX place_scores_score_idx ON place_scores(score_value DESC);
CREATE INDEX place_scores_medal_idx ON place_scores(medal) WHERE medal IS NOT NULL;

-- Auto-update updated_at
CREATE TRIGGER place_scores_updated_at_trigger
  BEFORE UPDATE ON place_scores
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();


/* ============================================================
12) MEMBERSHIPS (RV clubs, rewards programs, etc.)
============================================================ */

CREATE TABLE memberships (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        text NOT NULL UNIQUE,
  name        text NOT NULL,
  logo_url    text,
  description text,
  website_url text,
  is_active   boolean NOT NULL DEFAULT true,
  sort_order  int NOT NULL DEFAULT 0
);

CREATE INDEX memberships_active_idx ON memberships(is_active, sort_order);

-- User membership preferences
CREATE TABLE user_memberships (
  user_id       uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  membership_id uuid NOT NULL REFERENCES memberships(id) ON DELETE CASCADE,
  created_at    timestamptz NOT NULL DEFAULT now(),
  
  PRIMARY KEY(user_id, membership_id)
);

CREATE INDEX user_memberships_user_idx ON user_memberships(user_id);
CREATE INDEX user_memberships_membership_idx ON user_memberships(membership_id);

-- Place membership offers
CREATE TABLE place_membership_offers (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id          uuid NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  membership_id     uuid NOT NULL REFERENCES memberships(id) ON DELETE CASCADE,
  offer_type        text NOT NULL, -- 'included','discount','perk'
  offer_details     text,          -- '50% off', '2 nights free', etc
  verified_by_count int NOT NULL DEFAULT 0,
  status            text NOT NULL DEFAULT 'pending', -- 'pending','verified','removed'
  created_at        timestamptz NOT NULL DEFAULT now(),
  
  UNIQUE(place_id, membership_id)
);

CREATE INDEX place_membership_offers_place_idx ON place_membership_offers(place_id);
CREATE INDEX place_membership_offers_membership_idx ON place_membership_offers(membership_id);
CREATE INDEX place_membership_offers_status_idx ON place_membership_offers(status);


/* ============================================================
13) WARNINGS (Fast tap reporting)
============================================================ */

CREATE TABLE warning_types (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        text NOT NULL UNIQUE,
  label       text NOT NULL,
  icon_key    text,
  sort_order  int NOT NULL DEFAULT 0,
  is_active   boolean NOT NULL DEFAULT true
);

CREATE INDEX warning_types_active_idx ON warning_types(is_active, sort_order);

CREATE TABLE place_warnings (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id          uuid NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  warning_type_id   uuid NOT NULL REFERENCES warning_types(id) ON DELETE RESTRICT,
  reported_by       uuid REFERENCES users(id) ON DELETE SET NULL,
  note              text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  status            text NOT NULL DEFAULT 'pending', -- 'pending','verified','removed'
  confirmed_count   int NOT NULL DEFAULT 0,
  removed_count     int NOT NULL DEFAULT 0,
  last_confirmed_at timestamptz
);

CREATE INDEX place_warnings_place_idx ON place_warnings(place_id, status);
CREATE INDEX place_warnings_type_idx ON place_warnings(warning_type_id);
CREATE INDEX place_warnings_status_idx ON place_warnings(status, created_at DESC);

-- Warning confirmations (crowd-sourced verification)
CREATE TABLE place_warning_confirmations (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  warning_id    uuid NOT NULL REFERENCES place_warnings(id) ON DELETE CASCADE,
  user_id       uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_still_valid boolean NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  
  UNIQUE(warning_id, user_id)
);

CREATE INDEX place_warning_confirmations_warning_idx ON place_warning_confirmations(warning_id);


/* ============================================================
14) OWNER POSTS (Tips/updates/specials)
============================================================ */

CREATE TABLE place_owner_posts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id        uuid NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  owner_user_id   uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  label           text NOT NULL, -- 'Owner Tip', 'Chef Tip', 'Special Offer'
  title           text,
  body            text NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),

  expires_at      timestamptz,
  never_expires   boolean NOT NULL DEFAULT false,

  status          text NOT NULL DEFAULT 'live', -- 'live','expired','removed'
  
  /* Ensure owner owns the place */
  CONSTRAINT owner_posts_ownership_check CHECK (
    owner_user_id IN (SELECT owner_user_id FROM places WHERE id = place_id)
  )
);

CREATE INDEX owner_posts_place_idx ON place_owner_posts(place_id, status, created_at DESC);
CREATE INDEX owner_posts_status_idx ON owner_posts(status, expires_at);

-- Auto-update updated_at
CREATE TRIGGER place_owner_posts_updated_at_trigger
  BEFORE UPDATE ON place_owner_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();


/* ============================================================
15) MODERATION / FLAGS
============================================================ */

CREATE TABLE content_flags (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type  text NOT NULL, -- 'photo','review','owner_post','place'
  content_id    uuid NOT NULL,
  flagged_by    uuid REFERENCES users(id) ON DELETE SET NULL,
  reason        text NOT NULL, -- 'spam','inappropriate','offensive','incorrect'
  note          text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  status        text NOT NULL DEFAULT 'pending', -- 'pending','reviewed','actioned','dismissed'
  reviewed_by   uuid REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at   timestamptz
);

CREATE INDEX content_flags_content_idx ON content_flags(content_type, content_id);
CREATE INDEX content_flags_status_idx ON content_flags(status, created_at DESC);
CREATE INDEX content_flags_flagged_by_idx ON content_flags(flagged_by) WHERE flagged_by IS NOT NULL;


/* ============================================================
16) LEGAL (Terms & Privacy consent)
============================================================ */

CREATE TABLE legal_documents (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doc_type    text NOT NULL, -- 'terms','privacy','cookies'
  version     text NOT NULL,
  url         text NOT NULL,
  published_at timestamptz NOT NULL DEFAULT now(),
  
  UNIQUE(doc_type, version)
);

CREATE INDEX legal_documents_type_idx ON legal_documents(doc_type, published_at DESC);

CREATE TABLE user_legal_acceptances (
  user_id       uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  legal_doc_id  uuid NOT NULL REFERENCES legal_documents(id) ON DELETE CASCADE,
  accepted_at   timestamptz NOT NULL DEFAULT now(),
  ip_address    inet,
  user_agent    text,
  
  PRIMARY KEY(user_id, legal_doc_id)
);

CREATE INDEX user_legal_acceptances_user_idx ON user_legal_acceptances(user_id, accepted_at DESC);


/* ============================================================
17) ROW LEVEL SECURITY (RLS)
============================================================ */

-- Enable RLS on key tables
ALTER TABLE places ENABLE ROW LEVEL SECURITY;
ALTER TABLE place_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE place_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE place_owner_posts ENABLE ROW LEVEL SECURITY;

-- Places: Everyone can read active places, authenticated users can create
CREATE POLICY "Places are viewable by everyone" ON places
  FOR SELECT USING (is_active = true AND is_permanently_closed = false);

CREATE POLICY "Authenticated users can create places" ON places
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own places" ON places
  FOR UPDATE USING (auth.uid() = created_by OR auth.uid() = owner_user_id);

-- Reviews: Everyone can read live reviews, users can manage their own
CREATE POLICY "Reviews are viewable by everyone" ON place_reviews
  FOR SELECT USING (status = 'live');

CREATE POLICY "Users can create their own reviews" ON place_reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews" ON place_reviews
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews" ON place_reviews
  FOR DELETE USING (auth.uid() = user_id);

-- Photos: Everyone can read live photos, users can manage their own
CREATE POLICY "Photos are viewable by everyone" ON place_photos
  FOR SELECT USING (status = 'live');

CREATE POLICY "Users can upload photos" ON place_photos
  FOR INSERT WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "Users can delete their own photos" ON place_photos
  FOR DELETE USING (auth.uid() = uploaded_by);

-- Owner posts: Everyone can read live posts, owners can manage
CREATE POLICY "Owner posts are viewable by everyone" ON place_owner_posts
  FOR SELECT USING (status = 'live' AND (never_expires = true OR expires_at > now()));

CREATE POLICY "Owners can create posts" ON place_owner_posts
  FOR INSERT WITH CHECK (auth.uid() = owner_user_id);

CREATE POLICY "Owners can update their posts" ON place_owner_posts
  FOR UPDATE USING (auth.uid() = owner_user_id);


/* ============================================================
18) HELPER FUNCTIONS
============================================================ */

-- Function to calculate place score (simplified version)
-- In production, this would include time decay and more sophisticated logic
CREATE OR REPLACE FUNCTION calculate_place_score(p_place_id uuid)
RETURNS numeric AS $$
DECLARE
  v_positive_taps int;
  v_negative_taps int;
  v_total_reviews int;
  v_score numeric;
  v_confidence numeric;
BEGIN
  -- Get tap counts
  SELECT 
    COALESCE(SUM(CASE WHEN bucket = 'positive' THEN tap_total ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN bucket = 'negative' THEN tap_total ELSE 0 END), 0)
  INTO v_positive_taps, v_negative_taps
  FROM place_signal_aggregates
  WHERE place_id = p_place_id;
  
  -- Get review count
  SELECT COUNT(*) INTO v_total_reviews
  FROM place_reviews
  WHERE place_id = p_place_id AND status = 'live';
  
  -- Calculate confidence (0-100) based on review count
  v_confidence = LEAST(100, (v_total_reviews * 10.0));
  
  -- Calculate score (0-100)
  IF (v_positive_taps + v_negative_taps) = 0 THEN
    v_score = 0;
  ELSE
    v_score = (v_positive_taps::numeric / (v_positive_taps + v_negative_taps)) * 100;
  END IF;
  
  -- Apply confidence shrinkage (lower confidence = pull toward 50)
  v_score = v_score * (v_confidence / 100.0) + 50 * (1 - v_confidence / 100.0);
  
  -- Update place_scores table
  INSERT INTO place_scores (
    place_id, score_value, confidence, 
    total_positive_taps, total_negative_taps, total_reviews,
    last_computed_at
  )
  VALUES (
    p_place_id, v_score, v_confidence,
    v_positive_taps, v_negative_taps, v_total_reviews,
    now()
  )
  ON CONFLICT (place_id) DO UPDATE
  SET 
    score_value = EXCLUDED.score_value,
    confidence = EXCLUDED.confidence,
    total_positive_taps = EXCLUDED.total_positive_taps,
    total_negative_taps = EXCLUDED.total_negative_taps,
    total_reviews = EXCLUDED.total_reviews,
    last_computed_at = now();
  
  RETURN v_score;
END;
$$ LANGUAGE plpgsql;

-- Function to search places by location and filters
CREATE OR REPLACE FUNCTION search_places(
  p_lat double precision,
  p_lng double precision,
  p_radius_meters int DEFAULT 50000, -- 50km default
  p_primary_category_id uuid DEFAULT NULL,
  p_min_score numeric DEFAULT 0,
  p_limit int DEFAULT 20
)
RETURNS TABLE (
  place_id uuid,
  name text,
  lat double precision,
  lng double precision,
  distance_meters int,
  score_value numeric,
  primary_category_id uuid
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.lat,
    p.lng,
    ST_Distance(
      p.geography,
      ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography
    )::int AS distance_meters,
    COALESCE(ps.score_value, 0) AS score_value,
    p.primary_category_id
  FROM places p
  LEFT JOIN place_scores ps ON ps.place_id = p.id
  WHERE 
    p.is_active = true 
    AND p.is_permanently_closed = false
    AND ST_DWithin(
      p.geography,
      ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
      p_radius_meters
    )
    AND (p_primary_category_id IS NULL OR p.primary_category_id = p_primary_category_id)
    AND COALESCE(ps.score_value, 0) >= p_min_score
  ORDER BY distance_meters ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;


/* ============================================================
19) INITIAL DATA - SEED CATEGORIES
============================================================ */

-- Primary Categories
INSERT INTO categories_primary (slug, name, sort_order) VALUES
('food_drink', 'Food & Drink', 1),
('lodging', 'Lodging', 2),
('recreation', 'Recreation & Entertainment', 3),
('services', 'Services', 4),
('shopping', 'Shopping', 5),
('health', 'Health & Wellness', 6),
('education', 'Education', 7),
('transportation', 'Transportation', 8);

-- Secondary Categories for Food & Drink
INSERT INTO categories_secondary (primary_id, slug, name, sort_order)
SELECT id, 'restaurant', 'Restaurant', 1 FROM categories_primary WHERE slug = 'food_drink'
UNION ALL
SELECT id, 'cafe', 'Café', 2 FROM categories_primary WHERE slug = 'food_drink'
UNION ALL
SELECT id, 'bar', 'Bar', 3 FROM categories_primary WHERE slug = 'food_drink'
UNION ALL
SELECT id, 'fast_food', 'Fast Food', 4 FROM categories_primary WHERE slug = 'food_drink'
UNION ALL
SELECT id, 'bakery', 'Bakery', 5 FROM categories_primary WHERE slug = 'food_drink';

-- Secondary Categories for Lodging
INSERT INTO categories_secondary (primary_id, slug, name, sort_order)
SELECT id, 'hotel', 'Hotel', 1 FROM categories_primary WHERE slug = 'lodging'
UNION ALL
SELECT id, 'rv_park', 'RV Park', 2 FROM categories_primary WHERE slug = 'lodging'
UNION ALL
SELECT id, 'campground', 'Campground', 3 FROM categories_primary WHERE slug = 'lodging'
UNION ALL
SELECT id, 'hostel', 'Hostel', 4 FROM categories_primary WHERE slug = 'lodging'
UNION ALL
SELECT id, 'vacation_rental', 'Vacation Rental', 5 FROM categories_primary WHERE slug = 'lodging';

-- Secondary Categories for Recreation
INSERT INTO categories_secondary (primary_id, slug, name, sort_order)
SELECT id, 'park', 'Park', 1 FROM categories_primary WHERE slug = 'recreation'
UNION ALL
SELECT id, 'museum', 'Museum', 2 FROM categories_primary WHERE slug = 'recreation'
UNION ALL
SELECT id, 'theater', 'Theater', 3 FROM categories_primary WHERE slug = 'recreation'
UNION ALL
SELECT id, 'gym', 'Gym', 4 FROM categories_primary WHERE slug = 'recreation'
UNION ALL
SELECT id, 'sports_venue', 'Sports Venue', 5 FROM categories_primary WHERE slug = 'recreation';


/* ============================================================
20) INITIAL DATA - SEED SIGNALS
============================================================ */

-- Global Positive Signals (work for any category)
INSERT INTO review_signals (slug, label, emoji, bucket, is_global, sort_order) VALUES
('friendly_staff', 'Friendly Staff', '👍', 'positive', true, 1),
('clean_facilities', 'Clean Facilities', '👍', 'positive', true, 2),
('great_location', 'Great Location', '👍', 'positive', true, 3),
('good_value', 'Good Value', '👍', 'positive', true, 4),
('well_maintained', 'Well Maintained', '👍', 'positive', true, 5);

-- Category-specific Positive Signals (Food & Drink)
INSERT INTO review_signals (slug, label, emoji, bucket, is_global, primary_category_id, sort_order)
SELECT 'delicious_food', 'Delicious Food', '👍', 'positive', false, id, 1 FROM categories_primary WHERE slug = 'food_drink'
UNION ALL
SELECT 'fast_service', 'Fast Service', '👍', 'positive', false, id, 2 FROM categories_primary WHERE slug = 'food_drink'
UNION ALL
SELECT 'fresh_ingredients', 'Fresh Ingredients', '👍', 'positive', false, id, 3 FROM categories_primary WHERE slug = 'food_drink'
UNION ALL
SELECT 'great_atmosphere', 'Great Atmosphere', '👍', 'positive', false, id, 4 FROM categories_primary WHERE slug = 'food_drink'
UNION ALL
SELECT 'generous_portions', 'Generous Portions', '👍', 'positive', false, id, 5 FROM categories_primary WHERE slug = 'food_drink';

-- Category-specific Positive Signals (Lodging)
INSERT INTO review_signals (slug, label, emoji, bucket, is_global, primary_category_id, sort_order)
SELECT 'comfortable_beds', 'Comfortable Beds', '👍', 'positive', false, id, 1 FROM categories_primary WHERE slug = 'lodging'
UNION ALL
SELECT 'spacious_rooms', 'Spacious Rooms', '👍', 'positive', false, id, 2 FROM categories_primary WHERE slug = 'lodging'
UNION ALL
SELECT 'great_amenities', 'Great Amenities', '👍', 'positive', false, id, 3 FROM categories_primary WHERE slug = 'lodging'
UNION ALL
SELECT 'quiet_peaceful', 'Quiet & Peaceful', '👍', 'positive', false, id, 4 FROM categories_primary WHERE slug = 'lodging'
UNION ALL
SELECT 'beautiful_views', 'Beautiful Views', '👍', 'positive', false, id, 5 FROM categories_primary WHERE slug = 'lodging';

-- Global Neutral Signals (vibe/style)
INSERT INTO review_signals (slug, label, emoji, bucket, is_global, sort_order) VALUES
('family_friendly', 'Family-Friendly', '⭐', 'neutral', true, 1),
('pet_friendly', 'Pet-Friendly', '⭐', 'neutral', true, 2),
('modern', 'Modern', '⭐', 'neutral', true, 3),
('rustic', 'Rustic', '⭐', 'neutral', true, 4),
('quiet', 'Quiet', '⭐', 'neutral', true, 5);

-- Category-specific Neutral Signals (Food & Drink)
INSERT INTO review_signals (slug, label, emoji, bucket, is_global, primary_category_id, sort_order)
SELECT 'casual_dining', 'Casual Dining', '⭐', 'neutral', false, id, 1 FROM categories_primary WHERE slug = 'food_drink'
UNION ALL
SELECT 'upscale', 'Upscale', '⭐', 'neutral', false, id, 2 FROM categories_primary WHERE slug = 'food_drink'
UNION ALL
SELECT 'outdoor_seating', 'Outdoor Seating', '⭐', 'neutral', false, id, 3 FROM categories_primary WHERE slug = 'food_drink'
UNION ALL
SELECT 'romantic', 'Romantic', '⭐', 'neutral', false, id, 4 FROM categories_primary WHERE slug = 'food_drink'
UNION ALL
SELECT 'lively', 'Lively', '⭐', 'neutral', false, id, 5 FROM categories_primary WHERE slug = 'food_drink';

-- Global Negative Signals (improvements)
INSERT INTO review_signals (slug, label, emoji, bucket, is_global, sort_order) VALUES
('needs_maintenance', 'Needs Maintenance', '⚠️', 'negative', true, 1),
('overpriced', 'Overpriced', '⚠️', 'negative', true, 2),
('limited_parking', 'Limited Parking', '⚠️', 'negative', true, 3),
('too_noisy', 'Too Noisy', '⚠️', 'negative', true, 4),
('unfriendly_staff', 'Unfriendly Staff', '⚠️', 'negative', true, 5);

-- Category-specific Negative Signals (Food & Drink)
INSERT INTO review_signals (slug, label, emoji, bucket, is_global, primary_category_id, sort_order)
SELECT 'slow_service', 'Slow Service', '⚠️', 'negative', false, id, 1 FROM categories_primary WHERE slug = 'food_drink'
UNION ALL
SELECT 'small_portions', 'Small Portions', '⚠️', 'negative', false, id, 2 FROM categories_primary WHERE slug = 'food_drink'
UNION ALL
SELECT 'long_wait_times', 'Long Wait Times', '⚠️', 'negative', false, id, 3 FROM categories_primary WHERE slug = 'food_drink'
UNION ALL
SELECT 'bland_food', 'Bland Food', '⚠️', 'negative', false, id, 4 FROM categories_primary WHERE slug = 'food_drink'
UNION ALL
SELECT 'dirty_tables', 'Dirty Tables', '⚠️', 'negative', false, id, 5 FROM categories_primary WHERE slug = 'food_drink';


/* ============================================================
21) INITIAL DATA - SEED WARNING TYPES
============================================================ */

INSERT INTO warning_types (slug, label, sort_order) VALUES
('permanently_closed', 'Permanently Closed', 1),
('temporarily_closed', 'Temporarily Closed', 2),
('moved_location', 'Moved to New Location', 3),
('unsafe_conditions', 'Unsafe Conditions', 4),
('incorrect_info', 'Incorrect Information', 5);


/* ============================================================
22) INITIAL DATA - SEED MEMBERSHIPS (Examples)
============================================================ */

INSERT INTO memberships (slug, name, description, sort_order) VALUES
('harvest_hosts', 'Harvest Hosts', 'Farm and winery stays for RVers', 1),
('passport_america', 'Passport America', '50% off camping', 2),
('good_sam', 'Good Sam', 'RV club with discounts', 3),
('aaa', 'AAA', 'Auto club with travel benefits', 4);


/* ============================================================
SCHEMA COMPLETE!
============================================================ */

-- Grant permissions (adjust based on your auth setup)
-- GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
-- GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
-- GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
