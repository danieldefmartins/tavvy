-- ========================================
-- MUVO MIGRATION SYSTEM - PART 4: DATA MIGRATION & HELPER FUNCTIONS
-- ========================================

-- Create a mapping from old place_category enum to new category_id
-- This migrates existing data to use the new category system

-- Map existing primary_category values to new category_id
UPDATE public.places SET category_id = CASE primary_category
  WHEN 'National Park' THEN 'national_park'
  WHEN 'State Park' THEN 'state_park'
  WHEN 'County / Regional Park' THEN 'county_city_park'
  WHEN 'RV Campground' THEN 'rv_park'
  WHEN 'Luxury RV Resort' THEN 'rv_park'
  WHEN 'Overnight Parking' THEN 'overnight_parking'
  WHEN 'Boondocking' THEN 'boondocking'
  WHEN 'Business Allowing Overnight' THEN 'overnight_parking'
  WHEN 'Rest Area / Travel Plaza' THEN 'rest_area'
  WHEN 'Fairgrounds / Event Grounds' THEN 'fairgrounds'
  ELSE 'campground'
END;

-- Set existing places as admin entries
UPDATE public.places SET import_source = 'admin_entry' WHERE import_source IS NULL;

-- Helper function to get category label
CREATE OR REPLACE FUNCTION public.get_category_label(_category_id TEXT)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT label FROM public.primary_categories WHERE id = _category_id;
$$;

-- Helper function to get tag labels for a place
CREATE OR REPLACE FUNCTION public.get_place_tags(_place_id UUID)
RETURNS TEXT[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(array_agg(sc.label), '{}')
  FROM public.place_tags pt
  JOIN public.secondary_categories sc ON sc.id = pt.tag_id
  WHERE pt.place_id = _place_id;
$$;

-- Function to safely add a tag to a place (respects max 3 limit)
CREATE OR REPLACE FUNCTION public.add_place_tag(_place_id UUID, _tag_id TEXT, _user_id UUID DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  tag_count INTEGER;
BEGIN
  -- Check current tag count
  SELECT COUNT(*) INTO tag_count FROM public.place_tags WHERE place_id = _place_id;
  
  IF tag_count >= 3 THEN
    RETURN FALSE;
  END IF;
  
  -- Insert tag (will fail silently if duplicate)
  INSERT INTO public.place_tags (place_id, tag_id, added_by)
  VALUES (_place_id, _tag_id, _user_id)
  ON CONFLICT (place_id, tag_id) DO NOTHING;
  
  RETURN TRUE;
END;
$$;

-- Function to process an import queue item
CREATE OR REPLACE FUNCTION public.process_import_item(
  _import_id UUID,
  _action TEXT, -- 'approve', 'reject', 'merge'
  _merge_with_place_id UUID DEFAULT NULL,
  _admin_id UUID DEFAULT NULL,
  _notes TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _import RECORD;
  _new_place_id UUID;
  _category_id TEXT;
BEGIN
  -- Get the import item
  SELECT * INTO _import FROM public.import_queue WHERE id = _import_id;
  
  IF _import IS NULL THEN
    RAISE EXCEPTION 'Import item not found';
  END IF;
  
  IF _action = 'reject' THEN
    UPDATE public.import_queue 
    SET status = 'rejected', reviewed_by = _admin_id, reviewed_at = now(), review_notes = _notes
    WHERE id = _import_id;
    RETURN NULL;
    
  ELSIF _action = 'merge' THEN
    IF _merge_with_place_id IS NULL THEN
      RAISE EXCEPTION 'Must provide place_id to merge with';
    END IF;
    
    -- Update import queue
    UPDATE public.import_queue 
    SET status = 'merged', reviewed_by = _admin_id, reviewed_at = now(), 
        resulting_place_id = _merge_with_place_id, review_notes = _notes
    WHERE id = _import_id;
    
    -- Add external reference
    IF _import.external_id IS NOT NULL THEN
      INSERT INTO public.external_place_references (place_id, source, external_id, raw_data)
      VALUES (_merge_with_place_id, _import.source, _import.external_id, _import.raw_data)
      ON CONFLICT (source, external_id) DO NOTHING;
    END IF;
    
    RETURN _merge_with_place_id;
    
  ELSIF _action = 'approve' THEN
    -- Determine category
    _category_id := COALESCE(_import.suggested_primary_category, 'other');
    
    -- Create new place
    INSERT INTO public.places (
      name, latitude, longitude, category_id, import_source, 
      primary_category, needs_review, data_quality_score
    ) VALUES (
      _import.name, _import.latitude, _import.longitude, _category_id, _import.source,
      'RV Campground'::place_category, false, 0.7
    )
    RETURNING id INTO _new_place_id;
    
    -- Add external reference
    IF _import.external_id IS NOT NULL THEN
      INSERT INTO public.external_place_references (place_id, source, external_id, raw_data)
      VALUES (_new_place_id, _import.source, _import.external_id, _import.raw_data)
      ON CONFLICT (source, external_id) DO NOTHING;
    END IF;
    
    -- Add suggested tags
    IF _import.suggested_tags IS NOT NULL THEN
      FOR i IN 1..LEAST(3, array_length(_import.suggested_tags, 1)) LOOP
        PERFORM public.add_place_tag(_new_place_id, _import.suggested_tags[i], _admin_id);
      END LOOP;
    END IF;
    
    -- Update import queue
    UPDATE public.import_queue 
    SET status = 'approved', reviewed_by = _admin_id, reviewed_at = now(), 
        resulting_place_id = _new_place_id, review_notes = _notes
    WHERE id = _import_id;
    
    RETURN _new_place_id;
  END IF;
  
  RAISE EXCEPTION 'Invalid action: %', _action;
END;
$$;

-- Function to queue an import with automatic duplicate detection
CREATE OR REPLACE FUNCTION public.queue_import(
  _source external_source,
  _external_id TEXT,
  _name TEXT,
  _lat NUMERIC,
  _lng NUMERIC,
  _raw_data JSONB,
  _suggested_category TEXT DEFAULT NULL,
  _suggested_tags TEXT[] DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _existing_place_id UUID;
  _duplicate RECORD;
  _import_id UUID;
  _status import_review_status;
BEGIN
  -- Check if external ID already exists
  SELECT place_id INTO _existing_place_id 
  FROM public.external_place_references 
  WHERE source = _source AND external_id = _external_id;
  
  IF _existing_place_id IS NOT NULL THEN
    -- Already imported, skip
    RETURN NULL;
  END IF;
  
  -- Check for potential duplicates
  SELECT * INTO _duplicate 
  FROM public.find_duplicate_places(_lat, _lng, _name, 200)
  ORDER BY confidence_score DESC
  LIMIT 1;
  
  IF _duplicate IS NOT NULL AND _duplicate.confidence_score >= 0.8 THEN
    _status := 'needs_review';
  ELSE
    _status := 'pending';
  END IF;
  
  -- Insert into queue
  INSERT INTO public.import_queue (
    source, external_id, raw_data, name, latitude, longitude,
    suggested_primary_category, suggested_tags, status,
    potential_duplicate_id, duplicate_confidence
  ) VALUES (
    _source, _external_id, _raw_data, _name, _lat, _lng,
    _suggested_category, _suggested_tags, _status,
    _duplicate.place_id, _duplicate.confidence_score
  )
  RETURNING id INTO _import_id;
  
  RETURN _import_id;
END;
$$;