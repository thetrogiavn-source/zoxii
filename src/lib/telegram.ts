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

/**
 * Check bot updates for a verification code sent by a specific username.
 * Returns the chat_id if found, null otherwise.
 */
export async function verifyCodeFromUsername(
  username: string,
  code: string
): Promise<string | null> {
  if (!BOT_TOKEN) return null
  try {
    const res = await fetch(`${API}/getUpdates?limit=100`)
    const data = await res.json()
    if (!data.ok) return null

    // Search recent messages for one matching both the username and the code
    for (const update of (data.result || []).reverse()) {
      const msg = update.message
      if (!msg) continue
      const from = msg.from
      const text = (msg.text || '').trim()
      if (
        from?.username?.toLowerCase() === username.toLowerCase() &&
        text.toUpperCase() === code.toUpperCase()
      ) {
        return String(from.id)
      }
    }
    return null
  } catch {
    return null
  }
}

/**
 * Generate a random verification code like "ZOXI-123456"
 */
export function generateVerificationCode(): string {
  const num = Math.floor(100000 + Math.random() * 900000)
  return `ZOXI-${num}`
}
