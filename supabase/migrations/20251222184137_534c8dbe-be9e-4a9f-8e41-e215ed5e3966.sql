-- Add contribution fields to profiles
ALTER TABLE public.profiles 
ADD COLUMN contribution_score integer NOT NULL DEFAULT 0,
ADD COLUMN is_pro boolean NOT NULL DEFAULT false;

-- Create function to increment contribution score on approval
CREATE OR REPLACE FUNCTION public.increment_contribution_score()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only trigger when status changes to 'approved'
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    UPDATE public.profiles
    SET contribution_score = contribution_score + 1
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger for auto-incrementing score
CREATE TRIGGER on_suggestion_approved
  AFTER UPDATE ON public.place_suggestions
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_contribution_score();