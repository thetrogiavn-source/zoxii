-- Telegram verification fields
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS telegram_username TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS telegram_verified BOOLEAN NOT NULL DEFAULT false;
