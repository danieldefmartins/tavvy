
-- Create enum for review dimensions
CREATE TYPE public.review_dimension AS ENUM (
  'quality',
  'service',
  'value',
  'cleanliness',
  'location',
  'comfort',
  'reliability',
  'speed',
  'restrictions'
);

-- Create enum for signal polarity
CREATE TYPE public.signal_polarity AS ENUM ('positive', 'improvement');

-- Create reviews table
CREATE TABLE public.reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  place_id UUID NOT NULL REFERENCES public.places(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  note_public VARCHAR(250),
  note_private VARCHAR(250),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(place_id, user_id)
);

-- Create review_signals table
CREATE TABLE public.review_signals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  place_id UUID NOT NULL REFERENCES public.places(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  dimension review_dimension NOT NULL,
  polarity signal_polarity NOT NULL,
  level INTEGER NOT NULL CHECK (level >= 1 AND level <= 3),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_signals ENABLE ROW LEVEL SECURITY;

-- Reviews policies
CREATE POLICY "Anyone can view reviews"
  ON public.reviews FOR SELECT
  USING (true);

CREATE POLICY "Verified users can create reviews"
  ON public.reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id AND is_verified_user(auth.uid()));

CREATE POLICY "Users can update own reviews"
  ON public.reviews FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reviews"
  ON public.reviews FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can delete any review"
  ON public.reviews FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Review signals policies
CREATE POLICY "Anyone can view signals"
  ON public.review_signals FOR SELECT
  USING (true);

CREATE POLICY "Verified users can create signals"
  ON public.review_signals FOR INSERT
  WITH CHECK (auth.uid() = user_id AND is_verified_user(auth.uid()));

CREATE POLICY "Users can update own signals"
  ON public.review_signals FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own signals"
  ON public.review_signals FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_places_last_updated();

-- Increment contribution when review is created
CREATE OR REPLACE FUNCTION public.increment_review_contribution()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.increment_contribution(NEW.user_id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER increment_contribution_on_review
  AFTER INSERT ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_review_contribution();
