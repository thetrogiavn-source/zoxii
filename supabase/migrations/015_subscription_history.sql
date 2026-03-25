-- Subscription history log
CREATE TABLE IF NOT EXISTS public.subscription_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('trial_start', 'upgrade', 'downgrade', 'auto_charge', 'deduction', 'renewal')),
  billing TEXT CHECK (billing IN ('monthly', 'annual')),
  amount DECIMAL(15,2) DEFAULT 0,
  amount_due_before DECIMAL(15,2) DEFAULT 0,
  amount_due_after DECIMAL(15,2) DEFAULT 0,
  tier_before TEXT,
  tier_after TEXT,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.subscription_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription history"
  ON public.subscription_history FOR SELECT
  USING (auth.uid() = user_id);

-- Index
CREATE INDEX idx_subscription_history_user ON public.subscription_history(user_id, created_at DESC);
