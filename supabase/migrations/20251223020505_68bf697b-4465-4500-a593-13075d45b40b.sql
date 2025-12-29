-- Update the check_trusted_status function to require 25 contributions instead of 10
-- This makes it harder to game the trusted status through volume alone

CREATE OR REPLACE FUNCTION public.check_trusted_status()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Auto-grant trusted status when contribution_count reaches 25 (increased from 10)
  -- This provides more resilience against gaming while still rewarding genuine contributors
  IF NEW.contribution_count >= 25 AND OLD.contribution_count < 25 AND NEW.trusted_contributor = false THEN
    NEW.trusted_contributor := true;
    NEW.trusted_since := now();
  END IF;
  RETURN NEW;
END;
$function$;