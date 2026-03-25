-- Add English columns for bilingual notifications
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS title_en TEXT;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS message_en TEXT;
