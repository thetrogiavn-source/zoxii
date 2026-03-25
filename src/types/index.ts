// Database types
export interface Profile {
  id: string
  email: string
  full_name: string | null
  phone: string | null
  role: 'seller' | 'admin'
  kyc_status: 'none' | 'pending' | 'approved' | 'rejected'
  tier: 'FREE' | 'PRO' | 'ENTERPRISE'
  subscription_status?: 'none' | 'trial' | 'active' | 'cancelled' | 'expired'
  subscription_start?: string | null
  subscription_end?: string | null
  subscription_amount_due?: number
  trial_used?: boolean
  kyc_level: number
  created_at: string
  updated_at: string
}

export interface KycSubmission {
  id: string
  user_id: string
  cccd_front_url: string
  cccd_back_url: string
  selfie_url: string
  cccd_number: string | null
  full_name: string | null
  date_of_birth: string | null
  status: 'pending' | 'approved' | 'rejected'
  rejection_reason: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
}

export interface VirtualAccount {
  id: string
  user_id: string
  va_account: string
  va_name: string
  va_bank: string | null
  va_type: string
  va_status: number
  platform: string | null
  qr_code: string | null
  quick_link: string | null
  hpay_request_id: string
  created_at: string
  updated_at: string
}

export interface Transaction {
  id: string
  va_account: string
  user_id: string
  amount: number
  fee: number
  net_amount: number
  hpay_transaction_id: string
  hpay_cashin_id: string | null
  hpay_order_id: string | null
  transfer_content: string | null
  time_paid: string
  status: string
  created_at: string
}

export interface Withdrawal {
  id: string
  user_id: string
  amount: number
  bank_name: string
  bank_account_number: string
  bank_account_name: string
  note: string | null
  hpay_request_id: string
  hpay_transaction_id: string | null
  hpay_cashout_id: string | null
  status: 'processing' | 'success' | 'failed'
  created_at: string
  updated_at: string
}

export interface BankAccount {
  id: string
  user_id: string
  bank_name: string
  bank_account_number: string
  bank_account_name: string
  is_default: boolean
  created_at: string
}
