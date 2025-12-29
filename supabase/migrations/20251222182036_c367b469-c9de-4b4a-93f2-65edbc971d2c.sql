-- Create new category enum with updated values
CREATE TYPE public.place_category_v2 AS ENUM (
  'National Park',
  'State Park',
  'County / Regional Park',
  'RV Campground',
  'Luxury RV Resort',
  'Overnight Parking',
  'Boondocking',
  'Business Allowing Overnight',
  'Rest Area / Travel Plaza',
  'Fairgrounds / Event Grounds'
);

-- Create new feature enum with updated values
CREATE TYPE public.place_feature_v2 AS ENUM (
  'Dump Station',
  'Fresh Water',
  'Electric Hookups',
  'Sewer Hookups',
  'Showers',
  'Laundry',
  'Wi-Fi',
  'Pet Friendly',
  'Big Rig Friendly',
  'Swimming Pool',
  'Hot Tub',
  'Heated Pool',
  'Heated Hot Tub'
);

-- Add new columns with new types
ALTER TABLE public.places 
ADD COLUMN primary_category_new place_category_v2,
ADD COLUMN features_new place_feature_v2[] DEFAULT '{}'::place_feature_v2[],
ADD COLUMN open_year_round BOOLEAN NOT NULL DEFAULT true;

-- Migrate existing data with reasonable mappings
UPDATE public.places SET 
  primary_category_new = CASE 
    WHEN primary_category::text = 'National Park Campground' THEN 'National Park'::place_category_v2
    WHEN primary_category::text = 'State Park Campground' THEN 'State Park'::place_category_v2
    WHEN primary_category::text IN ('County / Regional Park Campground', 'City / Municipal Park Campground') THEN 'County / Regional Park'::place_category_v2
    WHEN primary_category::text = 'RV Campground' THEN 'RV Campground'::place_category_v2
    WHEN primary_category::text = 'Luxury RV Resort' THEN 'Luxury RV Resort'::place_category_v2
    WHEN primary_category::text IN ('Overnight Parking Spot', 'Business Allowing Overnight Parking') THEN 'Overnight Parking'::place_category_v2
    WHEN primary_category::text IN ('Boondocking Area', 'Public Land') THEN 'Boondocking'::place_category_v2
    WHEN primary_category::text = 'Rest Area' THEN 'Rest Area / Travel Plaza'::place_category_v2
    WHEN primary_category::text IN ('Dump Station', 'Water Station', 'Propane Station', 'RV Service / Repair', 'Campground (Mixed)') THEN 'RV Campground'::place_category_v2
    ELSE 'RV Campground'::place_category_v2
  END,
  features_new = CASE 
    WHEN packages_accepted = 'Yes' THEN ARRAY['Fresh Water', 'Electric Hookups']::place_feature_v2[]
    WHEN packages_accepted = 'Limited' THEN ARRAY['Fresh Water']::place_feature_v2[]
    ELSE '{}'::place_feature_v2[]
  END,
  open_year_round = true;

-- Drop old columns and rename new ones
ALTER TABLE public.places DROP COLUMN primary_category;
ALTER TABLE public.places DROP COLUMN categories;
ALTER TABLE public.places DROP COLUMN features;

ALTER TABLE public.places RENAME COLUMN primary_category_new TO primary_category;
ALTER TABLE public.places RENAME COLUMN features_new TO features;

-- Add NOT NULL constraint
ALTER TABLE public.places ALTER COLUMN primary_category SET NOT NULL;
ALTER TABLE public.places ALTER COLUMN primary_category SET DEFAULT 'RV Campground'::place_category_v2;

-- Drop old types
DROP TYPE IF EXISTS public.place_category;
DROP TYPE IF EXISTS public.place_feature;

-- Rename new types to final names
ALTER TYPE public.place_category_v2 RENAME TO place_category;
ALTER TYPE public.place_feature_v2 RENAME TO place_feature;