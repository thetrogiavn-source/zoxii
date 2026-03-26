import { NextRequest, NextResponse } from 'next/server'
import { verifyWebhookSecureCode } from '@/lib/hpay/crypto'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Hpay Callback IPN (GET method)
 * Called by Hpay when funds arrive in a VA
 * Must ALWAYS return HTTP 200 with { error: "00", message: "Success" }
 * Hpay retries up to 3 times if not HTTP 200
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams

  const va_account = params.get('va_account') || ''
  const amount = params.get('amount') || ''
  const cashin_id = params.get('cashin_id') || ''
  const transaction_id = params.get('transaction_id') || ''
  const client_request_id = params.get('client_request_id') || ''
  const merchant_id = params.get('merchant_id') || ''
  const secure_code = params.get('secure_code') || ''
  const transfer_content = params.get('transfer_content') || ''
  const mc_fee = params.get('mc_fee') || ''
  const time_paid = params.get('time_paid') || ''
  const order_id = params.get('order_id') || ''

  console.log('Callback received:', { va_account, amount, transaction_id, cashin_id, merchant_id })

  // Verify secure code
  const isValid = verifyWebhookSecureCode({
    va_account,
    amount,
    cashin_id,
    transaction_id,
    client_request_id,
    merchant_id,
    secure_code,
  })

  if (!isValid) {
    console.error('Callback: secure_code verification failed', { va_account, transaction_id, secure_code })
    // Still return 200 so Hpay doesn't retry endlessly
    return NextResponse.json({ error: '01', message: 'Invalid secure code' })
  }

  const supabase = createAdminClient()

  // Find the VA and its owner
  const { data: va } = await supabase
    .from('virtual_accounts')
    .select('user_id')
    .eq('va_account', va_account)
    .single()

  if (!va) {
    console.error('Callback: VA not found', { va_account })
    return NextResponse.json({ error: '00', message: 'Success' })
  }

  // Get seller's tier to determine fee percentage
  const { data: sellerProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', va.user_id)
    .single()

  // Auto-charge after trial expires
  const PRO_MONTHLY_AUTO_CHARGE = 75 * 25000
  if (
    sellerProfile?.subscription_status === 'trial' &&
    sellerProfile?.subscription_end &&
    new Date(sellerProfile.subscription_end) < new Date()
  ) {
    const subEnd = new Date()
    subEnd.setDate(subEnd.getDate() + 30)
    await supabase.from('profiles').update({
      subscription_status: 'active',
      subscription_amount_due: (sellerProfile.subscription_amount_due ?? 0) + PRO_MONTHLY_AUTO_CHARGE,
      subscription_start: new Date().toISOString(),
      subscription_end: subEnd.toISOString(),
    }).eq('id', va.user_id)
    sellerProfile.subscription_amount_due = (sellerProfile.subscription_amount_due ?? 0) + PRO_MONTHLY_AUTO_CHARGE
  }

  const TIER_FEE: Record<string, number> = {
    FREE: 2.5,
    PRO: 1.5,
    ENTERPRISE: 1.0,
  }
  const sellerTier = sellerProfile?.tier || 'FREE'
  const feePercent = TIER_FEE[sellerTier] ?? parseFloat(process.env.ZOXI_FEE_PERCENT || '2.5')

  // Calculate fees
  const amountNum = parseFloat(amount)
  const zoxiFee = Math.round(amountNum * feePercent / 100)
  const hpayFee = parseFloat(mc_fee) || 0
  let netAmount = amountNum - zoxiFee

  // Deduct subscription_amount_due if any
  const amountDue = sellerProfile?.subscription_amount_due ?? 0
  if (amountDue > 0) {
    const deduction = Math.min(amountDue, netAmount * 0.5)
    await supabase.from('profiles').update({
      subscription_amount_due: amountDue - deduction
    }).eq('id', va.user_id)
    netAmount -= deduction
  }

  // Parse time_paid safely
  let timePaidISO: string
  try {
    const ts = parseInt(time_paid)
    timePaidISO = ts > 0 ? new Date(ts * 1000).toISOString() : new Date().toISOString()
  } catch {
    timePaidISO = new Date().toISOString()
  }

  // Decode transfer_content from base64
  let decodedContent: string | null = null
  if (transfer_content) {
    try {
      decodedContent = Buffer.from(transfer_content, 'base64').toString('utf-8')
    } catch {
      decodedContent = transfer_content
    }
  }

  // Upsert transaction (idempotent — handles Hpay retries up to 3 times)
  const { error } = await supabase
    .from('transactions')
    .upsert(
      {
        va_account,
        user_id: va.user_id,
        amount: amountNum,
        fee: zoxiFee,
        hpay_fee: hpayFee,
        net_amount: netAmount,
        hpay_transaction_id: transaction_id,
        hpay_cashin_id: cashin_id,
        hpay_order_id: order_id,
        transfer_content: decodedContent,
        time_paid: timePaidISO,
        status: 'completed',
      },
      { onConflict: 'hpay_transaction_id' }
    )

  if (error) {
    console.error('Callback: Failed to save transaction', error)
    // Still return 200 — we logged the error, Hpay will retry
    return NextResponse.json({ error: '00', message: 'Success' })
  }

  console.log('Callback: Transaction saved', { va_account, amount, transaction_id })

  // Notifications handled by DB trigger (on_transaction_notify)
  return NextResponse.json({ error: '00', message: 'Success' })
}
