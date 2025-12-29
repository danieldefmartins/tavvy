-- Create enum for reviewer medals
CREATE TYPE public.reviewer_medal AS ENUM ('none', 'bronze', 'silver', 'gold');

-- Add medal-related fields to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS total_reviews_count integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS trust_score integer NOT NULL DEFAULT 100,
ADD COLUMN IF NOT EXISTS reviewer_medal public.reviewer_medal NOT NULL DEFAULT 'none',
ADD COLUMN IF NOT EXISTS reviewer_medal_awarded_at timestamp with time zone;

-- Add medal snapshot to reviews for historical reference
ALTER TABLE public.reviews
ADD COLUMN IF NOT EXISTS reviewer_medal public.reviewer_medal DEFAULT 'none';

-- Create function to calculate and update reviewer medal
CREATE OR REPLACE FUNCTION public.calculate_reviewer_medal(user_id_param uuid)
RETURNS public.reviewer_medal
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  profile_record RECORD;
  review_count integer;
  account_age_days integer;
  new_medal public.reviewer_medal;
BEGIN
  -- Get profile data
  SELECT 
    p.*,
    EXTRACT(DAY FROM (now() - p.created_at)) as days_since_created
  INTO profile_record
  FROM public.profiles p
  WHERE p.id = user_id_param;
  
  IF profile_record IS NULL THEN
    RETURN 'none';
  END IF;
  
  review_count := profile_record.total_reviews_count;
  account_age_days := COALESCE(profile_record.days_since_created, 0);
  
  -- Calculate medal based on criteria
  IF review_count >= 50 
     AND profile_record.phone_verified = true 
     AND account_age_days >= 90 
     AND profile_record.trust_score >= 80 THEN
    new_medal := 'gold';
  ELSIF review_count >= 20 
        AND profile_record.phone_verified = true 
        AND account_age_days >= 30 THEN
    new_medal := 'silver';
  ELSIF review_count >= 5 
        AND profile_record.email_verified = true THEN
    new_medal := 'bronze';
  ELSE
    new_medal := 'none';
  END IF;
  
  RETURN new_medal;
END;
$$;

-- Create function to update medal for a user
CREATE OR REPLACE FUNCTION public.update_reviewer_medal(user_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_medal public.reviewer_medal;
  current_medal public.reviewer_medal;
BEGIN
  -- Get current medal
  SELECT reviewer_medal INTO current_medal
  FROM public.profiles
  WHERE id = user_id_param;
  
  -- Calculate new medal
  new_medal := public.calculate_reviewer_medal(user_id_param);
  
  -- Update if changed
  IF new_medal != current_medal THEN
    UPDATE public.profiles
    SET 
      reviewer_medal = new_medal,
      reviewer_medal_awarded_at = CASE 
        WHEN new_medal != 'none' AND (current_medal = 'none' OR reviewer_medal_awarded_at IS NULL) 
        THEN now()
        ELSE reviewer_medal_awarded_at
      END
    WHERE id = user_id_param;
  END IF;
END;
$$;

-- Create trigger to update review count and medal when review is created
CREATE OR REPLACE FUNCTION public.update_review_count_and_medal()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_medal public.reviewer_medal;
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment review count
    UPDATE public.profiles
    SET total_reviews_count = total_reviews_count + 1
    WHERE id = NEW.user_id;
    
    -- Update medal
    PERFORM public.update_reviewer_medal(NEW.user_id);
    
    -- Get current medal and store on review
    SELECT reviewer_medal INTO current_medal
    FROM public.profiles
    WHERE id = NEW.user_id;
    
    NEW.reviewer_medal := COALESCE(current_medal, 'none');
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement review count
    UPDATE public.profiles
    SET total_reviews_count = GREATEST(0, total_reviews_count - 1)
    WHERE id = OLD.user_id;
    
    -- Update medal (might downgrade)
    PERFORM public.update_reviewer_medal(OLD.user_id);
    
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Create triggers
DROP TRIGGER IF EXISTS update_review_count_on_insert ON public.reviews;
CREATE TRIGGER update_review_count_on_insert
  BEFORE INSERT ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_review_count_and_medal();

DROP TRIGGER IF EXISTS update_review_count_on_delete ON public.reviews;
CREATE TRIGGER update_review_count_on_delete
  AFTER DELETE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_review_count_and_medal();

-- Function to reduce trust score (for flagged reviews)
CREATE OR REPLACE FUNCTION public.reduce_trust_score(user_id_param uuid, reduction integer DEFAULT 10)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET trust_score = GREATEST(0, trust_score - reduction)
  WHERE id = user_id_param;
  
  -- Re-evaluate medal after trust score change
  PERFORM public.update_reviewer_medal(user_id_param);
END;
$$;

-- Admin function to override medal
CREATE OR REPLACE FUNCTION public.admin_set_reviewer_medal(
  target_user_id uuid,
  new_medal public.reviewer_medal
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET 
    reviewer_medal = new_medal,
    reviewer_medal_awarded_at = CASE 
      WHEN new_medal != 'none' THEN now()
      ELSE reviewer_medal_awarded_at
    END
  WHERE id = target_user_id;
END;
$$;

-- Backfill existing profiles with review counts
UPDATE public.profiles p
SET total_reviews_count = (
  SELECT COUNT(*) FROM public.reviews r WHERE r.user_id = p.id
);

-- Update medals for all existing users
DO $$
DECLARE
  profile_id uuid;
BEGIN
  FOR profile_id IN SELECT id FROM public.profiles
  LOOP
    PERFORM public.update_reviewer_medal(profile_id);
  END LOOP;
END;
$$;