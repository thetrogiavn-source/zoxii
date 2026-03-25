import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
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
