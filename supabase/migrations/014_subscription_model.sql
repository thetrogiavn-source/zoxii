-- Step 1: Update existing tiers BEFORE adding constraint
UPDATE public.profiles SET tier = 'FREE' WHERE tier IN ('EMERALD', 'STANDARD', 'DRAGON') OR tier IS NULL OR tier NOT IN ('FREE', 'PRO', 'ENTERPRISE');
UPDATE public.profiles SET tier = 'PRO' WHERE tier IN ('SAPPHIRE', 'RUBY');

-- Step 2: Now safe to add constraint
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_tier_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_tier_check CHECK (tier IN ('FREE', 'PRO', 'ENTERPRISE'));

-- Step 3: Subscription fields
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'none' CHECK (subscription_status IN ('none', 'trial', 'active', 'cancelled', 'expired'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_start TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_end TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_amount_due DECIMAL(15,2) DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS trial_used BOOLEAN DEFAULT false;
