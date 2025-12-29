-- Add terms_accepted_at column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS terms_accepted_at timestamp with time zone DEFAULT NULL;

-- Add first_name and last_name columns for split name storage
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS first_name text DEFAULT NULL;

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS last_name text DEFAULT NULL;