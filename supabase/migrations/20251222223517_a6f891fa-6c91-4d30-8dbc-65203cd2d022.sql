-- Create notification type enum
CREATE TYPE public.notification_type AS ENUM (
  'place_status_changed',
  'place_photo_added',
  'place_updated'
);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type public.notification_type NOT NULL,
  place_id UUID REFERENCES public.places(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  read_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can only view their own notifications
CREATE POLICY "Users can view own notifications"
  ON public.notifications
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
  ON public.notifications
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications"
  ON public.notifications
  FOR DELETE
  USING (auth.uid() = user_id);

-- System can insert notifications (via triggers with security definer)
CREATE POLICY "System can insert notifications"
  ON public.notifications
  FOR INSERT
  WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX idx_notifications_unread ON public.notifications(user_id) WHERE read_at IS NULL;

-- Function to create notifications for users who have favorited a place
CREATE OR REPLACE FUNCTION public.notify_place_followers(
  _place_id UUID,
  _type notification_type,
  _title TEXT,
  _message TEXT,
  _exclude_user_id UUID DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id UUID;
  _recent_count INT;
  _last_notification TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get all users who have this place in their favorites
  FOR _user_id IN 
    SELECT DISTINCT user_id FROM public.favorites WHERE place_id = _place_id
  LOOP
    -- Skip the user who triggered the action (if provided)
    IF _exclude_user_id IS NOT NULL AND _user_id = _exclude_user_id THEN
      CONTINUE;
    END IF;
    
    -- Check for de-duplication: same place + type within 10 minutes
    SELECT created_at INTO _last_notification
    FROM public.notifications
    WHERE user_id = _user_id
      AND place_id = _place_id
      AND type = _type
      AND created_at > now() - interval '10 minutes'
    ORDER BY created_at DESC
    LIMIT 1;
    
    IF _last_notification IS NOT NULL THEN
      -- Update existing notification instead of creating new one
      UPDATE public.notifications
      SET message = _message, title = _title, created_at = now(), read_at = NULL
      WHERE user_id = _user_id
        AND place_id = _place_id
        AND type = _type
        AND created_at > now() - interval '10 minutes';
      CONTINUE;
    END IF;
    
    -- Check daily limit: max 5 notifications per place per day per user
    SELECT COUNT(*) INTO _recent_count
    FROM public.notifications
    WHERE user_id = _user_id
      AND place_id = _place_id
      AND created_at > now() - interval '1 day';
    
    IF _recent_count >= 5 THEN
      CONTINUE;
    END IF;
    
    -- Create the notification
    INSERT INTO public.notifications (user_id, type, place_id, title, message)
    VALUES (_user_id, _type, _place_id, _title, _message);
  END LOOP;
END;
$$;

-- Trigger function for place status changes
CREATE OR REPLACE FUNCTION public.notify_on_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _place_name TEXT;
  _status_label TEXT;
BEGIN
  -- Only trigger when status actually changes and is approved
  IF NEW.is_approved = true AND (OLD.is_approved IS NULL OR OLD.is_approved = false) THEN
    SELECT name INTO _place_name FROM public.places WHERE id = NEW.place_id;
    
    -- Get human-readable status
    _status_label := CASE NEW.status
      WHEN 'open_accessible' THEN 'Open & Accessible'
      WHEN 'access_questionable' THEN 'Access Questionable'
      WHEN 'temporarily_closed' THEN 'Temporarily Closed'
      WHEN 'restrictions_reported' THEN 'Restrictions Reported'
      ELSE NEW.status::text
    END;
    
    PERFORM public.notify_place_followers(
      NEW.place_id,
      'place_status_changed'::notification_type,
      'Status Update: ' || COALESCE(_place_name, 'A place'),
      'Status changed to: ' || _status_label,
      NEW.user_id
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger for status updates
CREATE TRIGGER notify_status_change_trigger
  AFTER UPDATE ON public.place_status_updates
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_status_change();

-- Trigger function for new approved photos
CREATE OR REPLACE FUNCTION public.notify_on_photo_approved()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _place_name TEXT;
BEGIN
  -- Trigger when photo is approved and not flagged
  IF NEW.is_approved = true AND NEW.flagged = false THEN
    -- Check if this is new approval
    IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND (OLD.is_approved = false OR OLD.flagged = true)) THEN
      SELECT name INTO _place_name FROM public.places WHERE id = NEW.place_id;
      
      PERFORM public.notify_place_followers(
        NEW.place_id,
        'place_photo_added'::notification_type,
        'New Photo: ' || COALESCE(_place_name, 'A place'),
        'A new photo has been added to this place.',
        NEW.user_id
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger for photos
CREATE TRIGGER notify_photo_approved_trigger
  AFTER INSERT OR UPDATE ON public.place_photos
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_photo_approved();

-- Trigger function for approved suggestions
CREATE OR REPLACE FUNCTION public.notify_on_suggestion_approved()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _place_name TEXT;
  _field_label TEXT;
BEGIN
  -- Only trigger when suggestion is approved
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    SELECT name INTO _place_name FROM public.places WHERE id = NEW.place_id;
    
    -- Get human-readable field name
    _field_label := CASE NEW.field_name
      WHEN 'name' THEN 'name'
      WHEN 'latitude' THEN 'location'
      WHEN 'longitude' THEN 'location'
      WHEN 'primary_category' THEN 'category'
      WHEN 'price_level' THEN 'price level'
      WHEN 'packages_accepted' THEN 'package acceptance'
      WHEN 'features' THEN 'features'
      ELSE NEW.field_name
    END;
    
    PERFORM public.notify_place_followers(
      NEW.place_id,
      'place_updated'::notification_type,
      'Update: ' || COALESCE(_place_name, 'A place'),
      'The ' || _field_label || ' has been updated.',
      NEW.user_id
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger for suggestions
CREATE TRIGGER notify_suggestion_approved_trigger
  AFTER UPDATE ON public.place_suggestions
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_suggestion_approved();