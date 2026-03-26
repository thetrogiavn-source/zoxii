import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

export async function GET(request: NextRequest) {
  // Rate limit: 20 requests per minute per IP
  const ip = getClientIp(request.headers)
  const { success: rateLimitOk } = rateLimit(`admin-kyc-image:${ip}`, 20, 60_000)
  if (!rateLimitOk) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: { 'X-RateLimit-Remaining': '0' } }
    )
  }

  // Verify admin
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 })
  }

  const path = request.nextUrl.searchParams.get('path')
  if (!path || path.trim().length === 0) {
    return NextResponse.json({ error: 'Missing path' }, { status: 400 })
  }

  // Validate path: prevent path traversal and ensure expected format
  if (path.includes('..') || path.includes('\\')) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 })
  }

  // Path must match expected KYC file pattern: user_id/filename
  if (!/^[a-zA-Z0-9_\-]+\/[a-zA-Z0-9_\-]+\.[a-zA-Z0-9]+$/.test(path)) {
    return NextResponse.json({ error: 'Invalid path format' }, { status: 400 })
  }

  // Create signed URL (valid 1 hour)
  const admin = createAdminClient()
  const { data, error } = await admin.storage
    .from('kyc')
    .createSignedUrl(path, 3600)

  if (error || !data?.signedUrl) {
    return NextResponse.json({ error: error?.message || 'Failed to create URL' }, { status: 500 })
  }

  return NextResponse.json({ url: data.signedUrl })
}
