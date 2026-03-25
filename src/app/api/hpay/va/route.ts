import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createVA } from '@/lib/hpay/va'
import { generateRequestId } from '@/lib/hpay/client'

/**
 * GET: List seller's virtual accounts
 */
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('virtual_accounts')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}

/**
 * POST: Create a new virtual account
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check KYC status
  const { data: profile } = await supabase
    .from('profiles')
    .select('kyc_status')
    .eq('id', user.id)
    .single()

  if (!profile || profile.kyc_status !== 'approved') {
    return NextResponse.json({ error: 'KYC not approved' }, { status: 403 })
  }

  const body = await request.json()
  const { vaName, platform } = body

  if (!vaName || typeof vaName !== 'string' || vaName.trim().length === 0) {
    return NextResponse.json({ error: 'vaName is required' }, { status: 400 })
  }

  // Validate vaName doesn't contain prohibited keywords
  const upper = vaName.toUpperCase()
  if (upper.includes('HPAY') || upper.includes('HTP')) {
    return NextResponse.json({ error: 'VA name cannot contain HPAY or HTP' }, { status: 400 })
  }

  try {
    const result = await createVA(vaName.trim())
    const requestId = generateRequestId('VA')

    // Save to database
    const { data, error } = await supabase
      .from('virtual_accounts')
      .insert({
        user_id: user.id,
        va_account: result.vaAccount,
        va_name: result.vaName,
        va_bank: result.vaBank,
        va_type: result.vaType,
        va_status: result.vaStatus,
        platform: platform || 'etsy',
        qr_code: result.qrCode,
        quick_link: result.quickLink,
        hpay_request_id: requestId,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create VA'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
