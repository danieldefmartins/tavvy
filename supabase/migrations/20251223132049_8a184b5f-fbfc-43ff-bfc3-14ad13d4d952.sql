-- Drop the old unique constraint (not index) that's causing conflicts
ALTER TABLE public.place_stamp_aggregates 
  DROP CONSTRAINT IF EXISTS place_stamp_aggregates_place_id_dimension_polarity_key;

-- Create a new partial unique index for dimension-based aggregates (when stamp_id is NULL)
CREATE UNIQUE INDEX IF NOT EXISTS idx_place_stamp_aggregates_dimension 
  ON public.place_stamp_aggregates(place_id, dimension, polarity) 
  WHERE stamp_id IS NULL;