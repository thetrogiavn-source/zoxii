// Hpay API Types

export type HpayScope = 'va' | 'transaction' | 'ibft' | 'account'

export interface HpayTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
}

export interface HpayApiResponse {
  errorCode: string
  errorMessage: string
  data: string // base64 encoded
  signature: string
}

// VA Types
export interface HpayVaCreateRequest {
  requestId: string
  merchantId: string
  vaType: '1' | '2' // 1=one-time, 2=multiple
  vaName: string
  vaCondition: '1' | '2' // 1=fixed, 2=flexible
  vaAmount?: string
  remark?: string
  vaExpirationTime?: number
}

export interface HpayVaCreateResponse {
  vaAccount: string
  vaName: string
  vaBank: string
  vaType: string
  vaCondition: string
  vaAmount: string
  vaStatus: number
  expiredTime: string
  qrCode: string
  quickLink: string
}

export interface HpayVaInquiryRequest {
  requestId: string
  merchantId: string
  vaAccount: string
}

export interface HpayVaInquiryResponse {
  vaAccount: string
  vaName: string
  vaBank: string
  merchantId: string
  transactions: {
    transId: string
    amount: string
    timePaid: string
    cashinId: string
    remark: string
  }[]
}

export interface HpayVaUpdateRequest {
  requestId: string
  merchantId: string
  vaAccount: string
  vaName: string
  remark?: string
}

export interface HpayVaRevokeRequest {
  requestId: string
  merchantId: string
  vaAccount: string
}

// IBFT Types
export interface HpayIbftTransferRequest {
  requestId: string
  merchantId: string
  bankName: string // bank code
  bankAccountNumber: string
  bankAccountName: string
  amount: string
  note?: string
}

export interface HpayIbftTransferResponse {
  requestId: string
  merchantId: string
  bankAccountNumber: string
  bankName: string
  bankAccountName: string
  amount: string
  note: string
  cashoutId: string
  transactionId: string
  transactionTime: string
}

export interface HpayIbftGetNameRequest {
  requestId: string
  merchantId: string
  bankName: string
  bankAccountNumber: string
}

export interface HpayIbftGetNameResponse {
  requestId: string
  merchantId: string
  bankAccountNumber: string
  bankName: string
  bankAccountName: string
}

export interface HpayIbftInquiryRequest {
  requestId: string
  merchantId: string
  transactionId?: string
}

// Account Types
export interface HpayGetBalanceRequest {
  requestId: string
  merchantId: string
}

export interface HpayGetBalanceResponse {
  merchantId: string
  merchantEmail: string
  balance: string
}

// Transaction Types
export interface HpayGetDetailRequest {
  merchantId: string
  orderCode?: string
  transactionId?: number
}

// Webhook
export interface HpayWebhookParams {
  va_account: string
  va_account_name: string
  va_account_addr?: string
  va_bank_name: string
  transfer_content: string
  amount: string
  mc_fee: string
  time_paid: string
  order_id: string
  cashin_id: string
  transaction_id: string
  client_request_id: string
  merchant_id: string
  secure_code: string
}
