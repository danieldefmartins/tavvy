-- Create the place_category enum
CREATE TYPE public.place_category AS ENUM (
  'National Park Campground',
  'State Park Campground',
  'County / Regional Park Campground',
  'City / Municipal Park Campground',
  'Public Land',
  'RV Campground',
  'Luxury RV Resort',
  'Campground (Mixed)',
  'Boondocking Area',
  'Overnight Parking Spot',
  'Business Allowing Overnight Parking',
  'Dump Station',
  'Water Station',
  'Propane Station',
  'RV Service / Repair',
  'Rest Area'
);

-- Add new columns to places table
ALTER TABLE public.places
ADD COLUMN primary_category public.place_category NOT NULL DEFAULT 'RV Campground',
ADD COLUMN categories public.place_category[] NOT NULL DEFAULT ARRAY['RV Campground']::public.place_category[],
ADD COLUMN cover_image_url TEXT;

-- Backfill existing places with reasonable category defaults based on their names
UPDATE public.places
SET 
  primary_category = CASE
    WHEN name ILIKE '%resort%' THEN 'Luxury RV Resort'::public.place_category
    WHEN name ILIKE '%state park%' THEN 'State Park Campground'::public.place_category
    WHEN name ILIKE '%national%' THEN 'National Park Campground'::public.place_category
    ELSE 'RV Campground'::public.place_category
  END,
  categories = ARRAY[
    CASE
      WHEN name ILIKE '%resort%' THEN 'Luxury RV Resort'::public.place_category
      WHEN name ILIKE '%state park%' THEN 'State Park Campground'::public.place_category
      WHEN name ILIKE '%national%' THEN 'National Park Campground'::public.place_category
      ELSE 'RV Campground'::public.place_category
    END
  ];