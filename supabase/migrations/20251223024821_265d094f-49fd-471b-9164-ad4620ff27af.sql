-- Drop the incorrectly attached trigger from profiles table
DROP TRIGGER IF EXISTS update_profiles_last_updated ON public.profiles;

-- Also ensure the trigger only exists on the places table where it belongs
DROP TRIGGER IF EXISTS update_places_last_updated ON public.profiles;