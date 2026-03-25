import { getToken } from './auth'
import { encodePayload, signRequest, decodePayload, verifyResponse } from './crypto'
import type { HpayScope, HpayApiResponse } from './types'

const BASE_URL = process.env.HPAY_BASE_URL!
const MID = process.env.HPAY_MID!

export class HpayApiError extends Error {
  constructor(
    public errorCode: string,
    message: string
  ) {
    super(message)
    this.name = 'HpayApiError'
  }
}

/**
 * Make an authenticated, signed API call to Hpay
 */
export async function hpayRequest<TReq extends Record<string, unknown>, TRes>(
  scope: HpayScope,
  endpoint: string,
  payload: TReq
): Promise<TRes> {
  const token = await getToken(scope)

  // Encode and sign
  const base64Data = encodePayload(payload)
  const signature = signRequest(base64Data)

  const url = `${BASE_URL}${endpoint}`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'x-api-mid': MID,
    },
    body: JSON.stringify({ data: base64Data, signature }),
  })

  const result: HpayApiResponse = await response.json()

  // Check error
  if (result.errorCode !== '00') {
    throw new HpayApiError(result.errorCode, result.errorMessage)
  }

  // Verify response signature
  if (result.signature && result.data) {
    const valid = verifyResponse(result.errorCode, result.data, result.signature)
    if (!valid) {
      throw new Error('Hpay response signature verification failed')
    }
  }

  // Decode response data
  return decodePayload<TRes>(result.data)
}

/**
 * Generate a unique request ID (max 20 chars for VA, 99 for others)
 */
export function generateRequestId(prefix: string = 'ZX'): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 6)
  return `${prefix}${timestamp}${random}`.substring(0, 20)
}
