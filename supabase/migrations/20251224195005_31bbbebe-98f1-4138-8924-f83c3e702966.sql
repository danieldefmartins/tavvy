-- ========================================
-- MUVO CATEGORY SYSTEM - PART 1: CATEGORY TABLES
-- ========================================

-- Create enum for category groups
CREATE TYPE public.category_group AS ENUM (
  'stay_sleep',
  'rv_services',
  'essential_stops',
  'non_rv_lodging',
  'food_drink',
  'general_services',
  'attractions',
  'health_safety',
  'retail',
  'community_other'
);

-- Create enum for tag groups
CREATE TYPE public.tag_group AS ENUM (
  'rv_specific',
  'utilities',
  'environment',
  'rules_policies',
  'cost'
);

-- Primary Categories Table
CREATE TABLE public.primary_categories (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  category_group category_group NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Secondary Categories (Tags) Table
CREATE TABLE public.secondary_categories (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  tag_group tag_group NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Junction table for place secondary categories (max 3 enforced via trigger)
CREATE TABLE public.place_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id UUID NOT NULL REFERENCES public.places(id) ON DELETE CASCADE,
  tag_id TEXT NOT NULL REFERENCES public.secondary_categories(id) ON DELETE CASCADE,
  added_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(place_id, tag_id)
);

-- Trigger to enforce max 3 tags per place
CREATE OR REPLACE FUNCTION public.enforce_max_place_tags()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  tag_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO tag_count
  FROM public.place_tags
  WHERE place_id = NEW.place_id;
  
  IF tag_count >= 3 THEN
    RAISE EXCEPTION 'A place can have a maximum of 3 secondary categories (tags)';
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER check_max_place_tags
  BEFORE INSERT ON public.place_tags
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_max_place_tags();

-- Enable RLS
ALTER TABLE public.primary_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.secondary_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.place_tags ENABLE ROW LEVEL SECURITY;

-- RLS Policies for primary_categories (read-only for all)
CREATE POLICY "Anyone can view primary categories"
  ON public.primary_categories FOR SELECT
  USING (true);

-- RLS Policies for secondary_categories (read-only for all)
CREATE POLICY "Anyone can view secondary categories"
  ON public.secondary_categories FOR SELECT
  USING (true);

-- RLS Policies for place_tags
CREATE POLICY "Anyone can view place tags"
  ON public.place_tags FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage place tags"
  ON public.place_tags FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- ========================================
-- INSERT PRIMARY CATEGORIES
-- ========================================

-- STAY / SLEEP
INSERT INTO public.primary_categories (id, label, category_group, sort_order) VALUES
  ('rv_park', 'RV Park', 'stay_sleep', 1),
  ('campground', 'Campground', 'stay_sleep', 2),
  ('boondocking', 'Boondocking / Dispersed Camping', 'stay_sleep', 3),
  ('overnight_parking', 'Overnight Parking', 'stay_sleep', 4),
  ('rest_area', 'Rest Area', 'stay_sleep', 5),
  ('county_city_park', 'County / City Park', 'stay_sleep', 6),
  ('state_park', 'State Park', 'stay_sleep', 7),
  ('national_park', 'National Park', 'stay_sleep', 8),
  ('fairgrounds', 'Fairgrounds / Event Grounds', 'stay_sleep', 9),
  ('military_camp', 'Military / Government Camp', 'stay_sleep', 10);

-- RV SERVICES
INSERT INTO public.primary_categories (id, label, category_group, sort_order) VALUES
  ('dump_station', 'Dump Station', 'rv_services', 1),
  ('water_fill', 'Water Fill Station', 'rv_services', 2),
  ('propane', 'Propane', 'rv_services', 3),
  ('rv_repair', 'RV Repair / Service', 'rv_services', 4),
  ('mobile_rv_tech', 'Mobile RV Technician', 'rv_services', 5),
  ('rv_dealer', 'RV Dealer', 'rv_services', 6),
  ('rv_storage', 'RV Storage', 'rv_services', 7),
  ('rv_wash', 'RV Wash', 'rv_services', 8),
  ('tire_service', 'Tire Service (RV-friendly)', 'rv_services', 9);

-- ESSENTIAL STOPS
INSERT INTO public.primary_categories (id, label, category_group, sort_order) VALUES
  ('fuel_station', 'Fuel Station (RV-friendly)', 'essential_stops', 1),
  ('truck_stop', 'Truck Stop', 'essential_stops', 2),
  ('grocery_store', 'Grocery Store', 'essential_stops', 3),
  ('convenience_store', 'Convenience Store', 'essential_stops', 4),
  ('ice_water_store', 'Ice / Water Store', 'essential_stops', 5),
  ('laundromat', 'Laundry / Laundromat', 'essential_stops', 6),
  ('pharmacy', 'Pharmacy', 'essential_stops', 7);

-- NON-RV LODGING
INSERT INTO public.primary_categories (id, label, category_group, sort_order) VALUES
  ('hotel_motel', 'Hotel / Motel', 'non_rv_lodging', 1),
  ('resort', 'Resort', 'non_rv_lodging', 2),
  ('cabin_lodge', 'Cabin / Lodge', 'non_rv_lodging', 3),
  ('hostel', 'Hostel', 'non_rv_lodging', 4);

-- FOOD & DRINK
INSERT INTO public.primary_categories (id, label, category_group, sort_order) VALUES
  ('restaurant', 'Restaurant', 'food_drink', 1),
  ('fast_food', 'Fast Food', 'food_drink', 2),
  ('cafe', 'Café / Coffee Shop', 'food_drink', 3),
  ('bar_brewery', 'Bar / Brewery', 'food_drink', 4),
  ('winery', 'Winery', 'food_drink', 5),
  ('food_truck', 'Food Truck', 'food_drink', 6);

-- GENERAL SERVICES
INSERT INTO public.primary_categories (id, label, category_group, sort_order) VALUES
  ('mechanic', 'Mechanic (Non-RV)', 'general_services', 1),
  ('tow_service', 'Tow Service', 'general_services', 2),
  ('auto_parts', 'Auto Parts Store', 'general_services', 3),
  ('hardware_store', 'Hardware Store', 'general_services', 4),
  ('welding', 'Welding / Fabrication', 'general_services', 5),
  ('locksmith', 'Locksmith', 'general_services', 6);

-- ATTRACTIONS & PLACES
INSERT INTO public.primary_categories (id, label, category_group, sort_order) VALUES
  ('scenic_view', 'Scenic View / Overlook', 'attractions', 1),
  ('beach', 'Beach', 'attractions', 2),
  ('lake_river', 'Lake / River Access', 'attractions', 3),
  ('trailhead', 'Trailhead', 'attractions', 4),
  ('visitor_center', 'Visitor Center', 'attractions', 5),
  ('landmark', 'Landmark / Monument', 'attractions', 6),
  ('museum', 'Museum', 'attractions', 7),
  ('theme_park', 'Theme Park', 'attractions', 8),
  ('downtown', 'Downtown / Walk Area', 'attractions', 9);

-- HEALTH & SAFETY
INSERT INTO public.primary_categories (id, label, category_group, sort_order) VALUES
  ('hospital', 'Hospital', 'health_safety', 1),
  ('urgent_care', 'Urgent Care', 'health_safety', 2),
  ('clinic', 'Clinic', 'health_safety', 3),
  ('dentist', 'Dentist', 'health_safety', 4),
  ('veterinary', 'Veterinary / Emergency Vet', 'health_safety', 5),
  ('police_station', 'Police Station', 'health_safety', 6),
  ('fire_station', 'Fire Station', 'health_safety', 7);

-- RETAIL
INSERT INTO public.primary_categories (id, label, category_group, sort_order) VALUES
  ('big_box_store', 'Big Box Store', 'retail', 1),
  ('outdoor_store', 'Outdoor Store', 'retail', 2),
  ('rv_supplies', 'RV Supplies Store', 'retail', 3),
  ('mall', 'Mall / Shopping Center', 'retail', 4);

-- COMMUNITY / OTHER
INSERT INTO public.primary_categories (id, label, category_group, sort_order) VALUES
  ('church', 'Church / Religious Center', 'community_other', 1),
  ('community_center', 'Community Center', 'community_other', 2),
  ('coworking', 'Co-working Space', 'community_other', 3),
  ('library', 'Library', 'community_other', 4),
  ('other', 'Other', 'community_other', 99);

-- ========================================
-- INSERT SECONDARY CATEGORIES (TAGS)
-- ========================================

-- RV-SPECIFIC
INSERT INTO public.secondary_categories (id, label, tag_group, sort_order) VALUES
  ('big_rig_friendly', 'Big Rig Friendly', 'rv_specific', 1),
  ('easy_access', 'Easy In / Easy Out', 'rv_specific', 2),
  ('tow_friendly', 'Tow Friendly', 'rv_specific', 3),
  ('24_7_access', '24/7 Access', 'rv_specific', 4),
  ('seasonal', 'Seasonal', 'rv_specific', 5),
  ('reservation_required', 'Reservation Required', 'rv_specific', 6),
  ('walk_ins_ok', 'Walk-ins OK', 'rv_specific', 7);

-- UTILITIES
INSERT INTO public.secondary_categories (id, label, tag_group, sort_order) VALUES
  ('electric_hookups', 'Electric Hookups', 'utilities', 1),
  ('water_hookups', 'Water Hookups', 'utilities', 2),
  ('sewer_hookups', 'Sewer Hookups', 'utilities', 3),
  ('full_hookups', 'Full Hookups', 'utilities', 4),
  ('dump_only', 'Dump Only', 'utilities', 5),
  ('water_only', 'Water Only', 'utilities', 6),
  ('no_utilities', 'No Utilities', 'utilities', 7);

-- ENVIRONMENT
INSERT INTO public.secondary_categories (id, label, tag_group, sort_order) VALUES
  ('quiet', 'Quiet', 'environment', 1),
  ('scenic', 'Scenic', 'environment', 2),
  ('shaded', 'Shaded', 'environment', 3),
  ('windy', 'Windy', 'environment', 4),
  ('high_elevation', 'High Elevation', 'environment', 5),
  ('desert', 'Desert', 'environment', 6),
  ('forest', 'Forest', 'environment', 7),
  ('beachfront', 'Beachfront', 'environment', 8);

-- RULES & POLICIES
INSERT INTO public.secondary_categories (id, label, tag_group, sort_order) VALUES
  ('pets_allowed', 'Pets Allowed', 'rules_policies', 1),
  ('alcohol_allowed', 'Alcohol Allowed', 'rules_policies', 2),
  ('generators_allowed', 'Generators Allowed', 'rules_policies', 3),
  ('campfires_allowed', 'Campfires Allowed', 'rules_policies', 4),
  ('overnight_allowed', 'Overnight Allowed', 'rules_policies', 5),
  ('day_use_only', 'Day Use Only', 'rules_policies', 6);

-- COST
INSERT INTO public.secondary_categories (id, label, tag_group, sort_order) VALUES
  ('free', 'Free', 'cost', 1),
  ('paid', 'Paid', 'cost', 2),
  ('cheap', 'Cheap', 'cost', 3),
  ('premium', 'Premium', 'cost', 4),
  ('membership_required', 'Membership Required', 'cost', 5);