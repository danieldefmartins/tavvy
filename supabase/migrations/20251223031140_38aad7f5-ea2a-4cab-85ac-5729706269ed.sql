-- Update the handle_new_user trigger to NOT auto-verify email
-- Email will be verified when user clicks the confirmation link
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, email_verified, email_verified_at, is_verified)
  VALUES (
    new.id,
    new.email,
    false,  -- Not verified until they click the email link
    NULL,
    false
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;