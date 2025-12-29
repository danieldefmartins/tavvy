-- Create enum for check-in types
CREATE TYPE public.checkin_type AS ENUM ('stayed_here', 'used_dump_water', 'passed_by');

-- Create place_checkins table
CREATE TABLE public.place_checkins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  place_id UUID NOT NULL REFERENCES public.places(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type checkin_type NOT NULL,
  note TEXT CHECK (char_length(note) <= 200),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for common queries
CREATE INDEX idx_place_checkins_place_id ON public.place_checkins(place_id);
CREATE INDEX idx_place_checkins_user_id ON public.place_checkins(user_id);
CREATE INDEX idx_place_checkins_created_at ON public.place_checkins(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.place_checkins ENABLE ROW LEVEL SECURITY;

-- Anyone can view check-ins
CREATE POLICY "Anyone can view check-ins"
ON public.place_checkins
FOR SELECT
USING (true);

-- Verified users can create check-ins
CREATE POLICY "Verified users can create check-ins"
ON public.place_checkins
FOR INSERT
WITH CHECK (auth.uid() = user_id AND is_verified_user(auth.uid()));

-- Users can delete their own check-ins
CREATE POLICY "Users can delete own check-ins"
ON public.place_checkins
FOR DELETE
USING (auth.uid() = user_id);

-- Admins can delete any check-in
CREATE POLICY "Admins can delete any check-in"
ON public.place_checkins
FOR DELETE
USING (has_role(auth.uid(), 'admin'));