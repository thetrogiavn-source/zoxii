import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { notifyViaTelegram } from '@/lib/notify'

export async function POST(request: NextRequest) {
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
  const { id, status } = body

  if (!id || !['success', 'failed'].includes(status)) {
    return NextResponse.json({ error: 'Invalid params' }, { status: 400 })
  }

  const adminSupabase = createAdminClient()

  // Get withdrawal details before updating
  const { data: withdrawal } = await adminSupabase
    .from('withdrawals')
    .select('user_id, amount, bank_name, bank_account_number')
    .eq('id', id)
    .single()

  // Update status
  const { error } = await adminSupabase
    .from('withdrawals')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Send notification to seller
  if (withdrawal) {
    const amount = new Intl.NumberFormat('vi-VN').format(Number(withdrawal.amount))

    if (status === 'success') {
      await adminSupabase.from('notifications').insert({
        user_id: withdrawal.user_id,
        title: `Rút tiền thành công: ${amount} VND`,
        title_en: `Withdrawal successful: ${amount} VND`,
        message: `Yêu cầu rút ${amount} VND về ${withdrawal.bank_name} - ${withdrawal.bank_account_number} đã được xử lý thành công. Tiền sẽ về tài khoản trong vài phút.`,
        message_en: `Your withdrawal of ${amount} VND to ${withdrawal.bank_name} - ${withdrawal.bank_account_number} has been processed successfully. Funds will arrive in your account shortly.`,
        type: 'success',
        is_global: false,
        created_by: user.id,
      })
    } else if (status === 'failed') {
      await adminSupabase.from('notifications').insert({
        user_id: withdrawal.user_id,
        title: `Rút tiền thất bại: ${amount} VND`,
        title_en: `Withdrawal failed: ${amount} VND`,
        message: `Yêu cầu rút ${amount} VND về ${withdrawal.bank_name} - ${withdrawal.bank_account_number} đã bị từ chối. Số tiền đã được hoàn lại vào số dư. Vui lòng kiểm tra thông tin ngân hàng và thử lại.`,
        message_en: `Your withdrawal of ${amount} VND to ${withdrawal.bank_name} - ${withdrawal.bank_account_number} has been rejected. The amount has been returned to your balance. Please verify your bank details and try again.`,
        type: 'error',
        is_global: false,
        created_by: user.id,
      })
    }

    // Telegram notification
    if (status === 'success') {
      await notifyViaTelegram(withdrawal.user_id,
        `✅ <b>Rút tiền thành công</b>\n💰 ${amount} VND → ${withdrawal.bank_name} - ${withdrawal.bank_account_number}\nTiền sẽ về tài khoản trong vài phút.`)
    } else {
      await notifyViaTelegram(withdrawal.user_id,
        `❌ <b>Rút tiền thất bại</b>\n💰 ${amount} VND → ${withdrawal.bank_name} - ${withdrawal.bank_account_number}\nSố tiền đã hoàn lại vào số dư.`)
    }
  }

  return NextResponse.json({ success: true })
}
