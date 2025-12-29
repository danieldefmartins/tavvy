-- ============================================
-- MUVO v1.8: Membership-Aware Discovery
-- ============================================

-- 1. Create membership types enum
CREATE TYPE public.membership_type AS ENUM (
  'thousand_trails',
  'harvest_hosts',
  'boondockers_welcome',
  'koa',
  'passport_america',
  'good_sam',
  'state_regional_pass'
);

-- 2. Create memberships reference table
CREATE TABLE public.memberships (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text,
  website_url text,
  affiliate_url text,
  icon text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;

-- Anyone can view memberships
CREATE POLICY "Anyone can view memberships"
ON public.memberships FOR SELECT
USING (true);

-- Admins can manage memberships
CREATE POLICY "Admins can manage memberships"
ON public.memberships FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Insert the 7 membership options
INSERT INTO public.memberships (id, name, description, website_url, sort_order) VALUES
  ('thousand_trails', 'Thousand Trails', 'Access to 80+ campgrounds across the US', 'https://thousandtrails.com', 1),
  ('harvest_hosts', 'Harvest Hosts', 'Overnight stays at wineries, farms, and breweries', 'https://harvesthosts.com', 2),
  ('boondockers_welcome', 'Boondockers Welcome', 'Free overnight parking at member hosts', 'https://boondockerswelcome.com', 3),
  ('koa', 'KOA', 'Rewards and discounts at KOA campgrounds', 'https://koa.com', 4),
  ('passport_america', 'Passport America', '50% discount at participating campgrounds', 'https://passportamerica.com', 5),
  ('good_sam', 'Good Sam', '10% discount at Good Sam parks and services', 'https://goodsam.com', 6),
  ('state_regional_pass', 'State / Regional Park Pass', 'Discounts at state and regional parks', NULL, 7);

-- 3. Create user_memberships junction table
CREATE TABLE public.user_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  membership_id text NOT NULL REFERENCES public.memberships(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, membership_id)
);

-- Enable RLS
ALTER TABLE public.user_memberships ENABLE ROW LEVEL SECURITY;

-- Users can view own memberships
CREATE POLICY "Users can view own memberships"
ON public.user_memberships FOR SELECT
USING (auth.uid() = user_id);

-- Users can add own memberships
CREATE POLICY "Users can add own memberships"
ON public.user_memberships FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can remove own memberships
CREATE POLICY "Users can remove own memberships"
ON public.user_memberships FOR DELETE
USING (auth.uid() = user_id);

-- 4. Create place_memberships junction table
CREATE TABLE public.place_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id uuid NOT NULL REFERENCES public.places(id) ON DELETE CASCADE,
  membership_id text NOT NULL REFERENCES public.memberships(id) ON DELETE CASCADE,
  is_verified boolean NOT NULL DEFAULT false,
  verified_by uuid REFERENCES auth.users(id),
  verified_at timestamp with time zone,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (place_id, membership_id)
);

-- Enable RLS
ALTER TABLE public.place_memberships ENABLE ROW LEVEL SECURITY;

-- Anyone can view place memberships
CREATE POLICY "Anyone can view place memberships"
ON public.place_memberships FOR SELECT
USING (true);

-- Verified users can suggest place memberships
CREATE POLICY "Verified users can suggest place memberships"
ON public.place_memberships FOR INSERT
WITH CHECK (is_verified_user(auth.uid()));

-- Admins can manage place memberships
CREATE POLICY "Admins can manage place memberships"
ON public.place_memberships FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 5. Add membership_prompt_shown flag to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS membership_prompt_shown boolean NOT NULL DEFAULT false;

-- 6. Create trigger for updated_at on place_memberships
CREATE TRIGGER update_place_memberships_updated_at
BEFORE UPDATE ON public.place_memberships
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();