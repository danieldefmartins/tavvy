-- Create enum for place status
CREATE TYPE public.place_status AS ENUM ('open_accessible', 'access_questionable', 'temporarily_closed', 'restrictions_reported');

-- Add status fields to places table
ALTER TABLE public.places 
ADD COLUMN current_status place_status DEFAULT 'open_accessible',
ADD COLUMN status_updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Create place_status_updates table
CREATE TABLE public.place_status_updates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  place_id UUID NOT NULL REFERENCES public.places(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status place_status NOT NULL,
  note TEXT CHECK (char_length(note) <= 200),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES public.profiles(id),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_approved BOOLEAN DEFAULT false,
  is_rejected BOOLEAN DEFAULT false
);

-- Create indexes
CREATE INDEX idx_place_status_updates_place_id ON public.place_status_updates(place_id);
CREATE INDEX idx_place_status_updates_pending ON public.place_status_updates(is_approved, is_rejected) WHERE is_approved = false AND is_rejected = false;

-- Enable Row Level Security
ALTER TABLE public.place_status_updates ENABLE ROW LEVEL SECURITY;

-- Anyone can view approved status updates
CREATE POLICY "Anyone can view status updates"
ON public.place_status_updates
FOR SELECT
USING (true);

-- Verified users can create status updates
CREATE POLICY "Verified users can create status updates"
ON public.place_status_updates
FOR INSERT
WITH CHECK (auth.uid() = user_id AND is_verified_user(auth.uid()));

-- Admins can update status updates (for approval/rejection)
CREATE POLICY "Admins can update status updates"
ON public.place_status_updates
FOR UPDATE
USING (has_role(auth.uid(), 'admin'));