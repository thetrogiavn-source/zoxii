-- ZOXI Comprehensive Test Data Seed
-- Creates test data covering ALL statuses and states for admin dashboard review
-- Idempotent: safe to run multiple times (uses ON CONFLICT)

DO $$
DECLARE
  seller_id UUID;
  seller_email TEXT := 'thetrogiavn@gmail.com';
  -- VA accounts for different scenarios
  va1 TEXT := '5401012345001';
  va2 TEXT := '5401012345002';
  va3 TEXT := '5401098765001';
  va4 TEXT := '5401098765002';
  va5 TEXT := '5401055555001';
  -- Fixed UUIDs for KYC submissions (deterministic for idempotency)
  kyc_pending_1 UUID := 'a0000000-0000-0000-0000-000000000001';
  kyc_pending_2 UUID := 'a0000000-0000-0000-0000-000000000002';
  kyc_pending_3 UUID := 'a0000000-0000-0000-0000-000000000003';
  kyc_approved_1 UUID := 'a0000000-0000-0000-0000-000000000004';
  kyc_approved_2 UUID := 'a0000000-0000-0000-0000-000000000005';
  kyc_rejected_1 UUID := 'a0000000-0000-0000-0000-000000000006';
  kyc_rejected_2 UUID := 'a0000000-0000-0000-0000-000000000007';
BEGIN
  -- ============================================
  -- Step 1: Find the primary seller
  -- ============================================
  SELECT id INTO seller_id FROM public.profiles WHERE email = seller_email LIMIT 1;

  IF seller_id IS NULL THEN
    SELECT id INTO seller_id FROM public.profiles WHERE role = 'seller' LIMIT 1;
  END IF;

  IF seller_id IS NULL THEN
    RAISE NOTICE 'No seller found. Please register an account first.';
    RETURN;
  END IF;

  RAISE NOTICE 'Using seller: % (id: %)', seller_email, seller_id;

  -- ============================================
  -- Step 2: Update existing seller with varied profile data
  -- Ensure main seller is KYC approved, Gold tier
  -- ============================================
  UPDATE public.profiles
  SET kyc_status = 'approved', kyc_level = 2, tier = 'GOLD',
      full_name = 'Tran Van Hiep', phone = '0901234567',
      updated_at = NOW()
  WHERE id = seller_id;

  -- ============================================
  -- Step 3: KYC Submissions with ALL statuses
  -- ============================================

  -- 3 Pending submissions (different names, dates, documents)
  INSERT INTO public.kyc_submissions (id, user_id, cccd_front_url, cccd_back_url, selfie_url, cccd_number, full_name, date_of_birth, status, rejection_reason, reviewed_by, reviewed_at, created_at)
  VALUES
    (kyc_pending_1, seller_id,
     'kyc/pending1/cccd_front.jpg', 'kyc/pending1/cccd_back.jpg', 'kyc/pending1/selfie.jpg',
     '001099012345', 'NGUYEN THI MAI', '1995-03-15', 'pending',
     NULL, NULL, NULL, NOW() - INTERVAL '2 hours'),

    (kyc_pending_2, seller_id,
     'kyc/pending2/cccd_front.jpg', 'kyc/pending2/cccd_back.jpg', 'kyc/pending2/selfie.jpg',
     '079200001234', 'LE VAN TUNG', '1990-08-22', 'pending',
     NULL, NULL, NULL, NOW() - INTERVAL '1 day'),

    (kyc_pending_3, seller_id,
     'kyc/pending3/cccd_front.jpg', 'kyc/pending3/cccd_back.jpg', 'kyc/pending3/selfie.jpg',
     '038099054321', 'PHAM HOANG ANH', '1988-12-01', 'pending',
     NULL, NULL, NULL, NOW() - INTERVAL '3 days')
  ON CONFLICT (id) DO UPDATE SET
    status = EXCLUDED.status,
    cccd_number = EXCLUDED.cccd_number,
    full_name = EXCLUDED.full_name,
    date_of_birth = EXCLUDED.date_of_birth,
    created_at = EXCLUDED.created_at;

  -- 2 Approved submissions
  INSERT INTO public.kyc_submissions (id, user_id, cccd_front_url, cccd_back_url, selfie_url, cccd_number, full_name, date_of_birth, status, rejection_reason, reviewed_by, reviewed_at, created_at)
  VALUES
    (kyc_approved_1, seller_id,
     'kyc/approved1/cccd_front.jpg', 'kyc/approved1/cccd_back.jpg', 'kyc/approved1/selfie.jpg',
     '001095067890', 'TRAN VAN HIEP', '1993-05-10', 'approved',
     NULL, seller_id, NOW() - INTERVAL '30 days', NOW() - INTERVAL '35 days'),

    (kyc_approved_2, seller_id,
     'kyc/approved2/cccd_front.jpg', 'kyc/approved2/cccd_back.jpg', 'kyc/approved2/selfie.jpg',
     '024098011111', 'DO MINH QUAN', '1997-11-28', 'approved',
     NULL, seller_id, NOW() - INTERVAL '14 days', NOW() - INTERVAL '20 days')
  ON CONFLICT (id) DO UPDATE SET
    status = EXCLUDED.status,
    reviewed_by = EXCLUDED.reviewed_by,
    reviewed_at = EXCLUDED.reviewed_at,
    created_at = EXCLUDED.created_at;

  -- 2 Rejected submissions (with rejection reasons)
  INSERT INTO public.kyc_submissions (id, user_id, cccd_front_url, cccd_back_url, selfie_url, cccd_number, full_name, date_of_birth, status, rejection_reason, reviewed_by, reviewed_at, created_at)
  VALUES
    (kyc_rejected_1, seller_id,
     'kyc/rejected1/cccd_front.jpg', 'kyc/rejected1/cccd_back.jpg', 'kyc/rejected1/selfie.jpg',
     '052099099999', 'VU QUOC HUNG', '1992-07-04', 'rejected',
     'Anh CCCD mat truoc bi mo, khong doc duoc so CCCD. Vui long chup lai anh ro net hon.',
     seller_id, NOW() - INTERVAL '7 days', NOW() - INTERVAL '10 days'),

    (kyc_rejected_2, seller_id,
     'kyc/rejected2/cccd_front.jpg', 'kyc/rejected2/cccd_back.jpg', 'kyc/rejected2/selfie.jpg',
     '036200022222', 'HOANG DUC THINH', '2000-01-20', 'rejected',
     'Anh selfie khong khop voi anh tren CCCD. Khuon mat khong trung khop. Vui long chup lai selfie voi CCCD ben canh.',
     seller_id, NOW() - INTERVAL '5 days', NOW() - INTERVAL '8 days')
  ON CONFLICT (id) DO UPDATE SET
    status = EXCLUDED.status,
    rejection_reason = EXCLUDED.rejection_reason,
    reviewed_by = EXCLUDED.reviewed_by,
    reviewed_at = EXCLUDED.reviewed_at,
    created_at = EXCLUDED.created_at;

  -- ============================================
  -- Step 4: Virtual Accounts with various statuses
  -- ============================================

  -- Existing VAs (from 003 seed) + new ones
  INSERT INTO public.virtual_accounts (user_id, va_account, va_name, va_bank, va_type, va_status, hpay_request_id, created_at)
  VALUES
    (seller_id, va1, 'TRAN VAN HIEP ETSY SHOP', 'BIDV', '2', 1, 'VA_SEED_001', NOW() - INTERVAL '6 months'),
    (seller_id, va2, 'HIEP POD STORE', 'BIDV', '2', 1, 'VA_SEED_002', NOW() - INTERVAL '5 months'),
    (seller_id, va3, 'HIEP PRINTFUL ACCOUNT', 'BIDV', '2', 1, 'VA_SEED_003', NOW() - INTERVAL '3 months'),
    (seller_id, va4, 'HIEP AMAZON STORE', 'BIDV', '2', 0, 'VA_SEED_004', NOW() - INTERVAL '2 months'),  -- inactive VA (status=0)
    (seller_id, va5, 'HIEP SHOPIFY STORE', 'BIDV', '2', 1, 'VA_SEED_005', NOW() - INTERVAL '1 month')
  ON CONFLICT (va_account) DO UPDATE SET
    va_status = EXCLUDED.va_status,
    va_name = EXCLUDED.va_name,
    updated_at = NOW();

  -- ============================================
  -- Step 5: Transactions - varied amounts and dates across 6 months
  -- ============================================

  INSERT INTO public.transactions (va_account, user_id, amount, fee, net_amount, hpay_transaction_id, hpay_cashin_id, hpay_order_id, transfer_content, time_paid, status, created_at)
  VALUES
    -- === 6 months ago (October 2025) - Early days, small amounts ===
    (va1, seller_id, 500000, 15000, 485000, 'TXN_COMP_001', 'CI_C001', 'ORD_C001',
     'Etsy payout Oct W1 - first sale', NOW() - INTERVAL '6 months', 'completed', NOW() - INTERVAL '6 months'),

    (va1, seller_id, 1200000, 36000, 1164000, 'TXN_COMP_002', 'CI_C002', 'ORD_C002',
     'Etsy payout Oct W3', NOW() - INTERVAL '6 months' + INTERVAL '14 days', 'completed', NOW() - INTERVAL '6 months' + INTERVAL '14 days'),

    -- === 5 months ago (November 2025) ===
    (va1, seller_id, 8500000, 255000, 8245000, 'TXN_COMP_003', 'CI_C003', 'ORD_C003',
     'Etsy payout Nov W1', NOW() - INTERVAL '5 months', 'completed', NOW() - INTERVAL '5 months'),

    (va2, seller_id, 5000000, 150000, 4850000, 'TXN_COMP_004', 'CI_C004', 'ORD_C004',
     'POD store Nov payout', NOW() - INTERVAL '5 months' + INTERVAL '10 days', 'completed', NOW() - INTERVAL '5 months' + INTERVAL '10 days'),

    -- === 4 months ago (December 2025) - Holiday season spike ===
    (va1, seller_id, 65000000, 1950000, 63050000, 'TXN_COMP_005', 'CI_C005', 'ORD_C005',
     'Etsy payout Dec W1 - holiday rush', NOW() - INTERVAL '4 months', 'completed', NOW() - INTERVAL '4 months'),

    (va1, seller_id, 85000000, 2550000, 82450000, 'TXN_COMP_006', 'CI_C006', 'ORD_C006',
     'Etsy payout Dec W2 - peak season', NOW() - INTERVAL '4 months' + INTERVAL '7 days', 'completed', NOW() - INTERVAL '4 months' + INTERVAL '7 days'),

    (va2, seller_id, 35000000, 1050000, 33950000, 'TXN_COMP_007', 'CI_C007', 'ORD_C007',
     'POD store Dec holiday payout', NOW() - INTERVAL '4 months' + INTERVAL '14 days', 'completed', NOW() - INTERVAL '4 months' + INTERVAL '14 days'),

    (va1, seller_id, 120000000, 3600000, 116400000, 'TXN_COMP_008', 'CI_C008', 'ORD_C008',
     'Etsy payout Dec W4 - biggest month', NOW() - INTERVAL '4 months' + INTERVAL '21 days', 'completed', NOW() - INTERVAL '4 months' + INTERVAL '21 days'),

    -- === 3 months ago (January 2026) ===
    (va1, seller_id, 25000000, 750000, 24250000, 'TXN_COMP_009', 'CI_C009', 'ORD_C009',
     'Etsy payout Jan W1', NOW() - INTERVAL '3 months', 'completed', NOW() - INTERVAL '3 months'),

    (va3, seller_id, 15000000, 450000, 14550000, 'TXN_COMP_010', 'CI_C010', 'ORD_C010',
     'Printful payout Jan', NOW() - INTERVAL '3 months' + INTERVAL '10 days', 'completed', NOW() - INTERVAL '3 months' + INTERVAL '10 days'),

    (va1, seller_id, 32000000, 960000, 31040000, 'TXN_COMP_011', 'CI_C011', 'ORD_C011',
     'Etsy payout Jan W3', NOW() - INTERVAL '3 months' + INTERVAL '14 days', 'completed', NOW() - INTERVAL '3 months' + INTERVAL '14 days'),

    -- === 2 months ago (February 2026) ===
    (va1, seller_id, 42000000, 1260000, 40740000, 'TXN_COMP_012', 'CI_C012', 'ORD_C012',
     'Etsy payout Feb W1', NOW() - INTERVAL '2 months', 'completed', NOW() - INTERVAL '2 months'),

    (va3, seller_id, 18000000, 540000, 17460000, 'TXN_COMP_013', 'CI_C013', 'ORD_C013',
     'Printful payout Feb', NOW() - INTERVAL '2 months' + INTERVAL '7 days', 'completed', NOW() - INTERVAL '2 months' + INTERVAL '7 days'),

    (va5, seller_id, 9500000, 285000, 9215000, 'TXN_COMP_014', 'CI_C014', 'ORD_C014',
     'Shopify store first payout', NOW() - INTERVAL '2 months' + INTERVAL '14 days', 'completed', NOW() - INTERVAL '2 months' + INTERVAL '14 days'),

    (va1, seller_id, 55000000, 1650000, 53350000, 'TXN_COMP_015', 'CI_C015', 'ORD_C015',
     'Etsy payout Feb W4', NOW() - INTERVAL '2 months' + INTERVAL '21 days', 'completed', NOW() - INTERVAL '2 months' + INTERVAL '21 days'),

    -- === 1 month ago (March 2026 early) ===
    (va1, seller_id, 48000000, 1440000, 46560000, 'TXN_COMP_016', 'CI_C016', 'ORD_C016',
     'Etsy payout Mar W1', NOW() - INTERVAL '3 weeks', 'completed', NOW() - INTERVAL '3 weeks'),

    (va3, seller_id, 22000000, 660000, 21340000, 'TXN_COMP_017', 'CI_C017', 'ORD_C017',
     'Printful payout Mar', NOW() - INTERVAL '2 weeks', 'completed', NOW() - INTERVAL '2 weeks'),

    (va5, seller_id, 12000000, 360000, 11640000, 'TXN_COMP_018', 'CI_C018', 'ORD_C018',
     'Shopify payout Mar', NOW() - INTERVAL '10 days', 'completed', NOW() - INTERVAL '10 days'),

    -- === Recent transactions (last week) ===
    (va1, seller_id, 52000000, 1560000, 50440000, 'TXN_COMP_019', 'CI_C019', 'ORD_C019',
     'Etsy payout Mar W3', NOW() - INTERVAL '5 days', 'completed', NOW() - INTERVAL '5 days'),

    (va2, seller_id, 28000000, 840000, 27160000, 'TXN_COMP_020', 'CI_C020', 'ORD_C020',
     'POD store Mar payout', NOW() - INTERVAL '3 days', 'completed', NOW() - INTERVAL '3 days'),

    -- === Very recent / today ===
    (va1, seller_id, 150000000, 4500000, 145500000, 'TXN_COMP_021', 'CI_C021', 'ORD_C021',
     'Etsy large payout - bulk order 150M', NOW() - INTERVAL '1 day', 'completed', NOW() - INTERVAL '1 day'),

    (va5, seller_id, 500000, 15000, 485000, 'TXN_COMP_022', 'CI_C022', 'ORD_C022',
     'Shopify small test payout 500K', NOW() - INTERVAL '2 hours', 'completed', NOW() - INTERVAL '2 hours'),

    (va3, seller_id, 200000000, 6000000, 194000000, 'TXN_COMP_023', 'CI_C023', 'ORD_C023',
     'Printful mega payout 200M - Q1 bonus', NOW() - INTERVAL '30 minutes', 'completed', NOW() - INTERVAL '30 minutes'),

    (va1, seller_id, 750000, 22500, 727500, 'TXN_COMP_024', 'CI_C024', 'ORD_C024',
     'Etsy micro payout 750K', NOW() - INTERVAL '10 minutes', 'completed', NOW() - INTERVAL '10 minutes')

  ON CONFLICT (hpay_transaction_id) DO UPDATE SET
    amount = EXCLUDED.amount,
    fee = EXCLUDED.fee,
    net_amount = EXCLUDED.net_amount,
    time_paid = EXCLUDED.time_paid;

  -- ============================================
  -- Step 6: Withdrawals with ALL statuses
  -- ============================================

  INSERT INTO public.withdrawals (user_id, amount, bank_name, bank_account_number, bank_account_name, note, hpay_request_id, hpay_transaction_id, hpay_cashout_id, status, created_at, updated_at)
  VALUES
    -- === 5 SUCCESS withdrawals ===
    (seller_id, 30000000, 'BIDV', '31410001234567', 'TRAN VAN HIEP',
     'Rut tien thang 10 - lan dau', 'WD_COMP_001', 'WDTXN_C001', 'CO_C001', 'success',
     NOW() - INTERVAL '5 months', NOW() - INTERVAL '5 months' + INTERVAL '1 hour'),

    (seller_id, 100000000, 'BIDV', '31410001234567', 'TRAN VAN HIEP',
     'Rut tien thang 12 - holiday earnings 100M', 'WD_COMP_002', 'WDTXN_C002', 'CO_C002', 'success',
     NOW() - INTERVAL '3 months', NOW() - INTERVAL '3 months' + INTERVAL '2 hours'),

    (seller_id, 50000000, 'VCB', '0071000123456', 'TRAN VAN HIEP',
     'Rut tien Jan qua VCB', 'WD_COMP_003', 'WDTXN_C003', 'CO_C003', 'success',
     NOW() - INTERVAL '2 months', NOW() - INTERVAL '2 months' + INTERVAL '30 minutes'),

    (seller_id, 75000000, 'BIDV', '31410001234567', 'TRAN VAN HIEP',
     'Rut tien Feb - 75M', 'WD_COMP_004', 'WDTXN_C004', 'CO_C004', 'success',
     NOW() - INTERVAL '1 month', NOW() - INTERVAL '1 month' + INTERVAL '45 minutes'),

    (seller_id, 40000000, 'TCB', '19030009876543', 'TRAN VAN HIEP',
     'Rut tien TCB - da thanh cong', 'WD_COMP_005', 'WDTXN_C005', 'CO_C005', 'success',
     NOW() - INTERVAL '2 weeks', NOW() - INTERVAL '2 weeks' + INTERVAL '1 hour'),

    -- === 3 PROCESSING withdrawals ===
    (seller_id, 60000000, 'BIDV', '31410001234567', 'TRAN VAN HIEP',
     'Rut tien dang xu ly - BIDV 60M', 'WD_COMP_006', NULL, NULL, 'processing',
     NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),

    (seller_id, 25000000, 'VCB', '0071000123456', 'TRAN VAN HIEP',
     'Rut tien dang xu ly - VCB 25M', 'WD_COMP_007', NULL, NULL, 'processing',
     NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),

    (seller_id, 80000000, 'BIDV', '31410001234567', 'TRAN VAN HIEP',
     'Rut tien dang xu ly - hom nay 80M', 'WD_COMP_008', NULL, NULL, 'processing',
     NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours'),

    -- === 2 FAILED withdrawals (different dates and reasons) ===
    (seller_id, 45000000, 'TCB', '19030001234567', 'TRAN VAN HIEP',
     'Rut tien that bai - sai so TK', 'WD_COMP_009', 'WDTXN_C009', 'CO_C009', 'failed',
     NOW() - INTERVAL '6 weeks', NOW() - INTERVAL '6 weeks' + INTERVAL '3 hours'),

    (seller_id, 20000000, 'MB', '0801234567890', 'TRAN VAN HIEP',
     'Rut tien that bai - MB loi he thong', 'WD_COMP_010', 'WDTXN_C010', 'CO_C010', 'failed',
     NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days' + INTERVAL '2 hours')

  ON CONFLICT (hpay_request_id) DO UPDATE SET
    status = EXCLUDED.status,
    amount = EXCLUDED.amount,
    note = EXCLUDED.note,
    updated_at = EXCLUDED.updated_at;

  -- ============================================
  -- Step 7: Additional bank accounts
  -- ============================================

  INSERT INTO public.bank_accounts (user_id, bank_name, bank_account_number, bank_account_name, is_default)
  VALUES
    (seller_id, 'BIDV', '31410001234567', 'TRAN VAN HIEP', true),
    (seller_id, 'VCB', '0071000123456', 'TRAN VAN HIEP', false),
    (seller_id, 'TCB', '19030009876543', 'TRAN VAN HIEP', false),
    (seller_id, 'MB', '0801234567890', 'TRAN VAN HIEP', false)
  ON CONFLICT (user_id, bank_name, bank_account_number) DO NOTHING;

  -- ============================================
  -- Summary
  -- ============================================

  RAISE NOTICE '=== ZOXI Comprehensive Seed Complete ===';
  RAISE NOTICE 'Seller ID: %', seller_id;
  RAISE NOTICE 'KYC Submissions: 7 (3 pending, 2 approved, 2 rejected)';
  RAISE NOTICE 'Virtual Accounts: 5 (4 active, 1 inactive)';
  RAISE NOTICE 'Transactions: 24 (spanning 6 months, 500K to 200M VND)';
  RAISE NOTICE 'Withdrawals: 10 (5 success, 3 processing, 2 failed)';
  RAISE NOTICE 'Bank Accounts: 4 (BIDV, VCB, TCB, MB)';
  RAISE NOTICE '=========================================';

END $$;
