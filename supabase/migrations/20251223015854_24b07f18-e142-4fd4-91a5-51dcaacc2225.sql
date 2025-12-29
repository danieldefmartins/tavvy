-- Add rate limiting to check-ins by preventing more than 5 check-ins per hour per user
-- And prevent duplicate check-ins at the same place within 24 hours

-- Create a function to validate check-in rate limits
CREATE OR REPLACE FUNCTION public.validate_checkin_rate_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  checkins_last_hour integer;
  last_checkin_at_place timestamp with time zone;
BEGIN
  -- Check rate limit: max 5 check-ins per hour
  SELECT COUNT(*) INTO checkins_last_hour
  FROM public.place_checkins
  WHERE user_id = NEW.user_id
    AND created_at > (NOW() - INTERVAL '1 hour');
  
  IF checkins_last_hour >= 5 THEN
    RAISE EXCEPTION 'Rate limit exceeded: Maximum 5 check-ins per hour allowed';
  END IF;
  
  -- Prevent duplicate check-ins at same place within 24 hours
  SELECT created_at INTO last_checkin_at_place
  FROM public.place_checkins
  WHERE user_id = NEW.user_id
    AND place_id = NEW.place_id
    AND created_at > (NOW() - INTERVAL '24 hours')
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF last_checkin_at_place IS NOT NULL THEN
    RAISE EXCEPTION 'You already checked in at this place within the last 24 hours';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for check-in validation
DROP TRIGGER IF EXISTS validate_checkin_rate_limit_trigger ON public.place_checkins;
CREATE TRIGGER validate_checkin_rate_limit_trigger
  BEFORE INSERT ON public.place_checkins
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_checkin_rate_limit();

-- Add rate limiting to reviews: max 3 per hour per user
CREATE OR REPLACE FUNCTION public.validate_review_rate_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  reviews_last_hour integer;
BEGIN
  SELECT COUNT(*) INTO reviews_last_hour
  FROM public.reviews
  WHERE user_id = NEW.user_id
    AND created_at > (NOW() - INTERVAL '1 hour');
  
  IF reviews_last_hour >= 3 THEN
    RAISE EXCEPTION 'Rate limit exceeded: Maximum 3 reviews per hour allowed';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for review validation
DROP TRIGGER IF EXISTS validate_review_rate_limit_trigger ON public.reviews;
CREATE TRIGGER validate_review_rate_limit_trigger
  BEFORE INSERT ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_review_rate_limit();