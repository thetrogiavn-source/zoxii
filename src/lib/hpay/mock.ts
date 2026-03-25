/**
 * Hpay Mock Mode
 * Simulates Hpay API responses for development/testing without real credentials
 */

import type {
  HpayVaCreateResponse,
  HpayVaInquiryResponse,
  HpayIbftTransferResponse,
  HpayIbftGetNameResponse,
  HpayGetBalanceResponse,
} from './types'

export const MOCK_ENABLED = process.env.HPAY_MOCK_MODE === 'true'

let mockVaCounter = 1000

function generateBIDVAccount(): string {
  mockVaCounter++
  // BIDV-style account: 14 digits, purely numeric
  return `54010${Date.now().toString().slice(-5)}${mockVaCounter}`
}

export function mockCreateVA(vaName: string): HpayVaCreateResponse {
  const vaAccount = generateBIDVAccount()
  return {
    vaAccount,
    vaName,
    vaBank: 'BIDV',
    vaType: '2',
    vaCondition: '2',
    vaAmount: '0',
    vaStatus: 1,
    expiredTime: '',
    qrCode: `https://img.vietqr.io/image/BIDV-${vaAccount}-compact.png`,
    quickLink: `https://pay.hpay.com.vn/${vaAccount}`,
  }
}

export function mockInquiryVA(vaAccount: string): HpayVaInquiryResponse {
  return {
    vaAccount,
    vaName: 'MOCK VA',
    vaBank: 'BIDV',
    merchantId: 'MOCK_MID',
    transactions: [],
  }
}

export function mockIbftTransfer(params: {
  bankAccountNumber: string
  bankAccountName: string
  bankName: string
  amount: string
}): HpayIbftTransferResponse {
  const txId = `TXN${Date.now()}`
  return {
    requestId: `WD${Date.now().toString(36)}`,
    merchantId: 'MOCK_MID',
    bankAccountNumber: params.bankAccountNumber,
    bankName: params.bankName,
    bankAccountName: params.bankAccountName,
    amount: params.amount,
    note: 'ZOXI withdrawal',
    cashoutId: `CO${Date.now()}`,
    transactionId: txId,
    transactionTime: new Date().toISOString(),
  }
}

export function mockGetBankAccountName(
  bankName: string,
  bankAccountNumber: string
): HpayIbftGetNameResponse {
  // Simulate bank name lookup
  const mockNames: Record<string, string> = {
    VCB: 'NGUYEN VAN A',
    TCB: 'TRAN THI B',
    BIDV: 'LE VAN C',
    ACB: 'PHAM THI D',
    MBB: 'HOANG VAN E',
  }
  return {
    requestId: `BN${Date.now().toString(36)}`,
    merchantId: 'MOCK_MID',
    bankAccountNumber,
    bankName,
    bankAccountName: mockNames[bankName] || 'NGUYEN VAN MOCK',
  }
}

export function mockGetBalance(): HpayGetBalanceResponse {
  return {
    merchantId: 'MOCK_MID',
    merchantEmail: 'demo@zoxi.vn',
    balance: '50,000,000',
  }
}

/**
 * Generate mock webhook query string (simulate Etsy payment arriving)
 * Use this to test: GET /api/hpay/webhook?{params}
 */
export function generateMockWebhookUrl(
  vaAccount: string,
  amount: number,
  baseUrl: string = 'http://localhost:3001'
): string {
  const params = new URLSearchParams({
    va_account: vaAccount,
    va_account_name: 'MOCK VA',
    va_bank_name: 'BIDV',
    transfer_content: Buffer.from('Etsy payment mock').toString('base64'),
    amount: String(amount),
    mc_fee: '0',
    time_paid: String(Math.floor(Date.now() / 1000)),
    order_id: `ORD${Date.now()}`,
    cashin_id: `CI${Date.now()}`,
    transaction_id: `TXN${Date.now()}`,
    client_request_id: `VA${Date.now().toString(36)}`,
    merchant_id: process.env.HPAY_MID || 'MOCK_MID',
    secure_code: 'MOCK_SKIP_VERIFY',
  })

  return `${baseUrl}/api/hpay/webhook?${params.toString()}`
}
