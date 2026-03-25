import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getChatIdByUsername, sendTelegramMessage } from '@/lib/telegram'

/**
 * POST: Verify Telegram username — find chat_id and send test message
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { username } = await request.json()
  if (!username) return NextResponse.json({ error: 'Missing username' }, { status: 400 })

  const clean = username.replace('@', '').trim()

  // Find chat_id from bot updates
  const chatId = await getChatIdByUsername(clean)
  if (!chatId) {
    return NextResponse.json({
      error: 'not_found',
      message: 'Username not found. Please open the bot and send /start first.',
    }, { status: 404 })
  }

  // Send verification message
  const sent = await sendTelegramMessage(
    chatId,
    `✅ <b>ZOXI Connected!</b>\n\nHi @${clean}, your Telegram is now connected to ZOXI.\nYou will receive notifications for:\n• 💰 Payment received (Top-up)\n• 💸 Withdrawal updates\n• 🛡 KYC status changes\n\nManage at: zoxi.vn/dashboard/settings`
  )

  if (!sent) {
    return NextResponse.json({ error: 'send_failed', message: 'Failed to send message' }, { status: 500 })
  }

  // Save chat_id and mark as verified
  await supabase.from('profiles').update({
    telegram_username: clean,
    telegram_verified: true,
  }).eq('id', user.id)

  // Also store chat_id for future messages
  // Using a simple approach: store in telegram_username as "username:chatid"
  await supabase.from('profiles').update({
    telegram_username: `${clean}:${chatId}`,
  }).eq('id', user.id)

  return NextResponse.json({ success: true, chatId })
}
