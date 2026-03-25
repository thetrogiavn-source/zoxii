import { hpayRequest, generateRequestId } from './client'
import { MOCK_ENABLED, mockCreateVA, mockInquiryVA } from './mock'
import type {
  HpayVaCreateRequest,
  HpayVaCreateResponse,
  HpayVaInquiryRequest,
  HpayVaInquiryResponse,
  HpayVaUpdateRequest,
  HpayVaRevokeRequest,
} from './types'

const MID = process.env.HPAY_MID || 'MOCK_MID'

/**
 * Create a new Virtual Account
 */
export async function createVA(vaName: string): Promise<HpayVaCreateResponse> {
  if (MOCK_ENABLED) return mockCreateVA(vaName)

  const requestId = generateRequestId('VA')

  const notifyUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://zoxii.vercel.app'}/va/callback`

  const payload: HpayVaCreateRequest = {
    requestId,
    merchantId: MID,
    vaType: '2',
    vaName,
    vaCondition: '2',
    notifyUrl,
  }

  return hpayRequest<Record<string, unknown>, HpayVaCreateResponse>(
    'va',
    '/service/va/v1/create',
    payload as unknown as Record<string, unknown>
  )
}

/**
 * Inquiry VA transactions
 */
export async function inquiryVA(vaAccount: string): Promise<HpayVaInquiryResponse> {
  if (MOCK_ENABLED) return mockInquiryVA(vaAccount)

  const payload: HpayVaInquiryRequest = {
    requestId: generateRequestId('VQ'),
    merchantId: MID,
    vaAccount,
  }

  return hpayRequest<Record<string, unknown>, HpayVaInquiryResponse>(
    'va',
    '/service/va/v1/inquiry',
    payload as unknown as Record<string, unknown>
  )
}

/**
 * Update VA name
 */
export async function updateVA(vaAccount: string, vaName: string, remark?: string) {
  if (MOCK_ENABLED) return { vaAccount, vaName, remark }

  const payload: HpayVaUpdateRequest = {
    requestId: generateRequestId('VU'),
    merchantId: MID,
    vaAccount,
    vaName,
    remark,
  }

  return hpayRequest('va', '/service/va/v1/update', payload as unknown as Record<string, unknown>)
}

/**
 * Revoke (deactivate) a VA
 */
export async function revokeVA(vaAccount: string) {
  if (MOCK_ENABLED) return { vaAccount, vaStatus: 3 }

  const payload: HpayVaRevokeRequest = {
    requestId: generateRequestId('VR'),
    merchantId: MID,
    vaAccount,
  }

  return hpayRequest('va', '/service/va/v1/revoke', payload as unknown as Record<string, unknown>)
}
