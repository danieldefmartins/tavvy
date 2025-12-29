-- Add identity fields to profiles for MUVO user identity system
-- Username: unique, required, public identifier
-- Full name: required, displayed on reviews
-- Traveler type: optional, displayed as badge
-- Home base: optional, context only

-- Create traveler type enum
CREATE TYPE public.traveler_type AS ENUM (
  'rv_full_timer',
  'weekend_rver', 
  'van_life',
  'tent_camper',
  'just_exploring'
);

-- Create contributor level enum for recognition system
CREATE TYPE public.contributor_level AS ENUM (
  'new_contributor',
  'active_contributor',
  'verified_contributor',
  'trusted_explorer'
);

-- Add new columns to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS username TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS traveler_type public.traveler_type,
ADD COLUMN IF NOT EXISTS home_base TEXT,
ADD COLUMN IF NOT EXISTS contributor_level public.contributor_level DEFAULT 'new_contributor',
ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT false;

-- Create index on username for fast lookups
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);

-- Add function to validate username format (lowercase, letters, numbers only)
CREATE OR REPLACE FUNCTION public.validate_username(username TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
BEGIN
  -- Username must be 3-30 chars, lowercase letters and numbers only
  RETURN username ~ '^[a-z0-9]{3,30}$';
END;
$$;

-- Add function to validate full name (at least 2 words, letters only, allows hyphens)
CREATE OR REPLACE FUNCTION public.validate_full_name(name TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
BEGIN
  -- At least 2 words, letters and hyphens/apostrophes for last names, 2-50 chars per word
  RETURN name ~ '^[A-Za-z''-]{2,50}(\s+[A-Za-z''-]{2,50})+$';
END;
$$;

-- Add function to calculate contributor level based on activity
CREATE OR REPLACE FUNCTION public.calculate_contributor_level(user_id_param UUID)
RETURNS public.contributor_level
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  review_count INTEGER;
  places_added INTEGER;
  is_phone_verified BOOLEAN;
  is_email_verified BOOLEAN;
BEGIN
  -- Get counts
  SELECT total_reviews_count, phone_verified, email_verified 
  INTO review_count, is_phone_verified, is_email_verified
  FROM public.profiles 
  WHERE id = user_id_param;
  
  -- Count places created by user
  SELECT COUNT(*) INTO places_added
  FROM public.places 
  WHERE created_by_user_id = user_id_param;
  
  -- Determine level
  -- Trusted Explorer: 20+ reviews, phone verified
  IF review_count >= 20 AND is_phone_verified THEN
    RETURN 'trusted_explorer';
  -- Verified Contributor: 10+ reviews, email verified  
  ELSIF review_count >= 10 AND is_email_verified THEN
    RETURN 'verified_contributor';
  -- Active Contributor: 3+ reviews or 1+ places
  ELSIF review_count >= 3 OR places_added >= 1 THEN
    RETURN 'active_contributor';
  ELSE
    RETURN 'new_contributor';
  END IF;
END;
$$;

-- Update contributor level when reviews change
CREATE OR REPLACE FUNCTION public.update_contributor_level_on_review()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_level public.contributor_level;
BEGIN
  IF TG_OP = 'INSERT' THEN
    new_level := public.calculate_contributor_level(NEW.user_id);
    UPDATE public.profiles SET contributor_level = new_level WHERE id = NEW.user_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    new_level := public.calculate_contributor_level(OLD.user_id);
    UPDATE public.profiles SET contributor_level = new_level WHERE id = OLD.user_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Create trigger for contributor level updates
DROP TRIGGER IF EXISTS update_contributor_level_trigger ON public.reviews;
CREATE TRIGGER update_contributor_level_trigger
AFTER INSERT OR DELETE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_contributor_level_on_review();

-- Allow users to view other users' public profiles (for profile page)
CREATE POLICY "Anyone can view public profile info"
ON public.profiles
FOR SELECT
USING (
  -- Users can view: username, full_name, traveler_type, home_base, contributor_level, 
  -- total_reviews_count, reviewer_medal, created_at, trusted_contributor
  -- This policy allows SELECT but the actual fields returned are controlled by the query
  true
);

-- Drop the restrictive policy and keep the permissive one for public viewing
-- Note: The existing policies are restrictive (Permissive: No), so we need to handle this carefully
-- Actually, let's add a permissive policy instead
DROP POLICY IF EXISTS "Anyone can view public profile info" ON public.profiles;