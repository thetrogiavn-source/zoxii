-- ZOXI Test Data Seed
-- Run this in Supabase SQL Editor after creating an account
-- Replace 'YOUR_USER_ID' with your actual user ID from profiles table

-- Step 1: Get your user ID
-- SELECT id, email FROM public.profiles;

-- Step 2: Set your user ID here
DO $$
DECLARE
  seller_id UUID;
  va1 TEXT := '5401012345001';
  va2 TEXT := '5401012345002';
BEGIN
  -- Get the first seller
  SELECT id INTO seller_id FROM public.profiles WHERE role = 'seller' LIMIT 1;

  IF seller_id IS NULL THEN
    RAISE NOTICE 'No seller found. Please register an account first.';
    RETURN;
  END IF;

  -- Approve KYC
  UPDATE public.profiles SET kyc_status = 'approved', kyc_level = 2 WHERE id = seller_id;

  -- Create 2 Virtual Accounts (BIDV style - numeric only)
  INSERT INTO public.virtual_accounts (user_id, va_account, va_name, va_bank, va_type, va_status, hpay_request_id)
  VALUES
    (seller_id, va1, 'TRAN VAN HIEP ETSY SHOP', 'BIDV', '2', 1, 'VA_SEED_001'),
    (seller_id, va2, 'HIEP POD STORE', 'BIDV', '2', 1, 'VA_SEED_002')
  ON CONFLICT (va_account) DO NOTHING;

  -- Create incoming transactions (simulating Etsy payouts over 3 months)
  INSERT INTO public.transactions (va_account, user_id, amount, fee, net_amount, hpay_transaction_id, hpay_cashin_id, hpay_order_id, transfer_content, time_paid, status)
  VALUES
    -- January 2026
    (va1, seller_id, 25000000, 750000, 24250000, 'TXN_SEED_001', 'CI001', 'ORD001', 'Etsy payout Jan W1', '2026-01-07 10:30:00+07', 'completed'),
    (va1, seller_id, 32000000, 960000, 31040000, 'TXN_SEED_002', 'CI002', 'ORD002', 'Etsy payout Jan W2', '2026-01-14 10:30:00+07', 'completed'),
    (va1, seller_id, 28500000, 855000, 27645000, 'TXN_SEED_003', 'CI003', 'ORD003', 'Etsy payout Jan W3', '2026-01-21 10:30:00+07', 'completed'),
    (va2, seller_id, 15000000, 450000, 14550000, 'TXN_SEED_004', 'CI004', 'ORD004', 'Etsy payout Jan W4', '2026-01-28 10:30:00+07', 'completed'),

    -- February 2026
    (va1, seller_id, 35000000, 1050000, 33950000, 'TXN_SEED_005', 'CI005', 'ORD005', 'Etsy payout Feb W1', '2026-02-04 10:30:00+07', 'completed'),
    (va1, seller_id, 42000000, 1260000, 40740000, 'TXN_SEED_006', 'CI006', 'ORD006', 'Etsy payout Feb W2', '2026-02-11 10:30:00+07', 'completed'),
    (va2, seller_id, 18000000, 540000, 17460000, 'TXN_SEED_007', 'CI007', 'ORD007', 'Etsy payout Feb W3', '2026-02-18 10:30:00+07', 'completed'),
    (va1, seller_id, 38000000, 1140000, 36860000, 'TXN_SEED_008', 'CI008', 'ORD008', 'Etsy payout Feb W4', '2026-02-25 10:30:00+07', 'completed'),

    -- March 2026 (current month)
    (va1, seller_id, 45000000, 1350000, 43650000, 'TXN_SEED_009', 'CI009', 'ORD009', 'Etsy payout Mar W1', '2026-03-04 10:30:00+07', 'completed'),
    (va1, seller_id, 52000000, 1560000, 50440000, 'TXN_SEED_010', 'CI010', 'ORD010', 'Etsy payout Mar W2', '2026-03-11 10:30:00+07', 'completed'),
    (va2, seller_id, 22000000, 660000, 21340000, 'TXN_SEED_011', 'CI011', 'ORD011', 'Etsy payout Mar W3', '2026-03-18 10:30:00+07', 'completed'),
    (va1, seller_id, 48000000, 1440000, 46560000, 'TXN_SEED_012', 'CI012', 'ORD012', 'Etsy payout Mar W4', '2026-03-22 14:00:00+07', 'completed')
  ON CONFLICT (hpay_transaction_id) DO NOTHING;

  -- Create withdrawals
  INSERT INTO public.withdrawals (user_id, amount, bank_name, bank_account_number, bank_account_name, note, hpay_request_id, hpay_transaction_id, hpay_cashout_id, status, created_at)
  VALUES
    -- Successful withdrawals
    (seller_id, 50000000, 'BIDV', '31410001234567', 'TRAN VAN HIEP', 'Rut tien thang 1', 'WD_SEED_001', 'WDTXN001', 'CO001', 'success', '2026-01-30 15:00:00+07'),
    (seller_id, 80000000, 'BIDV', '31410001234567', 'TRAN VAN HIEP', 'Rut tien thang 2', 'WD_SEED_002', 'WDTXN002', 'CO002', 'success', '2026-02-28 15:00:00+07'),
    (seller_id, 60000000, 'VCB', '0071000123456', 'TRAN VAN HIEP', 'Rut tien dau thang 3', 'WD_SEED_003', 'WDTXN003', 'CO003', 'success', '2026-03-10 10:30:00+07'),

    -- Processing withdrawal (recent)
    (seller_id, 40000000, 'BIDV', '31410001234567', 'TRAN VAN HIEP', 'Rut tien 22/03', 'WD_SEED_004', NULL, NULL, 'processing', '2026-03-22 16:00:00+07'),

    -- Failed withdrawal
    (seller_id, 25000000, 'TCB', '19030001234567', 'TRAN VAN HIEP', 'Rut tien TCB', 'WD_SEED_005', 'WDTXN005', 'CO005', 'failed', '2026-03-15 11:00:00+07')
  ON CONFLICT DO NOTHING;

  -- Save bank accounts
  INSERT INTO public.bank_accounts (user_id, bank_name, bank_account_number, bank_account_name, is_default)
  VALUES
    (seller_id, 'BIDV', '31410001234567', 'TRAN VAN HIEP', true),
    (seller_id, 'VCB', '0071000123456', 'TRAN VAN HIEP', false)
  ON CONFLICT (user_id, bank_name, bank_account_number) DO NOTHING;

  RAISE NOTICE 'Test data seeded successfully for user %', seller_id;
  RAISE NOTICE 'KYC approved, 2 VAs created, 12 transactions, 5 withdrawals, 2 bank accounts';
END $$;
