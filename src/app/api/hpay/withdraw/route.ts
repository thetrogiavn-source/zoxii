import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { transfer } from '@/lib/hpay/ibft'
import { generateRequestId } from '@/lib/hpay/client'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

/**
 * POST: Initiate a withdrawal to bank account
 */
export async function POST(request: NextRequest) {
  const ip = getClientIp(request.headers)
  const { success, remaining } = rateLimit(`withdraw:${ip}`, 5, 60_000)
  if (!success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: { 'X-RateLimit-Remaining': '0' } }
    )
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Per-user rate limit: 3 withdrawals per 5 minutes (prevents VPN bypass of IP-based limiting)
  const { success: userRateOk } = rateLimit(`withdraw:user:${user.id}`, 3, 300_000)
  if (!userRateOk) {
    return NextResponse.json(
      { error: 'Too many withdrawal requests. Please try again later.' },
      { status: 429, headers: { 'X-RateLimit-Remaining': '0' } }
    )
  }

  const body = await request.json()
  const { amount, bankName, bankAccountNumber, bankAccountName, note } = body

  if (!amount || !bankName || !bankAccountNumber || !bankAccountName) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Input validation
  const numAmount = Number(amount)
  if (!Number.isFinite(numAmount) || numAmount <= 0) {
    return NextResponse.json({ error: 'Amount must be a positive number' }, { status: 400 })
  }
  if (numAmount < 10_000) {
    return NextResponse.json({ error: 'Minimum withdrawal amount is 10,000 VND' }, { status: 400 })
  }
  if (numAmount > 500_000_000) {
    return NextResponse.json({ error: 'Maximum withdrawal amount is 500,000,000 VND' }, { status: 400 })
  }
  if (typeof bankAccountNumber !== 'string' || !/^\d+$/.test(bankAccountNumber)) {
    return NextResponse.json({ error: 'Bank account number must be a numeric string' }, { status: 400 })
  }
  if (typeof bankName !== 'string' || bankName.trim().length === 0) {
    return NextResponse.json({ error: 'Bank name is required' }, { status: 400 })
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
