-- Fix function search path
CREATE OR REPLACE FUNCTION public.get_review_category(place_category public.place_category)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
SET search_path TO 'public'
AS $$
  SELECT CASE place_category
    WHEN 'National Park' THEN 'national_parks'
    WHEN 'State Park' THEN 'national_parks'
    WHEN 'County / Regional Park' THEN 'national_parks'
    WHEN 'RV Campground' THEN 'campgrounds'
    WHEN 'Luxury RV Resort' THEN 'campgrounds'
    WHEN 'Overnight Parking' THEN 'campgrounds'
    WHEN 'Boondocking' THEN 'campgrounds'
    WHEN 'Business Allowing Overnight' THEN 'campgrounds'
    WHEN 'Rest Area / Travel Plaza' THEN 'campgrounds'
    WHEN 'Fairgrounds / Event Grounds' THEN 'campgrounds'
    ELSE 'campgrounds'
  END
$$;