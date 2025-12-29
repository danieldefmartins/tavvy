-- Add missing timestamp columns and rename phone to phone_number
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS phone_verified_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT false;

-- Rename phone to phone_number if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'phone') THEN
    ALTER TABLE public.profiles RENAME COLUMN phone TO phone_number;
  END IF;
END $$;

-- Create function to auto-update is_verified when phone/email verified status changes
CREATE OR REPLACE FUNCTION public.update_is_verified()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update is_verified based on both verifications
  NEW.is_verified := (NEW.email_verified = true AND NEW.phone_verified = true);
  
  -- Set verified_at timestamps
  IF NEW.email_verified = true AND OLD.email_verified = false THEN
    NEW.email_verified_at := now();
  END IF;
  
  IF NEW.phone_verified = true AND OLD.phone_verified = false THEN
    NEW.phone_verified_at := now();
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for auto-updating is_verified
DROP TRIGGER IF EXISTS update_is_verified_trigger ON public.profiles;
CREATE TRIGGER update_is_verified_trigger
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_is_verified();

-- Update the is_verified_user function to use the is_verified column
CREATE OR REPLACE FUNCTION public.is_verified_user(user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_verified FROM public.profiles WHERE id = user_id),
    false
  )
$$;