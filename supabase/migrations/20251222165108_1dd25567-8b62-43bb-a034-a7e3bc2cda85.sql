-- Create enum types for price level and package acceptance
CREATE TYPE price_level AS ENUM ('$', '$$', '$$$');
CREATE TYPE package_acceptance AS ENUM ('Yes', 'No', 'Limited');

-- Create places table
CREATE TABLE public.places (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  latitude NUMERIC NOT NULL,
  longitude NUMERIC NOT NULL,
  price_level price_level NOT NULL DEFAULT '$$',
  packages_accepted package_acceptance NOT NULL DEFAULT 'No',
  package_fee_required BOOLEAN NOT NULL DEFAULT false,
  package_fee_amount TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  has_conflict BOOLEAN NOT NULL DEFAULT false,
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security (public read, admin write for now)
ALTER TABLE public.places ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read places (public browsing without account)
CREATE POLICY "Anyone can view places" 
ON public.places 
FOR SELECT 
USING (true);

-- Create trigger to auto-update last_updated
CREATE OR REPLACE FUNCTION public.update_places_last_updated()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_places_last_updated
BEFORE UPDATE ON public.places
FOR EACH ROW
EXECUTE FUNCTION public.update_places_last_updated();

-- Seed with 10 realistic RV places
INSERT INTO public.places (name, latitude, longitude, price_level, packages_accepted, package_fee_required, package_fee_amount, is_verified, has_conflict, last_updated) VALUES
('Desert Oasis RV Resort', 33.4484, -112.0740, '$$$', 'Yes', false, NULL, true, false, now() - interval '2 days'),
('Riverside Family Campground', 34.0522, -118.2437, '$$', 'Yes', true, '$5 per package', true, false, now() - interval '5 days'),
('Mountain View RV Park', 39.7392, -104.9903, '$$', 'Limited', true, '$3 handling fee', true, false, now() - interval '1 day'),
('Coastal Breeze RV Resort', 32.7157, -117.1611, '$$$', 'Yes', false, NULL, true, false, now() - interval '3 days'),
('Pine Forest Campground', 35.1983, -111.6513, '$', 'No', false, NULL, false, true, now() - interval '10 days'),
('Sunset Mesa RV Park', 36.1699, -115.1398, '$$', 'Yes', true, '$2 per delivery', true, false, now() - interval '4 days'),
('Lakeside Haven RV Resort', 36.7783, -119.4179, '$$$', 'Yes', false, NULL, true, false, now() - interval '1 day'),
('Prairie Wind Campground', 41.2565, -95.9345, '$', 'Limited', false, NULL, false, false, now() - interval '14 days'),
('Red Rock RV Ranch', 34.8697, -111.7610, '$$', 'Yes', true, '$4 package fee', true, false, now() - interval '6 days'),
('Gulf Shore RV Resort', 30.2672, -97.7431, '$$$', 'Yes', false, NULL, true, true, now() - interval '8 days');