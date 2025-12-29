-- Update the is_verified trigger to only require email verification (phone removed)
CREATE OR REPLACE FUNCTION public.update_is_verified()
RETURNS TRIGGER AS $$
BEGIN
  -- Update is_verified based on email verification only (phone verification removed)
  NEW.is_verified := (NEW.email_verified = true);
  
  -- Set verified_at timestamps
  IF NEW.email_verified = true AND OLD.email_verified = false THEN
    NEW.email_verified_at := now();
  END IF;
  
  IF NEW.phone_verified = true AND OLD.phone_verified = false THEN
    NEW.phone_verified_at := now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Update existing profiles: set is_verified = true for users with email_verified = true
UPDATE public.profiles 
SET is_verified = true 
WHERE email_verified = true AND is_verified = false;