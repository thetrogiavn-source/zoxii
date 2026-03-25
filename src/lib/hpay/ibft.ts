import { hpayRequest, generateRequestId } from './client'
import { MOCK_ENABLED, mockIbftTransfer, mockGetBankAccountName } from './mock'
import type {
  HpayIbftTransferRequest,
  HpayIbftTransferResponse,
  HpayIbftGetNameRequest,
  HpayIbftGetNameResponse,
  HpayIbftInquiryRequest,
} from './types'

const MID = process.env.HPAY_MID || 'MOCK_MID'

/**
 * Transfer money to a bank account (cash-out)
 */
export async function transfer(params: {
  bankName: string
  bankAccountNumber: string
  bankAccountName: string
  amount: string
  note?: string
}): Promise<HpayIbftTransferResponse> {
  if (MOCK_ENABLED) return mockIbftTransfer(params)

  const requestId = generateRequestId('WD')

  const payload: HpayIbftTransferRequest = {
    requestId,
    merchantId: MID,
    ...params,
  }

  return hpayRequest<Record<string, unknown>, HpayIbftTransferResponse>(
    'ibft',
    '/service/ibft/v1/transfer',
    payload as unknown as Record<string, unknown>
  )
}

/**
 * Verify bank account holder name
 */
export async function getBankAccountName(
  bankName: string,
  bankAccountNumber: string
): Promise<HpayIbftGetNameResponse> {
  if (MOCK_ENABLED) return mockGetBankAccountName(bankName, bankAccountNumber)

  const payload: HpayIbftGetNameRequest = {
    requestId: generateRequestId('BN'),
    merchantId: MID,
    bankName,
    bankAccountNumber,
  }

  return hpayRequest<Record<string, unknown>, HpayIbftGetNameResponse>(
    'ibft',
    '/service/ibft/v1/get-name',
    payload as unknown as Record<string, unknown>
  )
}

/**
 * Check transfer status
 */
export async function inquiryTransfer(requestId: string, transactionId?: string) {
  if (MOCK_ENABLED) return { transactions: [] }

  const payload: HpayIbftInquiryRequest = {
    requestId,
    merchantId: MID,
    transactionId,
  }

  return hpayRequest('ibft', '/service/ibft/v1/inquiry', payload as unknown as Record<string, unknown>)
}
