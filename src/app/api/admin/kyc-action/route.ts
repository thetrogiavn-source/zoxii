import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { notifyViaTelegram } from '@/lib/notify'

export async function POST(request: NextRequest) {
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

  const body = await request.json()
  const { kycId, userId, action, rejectionReason } = body

  if (!kycId || !userId || !['approved', 'rejected'].includes(action)) {
    return NextResponse.json({ error: 'Invalid params' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Update KYC submission
  const { error: kycError } = await admin
    .from('kyc_submissions')
    .update({
      status: action,
      rejection_reason: action === 'rejected' ? rejectionReason : null,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', kycId)

  if (kycError) return NextResponse.json({ error: kycError.message }, { status: 500 })

  // Update profile KYC status
  const { error: profileError } = await admin
    .from('profiles')
    .update({ kyc_status: action })
    .eq('id', userId)

  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 })

  // Send notification to seller
  if (action === 'approved') {
    await admin.from('notifications').insert({
      user_id: userId,
      title: 'KYC đã được duyệt',
      title_en: 'KYC Approved',
      message: 'Danh tính của bạn đã được xác minh thành công. Bạn có thể tạo tài khoản ảo và bắt đầu nhận thanh toán ngay bây giờ.',
      message_en: 'Your identity has been verified successfully. You can now create virtual accounts and start receiving payments.',
      type: 'success',
      is_global: false,
      created_by: user.id,
    })
  } else if (action === 'rejected') {
    await admin.from('notifications').insert({
      user_id: userId,
      title: 'KYC bị từ chối',
      title_en: 'KYC Rejected',
      message: `Hồ sơ KYC của bạn đã bị từ chối. Lý do: ${rejectionReason || 'Không đạt yêu cầu'}. Vui lòng kiểm tra và gửi lại.`,
      message_en: `Your KYC application has been rejected. Reason: ${rejectionReason || 'Does not meet requirements'}. Please review and resubmit.`,
      type: 'error',
      is_global: false,
      created_by: user.id,
    })
  }

  // Telegram notification
  if (action === 'approved') {
    await notifyViaTelegram(userId, '✅ <b>KYC Approved!</b>\nYour identity has been verified. You can now create virtual accounts and start receiving payments.')
  } else {
    await notifyViaTelegram(userId, `❌ <b>KYC Rejected</b>\nReason: ${rejectionReason || 'Does not meet requirements'}\nPlease review and resubmit.`)
  }

  return NextResponse.json({ success: true })
}
