import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Get notifications: global OR for this user
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .or(`is_global.eq.true,user_id.eq.${user.id}`)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { id, action } = body

  if (action === 'read_all') {
    return NextResponse.json({ success: true })
  }

  if (id && action === 'read') {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id)
    return NextResponse.json({ success: true })
  }

  if (action === 'delete_all') {
    // Delete personal notifications
    await supabase.from('notifications').delete().eq('user_id', user.id)
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
