import { createClient } from '@supabase/supabase-js'
import { sendTelegramMessage } from './telegram'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

/**
 * Send notification to user via Telegram (if connected)
 * Call this from API routes after creating DB notification
 */
export async function notifyViaTelegram(userId: string, message: string) {
  if (!supabaseUrl || !supabaseServiceKey) return

  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  const { data: profile } = await supabase
    .from('profiles')
    .select('telegram_username, telegram_verified')
    .eq('id', userId)
    .single()

  if (!profile?.telegram_verified || !profile?.telegram_username) return

  // telegram_username stored as "username:chatId"
  const parts = profile.telegram_username.split(':')
  const chatId = parts[1]
  if (!chatId) return

  await sendTelegramMessage(chatId, message)
}
