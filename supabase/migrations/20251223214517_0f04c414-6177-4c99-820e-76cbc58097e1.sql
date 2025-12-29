-- Fix the trigger function for reviews table
-- The reviews table uses 'updated_at', not 'last_updated'

-- Create a new trigger function specifically for updated_at columns
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Drop the incorrect trigger
DROP TRIGGER IF EXISTS update_reviews_updated_at ON public.reviews;

-- Create the correct trigger using the new function
CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();