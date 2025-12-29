-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  phone TEXT,
  email_verified BOOLEAN NOT NULL DEFAULT false,
  phone_verified BOOLEAN NOT NULL DEFAULT false,
  display_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- Function to check if user is fully verified (email + phone)
CREATE OR REPLACE FUNCTION public.is_verified_user(user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id
    AND email_verified = true
    AND phone_verified = true
  )
$$;

-- Trigger to update profiles.updated_at
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_places_last_updated();

-- Create storage bucket for place images
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('place-images', 'place-images', true, 5242880);

-- Storage policies: Only verified users can upload
CREATE POLICY "Verified users can upload place images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'place-images' 
  AND public.is_verified_user(auth.uid())
);

-- Anyone can view place images (public bucket)
CREATE POLICY "Anyone can view place images"
ON storage.objects FOR SELECT
USING (bucket_id = 'place-images');

-- Users can delete their own uploads
CREATE POLICY "Users can delete own uploads"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'place-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Function to handle new user signup - auto-create profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, phone, email_verified, phone_verified)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.phone,
    COALESCE(NEW.email_confirmed_at IS NOT NULL, false),
    COALESCE(NEW.phone_confirmed_at IS NOT NULL, false)
  );
  RETURN NEW;
END;
$$;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();