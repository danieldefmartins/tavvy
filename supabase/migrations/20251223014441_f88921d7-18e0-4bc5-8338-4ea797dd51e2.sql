-- Drop and recreate the handle_new_user function with correct column name
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, phone_number)
  VALUES (
    new.id,
    new.email,
    new.phone
  );
  RETURN new;
END;
$$;