-- Update the handle_new_user function to set email_verified = true by default
-- since we're using auto-confirm email signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public 
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, email_verified, email_verified_at)
  VALUES (
    new.id,
    new.email,
    true,
    now()
  );
  RETURN new;
END;
$$;