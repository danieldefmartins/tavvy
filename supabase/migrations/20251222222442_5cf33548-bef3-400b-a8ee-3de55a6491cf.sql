-- Create enum for photo categories
CREATE TYPE public.photo_category AS ENUM (
  'entrance', 
  'site_parking', 
  'hookups', 
  'dump_water', 
  'bathrooms_showers', 
  'surroundings', 
  'rules_signs'
);

-- Create storage bucket for place photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('place-photos', 'place-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for place-photos bucket
CREATE POLICY "Anyone can view place photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'place-photos');

CREATE POLICY "Verified users can upload place photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'place-photos' 
  AND auth.uid() IS NOT NULL 
  AND is_verified_user(auth.uid())
);

CREATE POLICY "Users can delete own place photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'place-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins can delete any place photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'place-photos' 
  AND has_role(auth.uid(), 'admin')
);

-- Create place_photos table
CREATE TABLE public.place_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  place_id UUID NOT NULL REFERENCES public.places(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  category photo_category NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_approved BOOLEAN NOT NULL DEFAULT true,
  flagged BOOLEAN NOT NULL DEFAULT false,
  flagged_by UUID REFERENCES public.profiles(id),
  flagged_at TIMESTAMP WITH TIME ZONE,
  flag_reason TEXT
);

-- Create indexes
CREATE INDEX idx_place_photos_place_id ON public.place_photos(place_id);
CREATE INDEX idx_place_photos_user_id ON public.place_photos(user_id);
CREATE INDEX idx_place_photos_flagged ON public.place_photos(flagged) WHERE flagged = true;

-- Enable Row Level Security
ALTER TABLE public.place_photos ENABLE ROW LEVEL SECURITY;

-- Anyone can view approved, non-flagged photos
CREATE POLICY "Anyone can view approved photos"
ON public.place_photos
FOR SELECT
USING (is_approved = true AND flagged = false);

-- Admins can view all photos (including flagged)
CREATE POLICY "Admins can view all photos"
ON public.place_photos
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Verified users can upload photos
CREATE POLICY "Verified users can upload photos"
ON public.place_photos
FOR INSERT
WITH CHECK (auth.uid() = user_id AND is_verified_user(auth.uid()));

-- Users can delete their own photos
CREATE POLICY "Users can delete own photos"
ON public.place_photos
FOR DELETE
USING (auth.uid() = user_id);

-- Admins can delete any photo
CREATE POLICY "Admins can delete any photo"
ON public.place_photos
FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Anyone logged in can flag photos (update flagged field)
CREATE POLICY "Users can flag photos"
ON public.place_photos
FOR UPDATE
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Admins can update any photo (for moderation)
CREATE POLICY "Admins can update photos"
ON public.place_photos
FOR UPDATE
USING (has_role(auth.uid(), 'admin'));