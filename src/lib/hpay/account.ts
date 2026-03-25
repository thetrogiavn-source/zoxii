import { hpayRequest, generateRequestId } from './client'
import { MOCK_ENABLED, mockGetBalance } from './mock'
import type { HpayGetBalanceRequest, HpayGetBalanceResponse } from './types'

const MID = process.env.HPAY_MID || 'MOCK_MID'

/**
 * Get merchant account balance
 */
export async function getBalance(): Promise<HpayGetBalanceResponse> {
  if (MOCK_ENABLED) return mockGetBalance()

  const payload: HpayGetBalanceRequest = {
    requestId: generateRequestId('BL'),
    merchantId: MID,
  }

  return hpayRequest<Record<string, unknown>, HpayGetBalanceResponse>(
    'account',
    '/service/account/v1/get-balance',
    payload as unknown as Record<string, unknown>
  )
}
