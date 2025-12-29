-- Update the valid_field_name constraint to include open_year_round
ALTER TABLE public.place_suggestions DROP CONSTRAINT valid_field_name;
ALTER TABLE public.place_suggestions ADD CONSTRAINT valid_field_name CHECK (field_name IN (
  'name', 'primary_category', 'price_level', 'packages_accepted', 
  'package_fee_required', 'package_fee_amount', 'features', 'latitude', 'longitude', 'open_year_round'
));