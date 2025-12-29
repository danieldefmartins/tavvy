-- Add custom_category_text field to places table for "Other" category
ALTER TABLE places ADD COLUMN IF NOT EXISTS custom_category_text TEXT;

-- Add custom_category_text field to import_queue for user submissions
ALTER TABLE import_queue ADD COLUMN IF NOT EXISTS custom_category_text TEXT;