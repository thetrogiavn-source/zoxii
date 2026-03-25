import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getBankAccountName } from '@/lib/hpay/ibft'

/**
 * POST: Verify bank account holder name
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { bankName, bankAccountNumber } = body

  if (!bankName || !bankAccountNumber) {
    return NextResponse.json({ error: 'bankName and bankAccountNumber required' }, { status: 400 })
  }

  try {
    const result = await getBankAccountName(bankName, bankAccountNumber)
    return NextResponse.json({ data: { bankAccountName: result.bankAccountName } })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Verification failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
