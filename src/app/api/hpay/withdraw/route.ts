import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { transfer } from '@/lib/hpay/ibft'
import { generateRequestId } from '@/lib/hpay/client'

/**
 * POST: Initiate a withdrawal to bank account
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { amount, bankName, bankAccountNumber, bankAccountName, note } = body

  if (!amount || !bankName || !bankAccountNumber || !bankAccountName) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const requestId = generateRequestId('WD')

  try {
    const result = await transfer({
      bankName,
      bankAccountNumber,
      bankAccountName,
      amount: String(amount),
      note: note || `ZOXI withdrawal`,
    })

    // Save withdrawal record
    const { data, error } = await supabase
      .from('withdrawals')
      .insert({
        user_id: user.id,
        amount: parseFloat(String(amount)),
        bank_name: bankName,
        bank_account_number: bankAccountNumber,
        bank_account_name: bankAccountName,
        note,
        hpay_request_id: requestId,
        hpay_transaction_id: result.transactionId,
        hpay_cashout_id: result.cashoutId,
        status: 'processing',
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Transfer failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
