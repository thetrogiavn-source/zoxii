import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  // Auth check - only allow authenticated users
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Rate limit: 30 requests per minute per user
  const { success } = rateLimit(`translate:${user.id}`, 30, 60_000)
  if (!success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 }
    )
  }

  const { text, from = 'vi', to = 'en' } = await request.json()

  if (!text) return NextResponse.json({ error: 'Missing text' }, { status: 400 })

  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encodeURIComponent(text)}`
    const res = await fetch(url)
    const data = await res.json()

    // Google returns [[["translated text","original text",null,null,10]],null,"vi"]
    const translated = data?.[0]?.map((item: string[]) => item[0]).join('') || text

    return NextResponse.json({ translated })
  } catch {
    return NextResponse.json({ translated: text })
  }
}
