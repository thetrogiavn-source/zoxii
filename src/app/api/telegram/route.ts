import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyCodeFromUsername, sendTelegramMessage, generateVerificationCode } from '@/lib/telegram'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

// In-memory store for pending verification codes: username -> { code, expiresAt }
const pendingCodes = new Map<string, { code: string; expiresAt: number }>()

/**
 * POST: Two-step Telegram verification
 *
 * Step 1 (action: 'generate'): Generate a verification code for the user to send to the bot
 * Step 2 (action: 'verify'): Check that the bot received the code from that username
 */
export async function POST(request: NextRequest) {
  // Rate limit: 5 attempts per 10 minutes per IP
  const ip = getClientIp(request.headers)
  const { success: rateLimitOk } = rateLimit(`telegram:${ip}`, 5, 10 * 60 * 1000)
  if (!rateLimitOk) {
    return NextResponse.json(
      { error: 'Too many attempts. Please try again in 10 minutes.' },
      { status: 429, headers: { 'X-RateLimit-Remaining': '0' } }
    )
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { username, action } = await request.json()
  if (!username) return NextResponse.json({ error: 'Missing username' }, { status: 400 })

  const clean = username.replace('@', '').trim()
  if (!clean || clean.length < 2) {
    return NextResponse.json({ error: 'Invalid username' }, { status: 400 })
  }

  // Step 1: Generate code
  if (action === 'generate' || !action) {
    const code = generateVerificationCode()
    pendingCodes.set(clean.toLowerCase(), {
      code,
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
    })

    return NextResponse.json({
      success: true,
      code,
      message: `Send the code "${code}" to @ZOXI999BOT on Telegram, then click Verify.`,
    })
  }

  // Step 2: Verify code
  if (action === 'verify') {
    const pending = pendingCodes.get(clean.toLowerCase())
    if (!pending) {
      return NextResponse.json({
        error: 'no_code',
        message: 'No verification code found. Please generate a code first.',
      }, { status: 400 })
    }

    if (Date.now() > pending.expiresAt) {
      pendingCodes.delete(clean.toLowerCase())
      return NextResponse.json({
        error: 'code_expired',
        message: 'Verification code expired. Please generate a new one.',
      }, { status: 400 })
    }

    // Check bot updates for the code from this username
    const chatId = await verifyCodeFromUsername(clean, pending.code)
    if (!chatId) {
      return NextResponse.json({
        error: 'not_verified',
        message: `Code not found. Please send "${pending.code}" to @ZOXI999BOT on Telegram and try again.`,
      }, { status: 404 })
    }

    // Verified! Clean up pending code
    pendingCodes.delete(clean.toLowerCase())

    // Send confirmation message
    await sendTelegramMessage(
      chatId,
      `✅ <b>ZOXI Connected!</b>\n\nHi @${clean}, your Telegram is now connected to ZOXI.\nYou will receive notifications for:\n• 💰 Payment received (Top-up)\n• 💸 Withdrawal updates\n• 🛡 KYC status changes\n\nManage at: zoxi.vn/dashboard/settings`
    )

    // Save chat_id and mark as verified
    await supabase.from('profiles').update({
      telegram_username: `${clean}:${chatId}`,
      telegram_verified: true,
    }).eq('id', user.id)

    return NextResponse.json({ success: true, chatId })
  }

  return NextResponse.json({ error: 'Invalid action. Use "generate" or "verify".' }, { status: 400 })
}
