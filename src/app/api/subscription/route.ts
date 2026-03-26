import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

const PRO_MONTHLY_VND = 75 * 25000 // $75 * 25,000 = 1,875,000 VND
const PRO_ANNUAL_VND = 49 * 25000 * 12 // $49 * 12 * 25,000 = 14,700,000 VND

async function logHistory(adminDb: ReturnType<typeof createAdminClient>, entry: {
  user_id: string
  action: string
  billing?: string
  amount?: number
  amount_due_before?: number
  amount_due_after?: number
  tier_before?: string
  tier_after?: string
  note?: string
}) {
  await adminDb.from('subscription_history').insert(entry).single()
}

export async function GET(request: NextRequest) {
  const ip = getClientIp(request.headers)
  const { success } = rateLimit(`subscription:${ip}`, 10, 60_000)
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

  const adminDb = createAdminClient()
  const { data, error } = await adminDb
    .from('subscription_history')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    // Table might not exist yet (migration 015 not run)
    return NextResponse.json({ data: [] })
  }

  return NextResponse.json({ data: data || [] })
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request.headers)
  const { success } = rateLimit(`subscription:${ip}`, 10, 60_000)
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

  const body = await request.json()
  const { action, billing } = body as { action: string; billing?: 'monthly' | 'annual' }

  // Validate action
  const allowedActions: string[] = ['start_trial', 'upgrade_pro', 'downgrade_free']
  if (!action || !allowedActions.includes(action)) {
    return NextResponse.json(
      { error: `Invalid action. Must be one of: ${allowedActions.join(', ')}` },
      { status: 400 }
    )
  }

  // Validate billing if provided
  if (billing !== undefined && billing !== 'monthly' && billing !== 'annual') {
    return NextResponse.json(
      { error: 'Invalid billing. Must be "monthly" or "annual".' },
      { status: 400 }
    )
  }

  const adminDb = createAdminClient()

  const { data: profile, error: profileError } = await adminDb
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    console.error('Subscription: Profile not found', { userId: user.id, error: profileError })
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  const tier = profile.tier || 'FREE'
  const trialUsed = profile.trial_used ?? false
  const currentAmountDue = profile.subscription_amount_due ?? 0

  const now = new Date().toISOString()
  const billingCycle = billing || 'monthly'

  if (action === 'start_trial') {
    if (trialUsed) {
      return NextResponse.json({ error: 'Trial already used' }, { status: 400 })
    }
    if (tier === 'PRO' || tier === 'ENTERPRISE') {
      return NextResponse.json({ error: 'Already on a paid plan' }, { status: 400 })
    }

    const trialEnd = new Date()
    trialEnd.setDate(trialEnd.getDate() + 7)

    const { error } = await adminDb
      .from('profiles')
      .update({
        tier: 'PRO',
        subscription_status: 'trial',
        subscription_start: now,
        subscription_end: trialEnd.toISOString(),
        trial_used: true,
      })
      .eq('id', user.id)

    if (error) {
      console.error('Subscription: Failed to start trial', error)
      return NextResponse.json({ error: 'Failed to start trial' }, { status: 500 })
    }

    await logHistory(adminDb, {
      user_id: user.id,
      action: 'trial_start',
      amount: 0,
      amount_due_before: currentAmountDue,
      amount_due_after: currentAmountDue,
      tier_before: tier,
      tier_after: 'PRO',
      note: '7-day free trial',
    })

    return NextResponse.json({ success: true, message: 'Trial started', tier: 'PRO', subscription_end: trialEnd.toISOString() })
  }

  if (action === 'upgrade_pro') {
    const subEnd = new Date()
    const priceVND = billingCycle === 'annual' ? PRO_ANNUAL_VND : PRO_MONTHLY_VND

    if (billingCycle === 'annual') {
      subEnd.setFullYear(subEnd.getFullYear() + 1)
    } else {
      subEnd.setDate(subEnd.getDate() + 30)
    }

    const newAmountDue = currentAmountDue + priceVND

    const { error } = await adminDb
      .from('profiles')
      .update({
        tier: 'PRO',
        subscription_status: 'active',
        subscription_amount_due: newAmountDue,
        subscription_start: now,
        subscription_end: subEnd.toISOString(),
      })
      .eq('id', user.id)

    if (error) {
      console.error('Subscription: Failed to upgrade', error)
      return NextResponse.json({ error: 'Failed to upgrade' }, { status: 500 })
    }

    await logHistory(adminDb, {
      user_id: user.id,
      action: 'upgrade',
      billing: billingCycle,
      amount: priceVND,
      amount_due_before: currentAmountDue,
      amount_due_after: newAmountDue,
      tier_before: tier,
      tier_after: 'PRO',
      note: billingCycle === 'annual'
        ? `Pro Annual - $${49 * 12}/year`
        : `Pro Monthly - $75/month`,
    })

    return NextResponse.json({
      success: true,
      message: billingCycle === 'annual' ? 'Upgraded to Pro (Annual)' : 'Upgraded to Pro (Monthly)',
      tier: 'PRO',
      subscription_end: subEnd.toISOString(),
    })
  }

  if (action === 'downgrade_free') {
    const { error } = await adminDb
      .from('profiles')
      .update({
        tier: 'FREE',
        subscription_status: 'cancelled',
      })
      .eq('id', user.id)

    if (error) {
      return NextResponse.json({ error: 'Failed to downgrade' }, { status: 500 })
    }

    await logHistory(adminDb, {
      user_id: user.id,
      action: 'downgrade',
      amount: 0,
      amount_due_before: currentAmountDue,
      amount_due_after: currentAmountDue,
      tier_before: tier,
      tier_after: 'FREE',
      note: 'Downgrade to Free',
    })

    return NextResponse.json({ success: true, message: 'Downgraded to Free', tier: 'FREE' })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
