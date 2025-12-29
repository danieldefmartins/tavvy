-- Function to check for nearby places (simpler version without pg_trgm)
CREATE OR REPLACE FUNCTION public.check_nearby_places(_lat NUMERIC, _lng NUMERIC, _name TEXT)
RETURNS TABLE(id UUID, name TEXT, distance_meters FLOAT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id,
    p.name,
    -- Haversine formula approximation for distance in meters
    (6371000 * acos(
      LEAST(1, GREATEST(-1,
        cos(radians(_lat)) * cos(radians(p.latitude)) * 
        cos(radians(p.longitude) - radians(_lng)) + 
        sin(radians(_lat)) * sin(radians(p.latitude))
      ))
    )) as distance_meters
  FROM public.places p
  WHERE 
    -- Quick bounding box filter first (roughly 200m = 0.002 degrees)
    p.latitude BETWEEN _lat - 0.002 AND _lat + 0.002
    AND p.longitude BETWEEN _lng - 0.002 AND _lng + 0.002
  ORDER BY distance_meters
  LIMIT 5;
$$;