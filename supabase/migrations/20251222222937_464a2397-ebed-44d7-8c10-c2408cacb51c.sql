-- Add trusted contributor fields to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS contribution_count INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS trusted_contributor BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS trusted_since TIMESTAMP WITH TIME ZONE;

-- Create function to check and update trusted status
CREATE OR REPLACE FUNCTION public.check_trusted_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Auto-grant trusted status when contribution_count reaches 10
  IF NEW.contribution_count >= 10 AND OLD.contribution_count < 10 AND NEW.trusted_contributor = false THEN
    NEW.trusted_contributor := true;
    NEW.trusted_since := now();
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger for auto-trusted
CREATE TRIGGER check_trusted_status_trigger
BEFORE UPDATE ON public.profiles
FOR EACH ROW
WHEN (NEW.contribution_count != OLD.contribution_count)
EXECUTE FUNCTION public.check_trusted_status();

-- Function to increment contribution count for a user
CREATE OR REPLACE FUNCTION public.increment_contribution(user_id_param UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET contribution_count = contribution_count + 1
  WHERE id = user_id_param;
END;
$$;

-- Trigger for check-ins (increment immediately since check-ins don't need approval)
CREATE OR REPLACE FUNCTION public.increment_checkin_contribution()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.increment_contribution(NEW.user_id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER increment_contribution_on_checkin
AFTER INSERT ON public.place_checkins
FOR EACH ROW
EXECUTE FUNCTION public.increment_checkin_contribution();

-- Trigger for approved photos
CREATE OR REPLACE FUNCTION public.increment_photo_contribution()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only increment when photo is approved and not flagged
  IF NEW.is_approved = true AND NEW.flagged = false THEN
    -- Check if this is a new approved photo or was just approved
    IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND (OLD.is_approved = false OR OLD.flagged = true)) THEN
      PERFORM public.increment_contribution(NEW.user_id);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER increment_contribution_on_photo
AFTER INSERT OR UPDATE ON public.place_photos
FOR EACH ROW
EXECUTE FUNCTION public.increment_photo_contribution();

-- Trigger for approved status updates
CREATE OR REPLACE FUNCTION public.increment_status_contribution()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only increment when status update is approved
  IF NEW.is_approved = true AND OLD.is_approved = false THEN
    PERFORM public.increment_contribution(NEW.user_id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER increment_contribution_on_status
AFTER UPDATE ON public.place_status_updates
FOR EACH ROW
EXECUTE FUNCTION public.increment_status_contribution();

-- Update existing suggestion trigger (already exists but let's ensure it's correct)
CREATE OR REPLACE FUNCTION public.increment_suggestion_contribution()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only increment when suggestion is approved
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    PERFORM public.increment_contribution(NEW.user_id);
  END IF;
  RETURN NEW;
END;
$$;

-- Drop old trigger if exists and create new one
DROP TRIGGER IF EXISTS increment_contribution_on_suggestion ON public.place_suggestions;
CREATE TRIGGER increment_contribution_on_suggestion
AFTER UPDATE ON public.place_suggestions
FOR EACH ROW
EXECUTE FUNCTION public.increment_suggestion_contribution();