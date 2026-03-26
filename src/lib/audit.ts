import { createAdminClient } from '@/lib/supabase/admin'

export async function auditLog(entry: {
  admin_id: string
  action: string
  target_type: string // 'kyc' | 'withdrawal' | 'va' | 'user'
  target_id: string
  details?: string
}) {
  const supabase = createAdminClient()
  await supabase.from('audit_logs').insert({
    ...entry,
    created_at: new Date().toISOString(),
  })
}
