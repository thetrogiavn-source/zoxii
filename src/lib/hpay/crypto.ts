import crypto from 'crypto'
import fs from 'fs'
import path from 'path'

const PASSCODE = process.env.HPAY_PASSCODE!

function loadKey(envVar: string, filename: string): string {
  // Try env var first (supports \n escaped newlines)
  const envValue = process.env[envVar]
  if (envValue && envValue.includes('BEGIN')) {
    return envValue.replace(/\\n/g, '\n')
  }
  // Fallback: read from file in project root
  const filePath = path.join(process.cwd(), filename)
  return fs.readFileSync(filePath, 'utf-8')
}

/**
 * Sign data for Hpay API request
 * Cleartext format: data|passcode
 */
export function signRequest(base64Data: string): string {
  const privateKey = loadKey('HPAY_PRIVATE_KEY', 'hpay-private.pem')
  const cleartext = `${base64Data}|${PASSCODE}`

  const sign = crypto.createSign('SHA256')
  sign.update(cleartext)
  sign.end()

  return sign.sign(privateKey, 'base64')
}

/**
 * Verify Hpay API response signature
 * Cleartext format: errorCode|data|passcode
 */
export function verifyResponse(
  errorCode: string,
  base64Data: string,
  signature: string
): boolean {
  const publicKey = loadKey('HPAY_PUBLIC_KEY', 'hpay-public.pem')
  const cleartext = `${errorCode}|${base64Data}|${PASSCODE}`

  const verify = crypto.createVerify('SHA256')
  verify.update(cleartext)
  verify.end()

  return verify.verify(publicKey, signature, 'base64')
}

/**
 * Verify webhook secure_code (MD5)
 * Format: MD5(va_account|amount|cashin_id|transaction_id|passcode|client_request_id|merchant_id)
 */
export function verifyWebhookSecureCode(params: {
  va_account: string
  amount: string
  cashin_id: string
  transaction_id: string
  client_request_id: string
  merchant_id: string
  secure_code: string
}): boolean {
  const cleartext = [
    params.va_account,
    params.amount,
    params.cashin_id,
    params.transaction_id,
    PASSCODE,
    params.client_request_id,
    params.merchant_id,
  ].join('|')

  const computed = crypto.createHash('md5').update(cleartext).digest('hex')
  try {
    return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(params.secure_code))
  } catch {
    return false
  }
}

/**
 * Encode JSON payload to base64
 */
export function encodePayload(payload: Record<string, unknown>): string {
  return Buffer.from(JSON.stringify(payload)).toString('base64')
}

/**
 * Decode base64 response data to JSON
 */
export function decodePayload<T>(base64Data: string): T {
  const json = Buffer.from(base64Data, 'base64').toString('utf-8')
  return JSON.parse(json) as T
}
