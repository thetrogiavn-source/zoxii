import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { auditLog } from '@/lib/audit'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  // Rate limit: 20 requests per minute per IP
  const ip = getClientIp(request.headers)
  const { success: rateLimitOk } = rateLimit(`admin-va-status:${ip}`, 20, 60_000)
  if (!rateLimitOk) {
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

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 })
  }

  const body = await request.json()
  const { id, va_status } = body

  if (!id || (va_status !== 0 && va_status !== 1)) {
    return NextResponse.json({ error: 'Invalid params' }, { status: 400 })
  }

  const adminSupabase = createAdminClient()
  const { error } = await adminSupabase
    .from('virtual_accounts')
    .update({ va_status, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Audit log
  await auditLog({
    admin_id: user.id,
    action: va_status === 1 ? 'va_activate' : 'va_deactivate',
    target_type: 'va',
    target_id: id,
  })

  return NextResponse.json({ success: true })
}
