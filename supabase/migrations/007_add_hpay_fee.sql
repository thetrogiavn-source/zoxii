-- Add hpay_fee column to track Hpay's merchant fee (mc_fee from webhook)
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS hpay_fee DECIMAL(15,2) NOT NULL DEFAULT 0;

-- hpay_fee = mc_fee from Hpay webhook callback
-- This is the fee Hpay charges ZOXI per transaction
-- ZOXI profit = zoxi_fee (our fee to seller) - hpay_fee (Hpay's fee to us)
