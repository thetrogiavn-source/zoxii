import type { HpayScope, HpayTokenResponse } from './types'

const BASE_URL = process.env.HPAY_BASE_URL!
const CLIENT_ID = process.env.HPAY_CLIENT_ID!
const CLIENT_SECRET = process.env.HPAY_CLIENT_SECRET!

// In-memory token cache
const tokenCache = new Map<
  HpayScope,
  { token: string; expiresAt: number }
>()

/**
 * Get OAuth2 access token for a specific scope.
 * Caches tokens and auto-refreshes when expired.
 */
export async function getToken(scope: HpayScope): Promise<string> {
  const cached = tokenCache.get(scope)
  if (cached && Date.now() < cached.expiresAt) {
    return cached.token
  }

  const url = `${BASE_URL}/service/${scope}/v1/oauth2/token`

  const body = new URLSearchParams({
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    grant_type: 'client_credentials',
    scope,
  })

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })

  if (!response.ok) {
    throw new Error(`Hpay auth failed for scope ${scope}: ${response.status}`)
  }

  const data: HpayTokenResponse = await response.json()

  // Cache with 60s buffer before actual expiry
  tokenCache.set(scope, {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  })

  return data.access_token
}
