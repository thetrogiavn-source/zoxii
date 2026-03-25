import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getBalance } from '@/lib/hpay/account'

/**
 * GET: Get merchant balance from Hpay
 */
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await getBalance()
    return NextResponse.json({ data: { balance: result.balance } })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to get balance'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
