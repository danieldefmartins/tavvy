-- Drop the old check constraint that only allows positive/improvement
ALTER TABLE public.stamp_definitions DROP CONSTRAINT stamp_definitions_polarity_check;

-- Add new check constraint that includes 'neutral'
ALTER TABLE public.stamp_definitions ADD CONSTRAINT stamp_definitions_polarity_check 
  CHECK (polarity = ANY (ARRAY['positive'::text, 'improvement'::text, 'neutral'::text]));

-- Add 'neutral' to signal_polarity enum (for review_signals table)
ALTER TYPE public.signal_polarity ADD VALUE IF NOT EXISTS 'neutral';

-- Insert neutral stamps for campgrounds category
INSERT INTO public.stamp_definitions (id, category, label, polarity, sort_order, icon) VALUES
  ('neutral_brand_new', 'campgrounds', 'Brand New', 'neutral', 1, 'Sparkles'),
  ('neutral_modern', 'campgrounds', 'Modern', 'neutral', 2, 'Building2'),
  ('neutral_contemporary', 'campgrounds', 'Contemporary', 'neutral', 3, 'LayoutGrid'),
  ('neutral_rustic', 'campgrounds', 'Rustic', 'neutral', 4, 'TreePine'),
  ('neutral_local_favorite', 'campgrounds', 'Local Favorite', 'neutral', 5, 'Heart'),
  ('neutral_cozy', 'campgrounds', 'Cozy', 'neutral', 6, 'Flame'),
  ('neutral_themed', 'campgrounds', 'Themed Style', 'neutral', 7, 'Palette'),
  ('neutral_well_designed', 'campgrounds', 'Well Designed', 'neutral', 8, 'PenTool'),
  ('neutral_outdated', 'campgrounds', 'Outdated', 'neutral', 9, 'Clock'),
  ('neutral_needs_refresh', 'campgrounds', 'Needs Refresh', 'neutral', 10, 'RefreshCw'),
  ('neutral_worn_down', 'campgrounds', 'Worn Down', 'neutral', 11, 'Wrench')
ON CONFLICT (id) DO NOTHING;

-- Insert neutral stamps for national_parks category
INSERT INTO public.stamp_definitions (id, category, label, polarity, sort_order, icon) VALUES
  ('neutral_brand_new_np', 'national_parks', 'Brand New', 'neutral', 1, 'Sparkles'),
  ('neutral_modern_np', 'national_parks', 'Modern', 'neutral', 2, 'Building2'),
  ('neutral_contemporary_np', 'national_parks', 'Contemporary', 'neutral', 3, 'LayoutGrid'),
  ('neutral_rustic_np', 'national_parks', 'Rustic', 'neutral', 4, 'TreePine'),
  ('neutral_local_favorite_np', 'national_parks', 'Local Favorite', 'neutral', 5, 'Heart'),
  ('neutral_cozy_np', 'national_parks', 'Cozy', 'neutral', 6, 'Flame'),
  ('neutral_themed_np', 'national_parks', 'Themed Style', 'neutral', 7, 'Palette'),
  ('neutral_well_designed_np', 'national_parks', 'Well Designed', 'neutral', 8, 'PenTool'),
  ('neutral_outdated_np', 'national_parks', 'Outdated', 'neutral', 9, 'Clock'),
  ('neutral_needs_refresh_np', 'national_parks', 'Needs Refresh', 'neutral', 10, 'RefreshCw'),
  ('neutral_worn_down_np', 'national_parks', 'Worn Down', 'neutral', 11, 'Wrench')
ON CONFLICT (id) DO NOTHING;