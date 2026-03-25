const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || ''
const API = `https://api.telegram.org/bot${BOT_TOKEN}`

/**
 * Send message to a Telegram chat
 */
export async function sendTelegramMessage(chatId: string, text: string) {
  if (!BOT_TOKEN || !chatId) return false
  try {
    const res = await fetch(`${API}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
      }),
    })
    return res.ok
  } catch {
    return false
  }
}

/**
 * Get recent updates to find chat_id by username
 */
export async function getChatIdByUsername(username: string): Promise<string | null> {
  if (!BOT_TOKEN) return null
  try {
    const res = await fetch(`${API}/getUpdates?limit=100`)
    const data = await res.json()
    if (!data.ok) return null

    // Find the user who sent /start with matching username
    for (const update of (data.result || []).reverse()) {
      const from = update.message?.from
      if (from?.username?.toLowerCase() === username.toLowerCase()) {
        return String(from.id)
      }
    }
    return null
  } catch {
    return null
  }
}
