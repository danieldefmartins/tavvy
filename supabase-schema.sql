-- MUVO Database Schema for Supabase
-- Universal tap-based review platform

-- ============================================
-- 1. PLACES TABLE
-- ============================================
CREATE TABLE places (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'USA',
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  category TEXT NOT NULL, -- 'restaurant', 'rv_park', 'hotel', 'cafe', etc.
  description TEXT,
  phone TEXT,
  website TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Indexes for performance
CREATE INDEX idx_places_category ON places(category);
CREATE INDEX idx_places_location ON places USING GIST (
  ll_to_earth(latitude, longitude)
);
CREATE INDEX idx_places_created_at ON places(created_at DESC);

-- ============================================
-- 2. SIGNALS TABLE (Predefined Tags)
-- ============================================
CREATE TABLE signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL CHECK (category IN ('what_stood_out', 'whats_it_like', 'what_didnt_work')),
  emoji TEXT NOT NULL,
  color TEXT NOT NULL, -- 'blue', 'gray', 'orange'
  place_types TEXT[] DEFAULT ARRAY['all'], -- ['all'] or ['restaurant', 'rv_park', etc.]
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX idx_signals_category ON signals(category);
CREATE INDEX idx_signals_place_types ON signals USING GIN(place_types);

-- ============================================
-- 3. REVIEWS TABLE
-- ============================================
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id UUID NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(place_id, user_id) -- One review per user per place
);

-- Indexes
CREATE INDEX idx_reviews_place_id ON reviews(place_id);
CREATE INDEX idx_reviews_user_id ON reviews(user_id);
CREATE INDEX idx_reviews_created_at ON reviews(created_at DESC);

-- ============================================
-- 4. REVIEW_SIGNALS (Junction Table)
-- ============================================
CREATE TABLE review_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  signal_id UUID NOT NULL REFERENCES signals(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(review_id, signal_id)
);

-- Indexes
CREATE INDEX idx_review_signals_review_id ON review_signals(review_id);
CREATE INDEX idx_review_signals_signal_id ON review_signals(signal_id);

-- ============================================
-- 5. AGGREGATED_SIGNALS (Materialized View)
-- ============================================
CREATE MATERIALIZED VIEW aggregated_signals AS
SELECT 
  p.id AS place_id,
  s.id AS signal_id,
  s.name AS signal_name,
  s.category AS signal_category,
  s.emoji AS signal_emoji,
  s.color AS signal_color,
  COUNT(rs.id) AS count,
  MAX(r.created_at) AS last_tapped_at
FROM places p
CROSS JOIN signals s
LEFT JOIN reviews r ON r.place_id = p.id
LEFT JOIN review_signals rs ON rs.review_id = r.id AND rs.signal_id = s.id
GROUP BY p.id, s.id, s.name, s.category, s.emoji, s.color;

-- Index for fast queries
CREATE UNIQUE INDEX idx_aggregated_signals_place_signal ON aggregated_signals(place_id, signal_id);
CREATE INDEX idx_aggregated_signals_place_id ON aggregated_signals(place_id);
CREATE INDEX idx_aggregated_signals_count ON aggregated_signals(count DESC);

-- Function to refresh aggregated signals
CREATE OR REPLACE FUNCTION refresh_aggregated_signals()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY aggregated_signals;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 6. SEED DATA - SIGNALS
-- ============================================

-- What Stood Out (Positive - Blue)
INSERT INTO signals (name, category, emoji, color, place_types) VALUES
('Great Food', 'what_stood_out', '👍', 'blue', ARRAY['all']),
('Delicious Food', 'what_stood_out', '👍', 'blue', ARRAY['restaurant', 'cafe']),
('Clean Bathrooms', 'what_stood_out', '👍', 'blue', ARRAY['all']),
('Friendly Staff', 'what_stood_out', '👍', 'blue', ARRAY['all']),
('Beautiful Views', 'what_stood_out', '👍', 'blue', ARRAY['all']),
('Level Sites', 'what_stood_out', '👍', 'blue', ARRAY['rv_park', 'campground']),
('Good WiFi', 'what_stood_out', '👍', 'blue', ARRAY['all']),
('Clean Facilities', 'what_stood_out', '👍', 'blue', ARRAY['all']),
('Great Location', 'what_stood_out', '👍', 'blue', ARRAY['all']),
('Excellent Service', 'what_stood_out', '👍', 'blue', ARRAY['all']),
('Spacious Sites', 'what_stood_out', '👍', 'blue', ARRAY['rv_park', 'campground']),
('Good Value', 'what_stood_out', '👍', 'blue', ARRAY['all']),
('Fresh Ingredients', 'what_stood_out', '👍', 'blue', ARRAY['restaurant', 'cafe']),
('Fast Service', 'what_stood_out', '👍', 'blue', ARRAY['restaurant', 'cafe']),
('Well Maintained', 'what_stood_out', '👍', 'blue', ARRAY['all']);

-- What's it like (Neutral/Vibe - Gray)
INSERT INTO signals (name, category, emoji, color, place_types) VALUES
('Rustic', 'whats_it_like', '⭐', 'gray', ARRAY['all']),
('Family-Friendly', 'whats_it_like', '⭐', 'gray', ARRAY['all']),
('Quiet', 'whats_it_like', '⭐', 'gray', ARRAY['all']),
('Pet-Friendly', 'whats_it_like', '⭐', 'gray', ARRAY['all']),
('Modern', 'whats_it_like', '⭐', 'gray', ARRAY['all']),
('Cozy', 'whats_it_like', '⭐', 'gray', ARRAY['all']),
('Casual', 'whats_it_like', '⭐', 'gray', ARRAY['restaurant', 'cafe']),
('Upscale', 'whats_it_like', '⭐', 'gray', ARRAY['restaurant', 'hotel']),
('Lively', 'whats_it_like', '⭐', 'gray', ARRAY['all']),
('Romantic', 'whats_it_like', '⭐', 'gray', ARRAY['restaurant']),
('Outdoor Seating', 'whats_it_like', '⭐', 'gray', ARRAY['restaurant', 'cafe']),
('Full Hookups', 'whats_it_like', '⭐', 'gray', ARRAY['rv_park']),
('Tent Camping', 'whats_it_like', '⭐', 'gray', ARRAY['campground']),
('Near Attractions', 'whats_it_like', '⭐', 'gray', ARRAY['all']),
('Secluded', 'whats_it_like', '⭐', 'gray', ARRAY['all']);

-- What didn't work (Improvements - Orange)
INSERT INTO signals (name, category, emoji, color, place_types) VALUES
('Slow Service', 'what_didnt_work', '⚠️', 'orange', ARRAY['restaurant', 'cafe']),
('Spotty WiFi', 'what_didnt_work', '⚠️', 'orange', ARRAY['all']),
('Too Noisy', 'what_didnt_work', '⚠️', 'orange', ARRAY['all']),
('Cramped Sites', 'what_didnt_work', '⚠️', 'orange', ARRAY['rv_park', 'campground']),
('Poor Lighting', 'what_didnt_work', '⚠️', 'orange', ARRAY['all']),
('Needs Maintenance', 'what_didnt_work', '⚠️', 'orange', ARRAY['all']),
('Overpriced', 'what_didnt_work', '⚠️', 'orange', ARRAY['all']),
('Limited Parking', 'what_didnt_work', '⚠️', 'orange', ARRAY['all']),
('Dirty Facilities', 'what_didnt_work', '⚠️', 'orange', ARRAY['all']),
('Unfriendly Staff', 'what_didnt_work', '⚠️', 'orange', ARRAY['all']),
('Small Portions', 'what_didnt_work', '⚠️', 'orange', ARRAY['restaurant', 'cafe']),
('Long Wait Times', 'what_didnt_work', '⚠️', 'orange', ARRAY['restaurant']),
('No Shade', 'what_didnt_work', '⚠️', 'orange', ARRAY['rv_park', 'campground']),
('Road Noise', 'what_didnt_work', '⚠️', 'orange', ARRAY['all']),
('Bugs/Insects', 'what_didnt_work', '⚠️', 'orange', ARRAY['rv_park', 'campground']);

-- ============================================
-- 7. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS
ALTER TABLE places ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_signals ENABLE ROW LEVEL SECURITY;

-- Places: Everyone can read, authenticated users can create
CREATE POLICY "Places are viewable by everyone" ON places
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create places" ON places
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own places" ON places
  FOR UPDATE USING (auth.uid() = created_by);

-- Reviews: Everyone can read, users can only create/update their own
CREATE POLICY "Reviews are viewable by everyone" ON reviews
  FOR SELECT USING (true);

CREATE POLICY "Users can create their own reviews" ON reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews" ON reviews
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews" ON reviews
  FOR DELETE USING (auth.uid() = user_id);

-- Review Signals: Inherit from reviews
CREATE POLICY "Review signals are viewable by everyone" ON review_signals
  FOR SELECT USING (true);

CREATE POLICY "Users can manage signals for their own reviews" ON review_signals
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM reviews 
      WHERE reviews.id = review_signals.review_id 
      AND reviews.user_id = auth.uid()
    )
  );

-- ============================================
-- 8. FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_places_updated_at BEFORE UPDATE ON places
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 9. HELPFUL VIEWS
-- ============================================

-- View: Place with review count and top signals
CREATE VIEW place_summary AS
SELECT 
  p.*,
  COUNT(DISTINCT r.id) AS review_count,
  MAX(r.created_at) AS last_review_at,
  (
    SELECT json_agg(json_build_object(
      'signal_name', a.signal_name,
      'signal_emoji', a.signal_emoji,
      'signal_category', a.signal_category,
      'count', a.count
    ) ORDER BY a.count DESC)
    FROM (
      SELECT * FROM aggregated_signals 
      WHERE place_id = p.id AND count > 0
      LIMIT 10
    ) a
  ) AS top_signals
FROM places p
LEFT JOIN reviews r ON r.place_id = p.id
GROUP BY p.id;

-- ============================================
-- NOTES FOR LOVABLE DEPLOYMENT
-- ============================================

-- 1. Run this entire SQL file in Supabase SQL Editor
-- 2. After initial setup, refresh aggregated signals:
--    SELECT refresh_aggregated_signals();
-- 3. Set up a cron job to refresh periodically (every hour):
--    SELECT cron.schedule('refresh-signals', '0 * * * *', 'SELECT refresh_aggregated_signals()');
-- 4. Environment variables needed:
--    - SUPABASE_URL
--    - SUPABASE_ANON_KEY
--    - SUPABASE_SERVICE_ROLE_KEY (for admin operations)
