-- Add neutral stamps for all other categories that are missing them

-- Restaurants neutral stamps
INSERT INTO public.stamp_definitions (id, category, label, polarity, sort_order, icon) VALUES
  ('neutral_brand_new_rest', 'restaurants', 'Brand New', 'neutral', 1, 'Sparkles'),
  ('neutral_modern_rest', 'restaurants', 'Modern', 'neutral', 2, 'Building2'),
  ('neutral_contemporary_rest', 'restaurants', 'Contemporary', 'neutral', 3, 'LayoutGrid'),
  ('neutral_rustic_rest', 'restaurants', 'Rustic', 'neutral', 4, 'TreePine'),
  ('neutral_local_favorite_rest', 'restaurants', 'Local Favorite', 'neutral', 5, 'Heart'),
  ('neutral_cozy_rest', 'restaurants', 'Cozy', 'neutral', 6, 'Flame'),
  ('neutral_themed_rest', 'restaurants', 'Themed Style', 'neutral', 7, 'Palette'),
  ('neutral_well_designed_rest', 'restaurants', 'Well Designed', 'neutral', 8, 'PenTool'),
  ('neutral_outdated_rest', 'restaurants', 'Outdated', 'neutral', 9, 'Clock'),
  ('neutral_needs_refresh_rest', 'restaurants', 'Needs Refresh', 'neutral', 10, 'RefreshCw'),
  ('neutral_worn_down_rest', 'restaurants', 'Worn Down', 'neutral', 11, 'Wrench')
ON CONFLICT (id) DO NOTHING;

-- Hotels neutral stamps
INSERT INTO public.stamp_definitions (id, category, label, polarity, sort_order, icon) VALUES
  ('neutral_brand_new_hotel', 'hotels', 'Brand New', 'neutral', 1, 'Sparkles'),
  ('neutral_modern_hotel', 'hotels', 'Modern', 'neutral', 2, 'Building2'),
  ('neutral_contemporary_hotel', 'hotels', 'Contemporary', 'neutral', 3, 'LayoutGrid'),
  ('neutral_rustic_hotel', 'hotels', 'Rustic', 'neutral', 4, 'TreePine'),
  ('neutral_local_favorite_hotel', 'hotels', 'Local Favorite', 'neutral', 5, 'Heart'),
  ('neutral_cozy_hotel', 'hotels', 'Cozy', 'neutral', 6, 'Flame'),
  ('neutral_themed_hotel', 'hotels', 'Themed Style', 'neutral', 7, 'Palette'),
  ('neutral_well_designed_hotel', 'hotels', 'Well Designed', 'neutral', 8, 'PenTool'),
  ('neutral_outdated_hotel', 'hotels', 'Outdated', 'neutral', 9, 'Clock'),
  ('neutral_needs_refresh_hotel', 'hotels', 'Needs Refresh', 'neutral', 10, 'RefreshCw'),
  ('neutral_worn_down_hotel', 'hotels', 'Worn Down', 'neutral', 11, 'Wrench')
ON CONFLICT (id) DO NOTHING;

-- Retail neutral stamps
INSERT INTO public.stamp_definitions (id, category, label, polarity, sort_order, icon) VALUES
  ('neutral_brand_new_retail', 'retail', 'Brand New', 'neutral', 1, 'Sparkles'),
  ('neutral_modern_retail', 'retail', 'Modern', 'neutral', 2, 'Building2'),
  ('neutral_contemporary_retail', 'retail', 'Contemporary', 'neutral', 3, 'LayoutGrid'),
  ('neutral_rustic_retail', 'retail', 'Rustic', 'neutral', 4, 'TreePine'),
  ('neutral_local_favorite_retail', 'retail', 'Local Favorite', 'neutral', 5, 'Heart'),
  ('neutral_cozy_retail', 'retail', 'Cozy', 'neutral', 6, 'Flame'),
  ('neutral_themed_retail', 'retail', 'Themed Style', 'neutral', 7, 'Palette'),
  ('neutral_well_designed_retail', 'retail', 'Well Designed', 'neutral', 8, 'PenTool'),
  ('neutral_outdated_retail', 'retail', 'Outdated', 'neutral', 9, 'Clock'),
  ('neutral_needs_refresh_retail', 'retail', 'Needs Refresh', 'neutral', 10, 'RefreshCw'),
  ('neutral_worn_down_retail', 'retail', 'Worn Down', 'neutral', 11, 'Wrench')
ON CONFLICT (id) DO NOTHING;

-- Service providers neutral stamps
INSERT INTO public.stamp_definitions (id, category, label, polarity, sort_order, icon) VALUES
  ('neutral_brand_new_service', 'service_providers', 'Brand New', 'neutral', 1, 'Sparkles'),
  ('neutral_modern_service', 'service_providers', 'Modern', 'neutral', 2, 'Building2'),
  ('neutral_contemporary_service', 'service_providers', 'Contemporary', 'neutral', 3, 'LayoutGrid'),
  ('neutral_rustic_service', 'service_providers', 'Rustic', 'neutral', 4, 'TreePine'),
  ('neutral_local_favorite_service', 'service_providers', 'Local Favorite', 'neutral', 5, 'Heart'),
  ('neutral_cozy_service', 'service_providers', 'Cozy', 'neutral', 6, 'Flame'),
  ('neutral_themed_service', 'service_providers', 'Themed Style', 'neutral', 7, 'Palette'),
  ('neutral_well_designed_service', 'service_providers', 'Well Designed', 'neutral', 8, 'PenTool'),
  ('neutral_outdated_service', 'service_providers', 'Outdated', 'neutral', 9, 'Clock'),
  ('neutral_needs_refresh_service', 'service_providers', 'Needs Refresh', 'neutral', 10, 'RefreshCw'),
  ('neutral_worn_down_service', 'service_providers', 'Worn Down', 'neutral', 11, 'Wrench')
ON CONFLICT (id) DO NOTHING;

-- Medical neutral stamps
INSERT INTO public.stamp_definitions (id, category, label, polarity, sort_order, icon) VALUES
  ('neutral_brand_new_medical', 'medical', 'Brand New', 'neutral', 1, 'Sparkles'),
  ('neutral_modern_medical', 'medical', 'Modern', 'neutral', 2, 'Building2'),
  ('neutral_contemporary_medical', 'medical', 'Contemporary', 'neutral', 3, 'LayoutGrid'),
  ('neutral_rustic_medical', 'medical', 'Rustic', 'neutral', 4, 'TreePine'),
  ('neutral_local_favorite_medical', 'medical', 'Local Favorite', 'neutral', 5, 'Heart'),
  ('neutral_cozy_medical', 'medical', 'Cozy', 'neutral', 6, 'Flame'),
  ('neutral_themed_medical', 'medical', 'Themed Style', 'neutral', 7, 'Palette'),
  ('neutral_well_designed_medical', 'medical', 'Well Designed', 'neutral', 8, 'PenTool'),
  ('neutral_outdated_medical', 'medical', 'Outdated', 'neutral', 9, 'Clock'),
  ('neutral_needs_refresh_medical', 'medical', 'Needs Refresh', 'neutral', 10, 'RefreshCw'),
  ('neutral_worn_down_medical', 'medical', 'Worn Down', 'neutral', 11, 'Wrench')
ON CONFLICT (id) DO NOTHING;

-- Salons neutral stamps
INSERT INTO public.stamp_definitions (id, category, label, polarity, sort_order, icon) VALUES
  ('neutral_brand_new_salon', 'salons', 'Brand New', 'neutral', 1, 'Sparkles'),
  ('neutral_modern_salon', 'salons', 'Modern', 'neutral', 2, 'Building2'),
  ('neutral_contemporary_salon', 'salons', 'Contemporary', 'neutral', 3, 'LayoutGrid'),
  ('neutral_rustic_salon', 'salons', 'Rustic', 'neutral', 4, 'TreePine'),
  ('neutral_local_favorite_salon', 'salons', 'Local Favorite', 'neutral', 5, 'Heart'),
  ('neutral_cozy_salon', 'salons', 'Cozy', 'neutral', 6, 'Flame'),
  ('neutral_themed_salon', 'salons', 'Themed Style', 'neutral', 7, 'Palette'),
  ('neutral_well_designed_salon', 'salons', 'Well Designed', 'neutral', 8, 'PenTool'),
  ('neutral_outdated_salon', 'salons', 'Outdated', 'neutral', 9, 'Clock'),
  ('neutral_needs_refresh_salon', 'salons', 'Needs Refresh', 'neutral', 10, 'RefreshCw'),
  ('neutral_worn_down_salon', 'salons', 'Worn Down', 'neutral', 11, 'Wrench')
ON CONFLICT (id) DO NOTHING;

-- Gyms neutral stamps
INSERT INTO public.stamp_definitions (id, category, label, polarity, sort_order, icon) VALUES
  ('neutral_brand_new_gym', 'gyms', 'Brand New', 'neutral', 1, 'Sparkles'),
  ('neutral_modern_gym', 'gyms', 'Modern', 'neutral', 2, 'Building2'),
  ('neutral_contemporary_gym', 'gyms', 'Contemporary', 'neutral', 3, 'LayoutGrid'),
  ('neutral_rustic_gym', 'gyms', 'Rustic', 'neutral', 4, 'TreePine'),
  ('neutral_local_favorite_gym', 'gyms', 'Local Favorite', 'neutral', 5, 'Heart'),
  ('neutral_cozy_gym', 'gyms', 'Cozy', 'neutral', 6, 'Flame'),
  ('neutral_themed_gym', 'gyms', 'Themed Style', 'neutral', 7, 'Palette'),
  ('neutral_well_designed_gym', 'gyms', 'Well Designed', 'neutral', 8, 'PenTool'),
  ('neutral_outdated_gym', 'gyms', 'Outdated', 'neutral', 9, 'Clock'),
  ('neutral_needs_refresh_gym', 'gyms', 'Needs Refresh', 'neutral', 10, 'RefreshCw'),
  ('neutral_worn_down_gym', 'gyms', 'Worn Down', 'neutral', 11, 'Wrench')
ON CONFLICT (id) DO NOTHING;