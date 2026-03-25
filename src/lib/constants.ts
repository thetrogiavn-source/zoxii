export const APP_NAME = 'ZOXI'
export const APP_DESCRIPTION = 'Nền tảng nhận thanh toán cho seller Việt Nam bán hàng xuyên biên giới'

export const VIETNAMESE_BANKS = [
  { code: 'VCB', name: 'Vietcombank' },
  { code: 'TCB', name: 'Techcombank' },
  { code: 'ACB', name: 'ACB' },
  { code: 'MBB', name: 'MB Bank' },
  { code: 'VPB', name: 'VPBank' },
  { code: 'TPB', name: 'TPBank' },
  { code: 'STB', name: 'Sacombank' },
  { code: 'HDB', name: 'HDBank' },
  { code: 'VIB', name: 'VIB' },
  { code: 'SHB', name: 'SHB' },
  { code: 'MSB', name: 'MSB' },
  { code: 'OCB', name: 'OCB' },
  { code: 'EIB', name: 'Eximbank' },
  { code: 'BIDV', name: 'BIDV' },
  { code: 'CTG', name: 'VietinBank' },
  { code: 'AGR', name: 'Agribank' },
  { code: 'SCB', name: 'SCB' },
  { code: 'NAB', name: 'Nam A Bank' },
  { code: 'BAB', name: 'Bac A Bank' },
  { code: 'LPB', name: 'LienVietPostBank' },
] as const

export const KYC_STATUS_LABELS: Record<string, string> = {
  none: 'Chưa xác minh',
  pending: 'Đang chờ duyệt',
  approved: 'Đã xác minh',
  rejected: 'Bị từ chối',
}

export const WITHDRAWAL_STATUS_LABELS: Record<string, string> = {
  processing: 'Đang xử lý',
  success: 'Thành công',
  failed: 'Thất bại',
}
