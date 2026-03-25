import { NextRequest, NextResponse } from 'next/server'
import { verifyWebhookSecureCode } from '@/lib/hpay/crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import { MOCK_ENABLED } from '@/lib/hpay/mock'

/**
 * Hpay Webhook Handler (GET method)
 * Called by Hpay when funds arrive in a VA
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
  const va_account_name = params.get('va_account_name') || ''
  const va_bank_name = params.get('va_bank_name') || ''
  const transfer_content = params.get('transfer_content') || ''
  const mc_fee = params.get('mc_fee') || ''
  const time_paid = params.get('time_paid') || ''
  const order_id = params.get('order_id') || ''

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

  if (!isValid && !MOCK_ENABLED) {
    console.error('Webhook secure_code verification failed', { va_account, transaction_id })
    return NextResponse.json({ error: '01', message: 'Invalid secure code' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Find the VA and its owner
  const { data: va } = await supabase
    .from('virtual_accounts')
    .select('user_id')
    .eq('va_account', va_account)
    .single()

  if (!va) {
    console.error('Webhook: VA not found', { va_account })
    return NextResponse.json({ error: '02', message: 'VA not found' }, { status: 404 })
  }

  // Get seller's tier to determine fee percentage
  const { data: sellerProfile } = await supabase
    .from('profiles')
    .select('tier, subscription_amount_due, subscription_status, subscription_end')
    .eq('id', va.user_id)
    .single()

  // Auto-charge after trial expires: if trial has ended and user hasn't downgraded,
  // upgrade to active subscription and set subscription_amount_due
  // Default to monthly rate ($75/month = 1,875,000 VND) for auto-charge
  const PRO_MONTHLY_AUTO_CHARGE = 75 * 25000 // 1,875,000 VND
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
    // Re-fetch to get updated amount_due for fee deduction below
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

  // If seller has subscription_amount_due > 0, deduct from this transaction
  const amountDue = sellerProfile?.subscription_amount_due ?? 0
  if (amountDue > 0) {
    const deduction = Math.min(amountDue, netAmount * 0.5) // max 50% of net
    // Update subscription_amount_due
    await supabase.from('profiles').update({
      subscription_amount_due: amountDue - deduction
    }).eq('id', va.user_id)
    // Reduce net amount
    netAmount -= deduction
  }

  // Upsert transaction (idempotent — handles Hpay retries)
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
        transfer_content: transfer_content
          ? Buffer.from(transfer_content, 'base64').toString('utf-8')
          : null,
        time_paid: new Date(parseInt(time_paid) * 1000).toISOString(),
        status: 'completed',
      },
      { onConflict: 'hpay_transaction_id' }
    )

  if (error) {
    console.error('Webhook: Failed to save transaction', error)
    return NextResponse.json({ error: '99', message: 'Internal error' }, { status: 500 })
  }

  // Notifications are handled by DB trigger (on_transaction_notify)
  // No duplicate notification code needed here

  // Required response format for Hpay
  return NextResponse.json({ error: '00', message: 'Success' })
}
