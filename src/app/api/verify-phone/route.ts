import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendTelegramMessage, getChatIdByUsername } from '@/lib/telegram'

// In-memory OTP store (production: use Redis)
const otpStore = new Map<string, { code: string; expires: number }>()

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { action, code } = await request.json()

  const { data: profile } = await supabase
    .from('profiles')
    .select('telegram_username, telegram_verified, phone')
    .eq('id', user.id)
    .single()

  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  // Send OTP
  if (action === 'send_otp') {
    if (!profile.telegram_verified || !profile.telegram_username) {
      return NextResponse.json({ error: 'telegram_required', message: 'Connect Telegram first' }, { status: 400 })
    }

    const parts = profile.telegram_username.split(':')
    const chatId = parts[1]
    if (!chatId) return NextResponse.json({ error: 'no_chat_id' }, { status: 400 })

    // Generate 6-digit OTP
    const otp = String(Math.floor(100000 + Math.random() * 900000))
    otpStore.set(user.id, { code: otp, expires: Date.now() + 5 * 60 * 1000 }) // 5 min

    const sent = await sendTelegramMessage(chatId,
      `🔐 <b>ZOXI Phone Verification</b>\n\nYour verification code: <code>${otp}</code>\n\nThis code expires in 5 minutes.\nDo not share this code with anyone.`
    )

    if (!sent) return NextResponse.json({ error: 'send_failed' }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  // Verify OTP
  if (action === 'verify_otp') {
    if (!code) return NextResponse.json({ error: 'Missing code' }, { status: 400 })

    const stored = otpStore.get(user.id)
    if (!stored) return NextResponse.json({ error: 'no_otp', message: 'No OTP sent. Please request a new one.' }, { status: 400 })
    if (Date.now() > stored.expires) {
      otpStore.delete(user.id)
      return NextResponse.json({ error: 'expired', message: 'OTP expired. Please request a new one.' }, { status: 400 })
    }
    if (stored.code !== code) {
      return NextResponse.json({ error: 'invalid', message: 'Invalid code. Please try again.' }, { status: 400 })
    }

    // Verified!
    otpStore.delete(user.id)
    await supabase.from('profiles').update({ phone_verified: true }).eq('id', user.id)

    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
