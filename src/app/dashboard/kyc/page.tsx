'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { KYC_STATUS_LABELS } from '@/lib/constants'
import { Upload, X, AlertTriangle, CheckCircle, Clock } from 'lucide-react'
import { useI18n } from '@/lib/i18n'

const KYC_STYLES: Record<string, { bg: string; text: string; Icon: typeof CheckCircle }> = {
  approved: { bg: '#e7f5ec', text: '#60bc7f', Icon: CheckCircle },
  pending: { bg: '#fef2d4', text: '#e4a508', Icon: Clock },
  rejected: { bg: '#fde8ea', text: '#e91925', Icon: AlertTriangle },
  none: { bg: '#f3f4f6', text: '#9ca3af', Icon: AlertTriangle },
}

export default function KycPage() {
  const { t } = useI18n()
  const [kycStatus, setKycStatus] = useState<string>('none')
  const [rejectionReason, setRejectionReason] = useState<string | null>(null)
  const [fullName, setFullName] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [idType, setIdType] = useState('cccd')
  const [idNumber, setIdNumber] = useState('')

  const [frontFile, setFrontFile] = useState<File | null>(null)
  const [backFile, setBackFile] = useState<File | null>(null)
  const [selfieFile, setSelfieFile] = useState<File | null>(null)
  const [frontPreview, setFrontPreview] = useState<string | null>(null)
  const [backPreview, setBackPreview] = useState<string | null>(null)
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const frontRef = useRef<HTMLInputElement>(null)
  const backRef = useRef<HTMLInputElement>(null)
  const selfieRef = useRef<HTMLInputElement>(null)

  const ID_TYPES = [
    { value: 'cccd', label: t('kyc_id_cccd') },
    { value: 'passport', label: t('kyc_id_passport') },
    { value: 'driver_license', label: t('kyc_id_driver') },
  ]

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from('profiles')
      .select('kyc_status, full_name')
      .eq('id', user.id)
      .single()

    if (profile) {
      setKycStatus(profile.kyc_status)
      setFullName(profile.full_name || '')
    }

    if (profile?.kyc_status === 'rejected') {
      const { data: kyc } = await supabase
        .from('kyc_submissions')
        .select('rejection_reason')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      if (kyc) setRejectionReason(kyc.rejection_reason)
    }
  }

  function handleFileSelect(file: File | null, setter: (f: File | null) => void, previewSetter: (p: string | null) => void) {
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
      setError(t('kyc_photo_too_large'))
      return
    }
    setter(file)
    const url = URL.createObjectURL(file)
    previewSetter(url)
  }

  function clearFile(setter: (f: File | null) => void, previewSetter: (p: string | null) => void) {
    setter(null)
    previewSetter(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!frontFile || !backFile || !selfieFile) {
      setError(t('kyc_upload_3_photos'))
      return
    }
    if (!dateOfBirth) {
      setError(t('kyc_enter_dob'))
      return
    }
    if (!idNumber) {
      setError(t('kyc_enter_id_number'))
      return
    }

    setError('')
    setLoading(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const uploads = await Promise.all([
      supabase.storage.from('kyc').upload(`${user.id}/front-${Date.now()}`, frontFile),
      supabase.storage.from('kyc').upload(`${user.id}/back-${Date.now()}`, backFile),
      supabase.storage.from('kyc').upload(`${user.id}/selfie-${Date.now()}`, selfieFile),
    ])

    const failedUpload = uploads.find(u => u.error)
    if (failedUpload?.error) {
      setError(t('kyc_upload_failed') + failedUpload.error.message)
      setLoading(false)
      return
    }

    const { error: kycError } = await supabase.from('kyc_submissions').insert({
      user_id: user.id,
      cccd_front_url: uploads[0].data!.path,
      cccd_back_url: uploads[1].data!.path,
      selfie_url: uploads[2].data!.path,
      cccd_number: idNumber,
      full_name: fullName,
      date_of_birth: dateOfBirth,
      status: 'pending',
    })

    if (kycError) {
      setError(t('kyc_submit_failed') + kycError.message)
      setLoading(false)
      return
    }

    await supabase.from('profiles').update({ kyc_status: 'pending' }).eq('id', user.id)
    setSuccess(t('kyc_success_msg'))
    setKycStatus('pending')
    setLoading(false)
  }

  const idTypeLabel = ID_TYPES.find(t => t.value === idType)?.label || 'CCCD'
  const idTypeShort = idTypeLabel.split('(')[0].trim()
  const st = KYC_STYLES[kycStatus] || KYC_STYLES.none
  const StatusIcon = st.Icon

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">{t('kyc_title')}</h1>

      {/* Status card */}
      <Card className="mb-6">
        <CardContent className="pt-5">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full" style={{ backgroundColor: st.bg }}>
              <StatusIcon className="size-5" style={{ color: st.text }} />
            </div>
            <div>
              <p className="text-sm text-gray-500">{t('kyc_status_label')}</p>
              <span
                className="inline-block mt-0.5 px-3 py-0.5 rounded-full text-xs font-bold"
                style={{ backgroundColor: st.bg, color: st.text }}
              >
                {KYC_STATUS_LABELS[kycStatus]}
              </span>
            </div>
          </div>

          {kycStatus === 'rejected' && rejectionReason && (
            <div className="mt-4 bg-[#FDE8EA] text-red-700 px-4 py-3 rounded-lg text-sm flex items-start gap-2">
              <AlertTriangle className="size-4 shrink-0 mt-0.5" />
              <div>
                <strong>{t('kyc_rejection_reason')}</strong> {rejectionReason}
              </div>
            </div>
          )}

          {kycStatus === 'approved' && (
            <div className="mt-4 bg-green-50 text-green-700 px-4 py-3 rounded-lg text-sm flex items-start gap-2">
              <CheckCircle className="size-4 shrink-0 mt-0.5" />
              <span>{t('kyc_approved_msg')}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* KYC Form */}
      {(kycStatus === 'none' || kycStatus === 'rejected') && (
        <Card>
          <CardContent className="pt-6">
            <h2 className="font-semibold text-lg mb-1">
              {kycStatus === 'rejected' ? t('kyc_resubmit') : t('kyc_verify_identity')}
            </h2>
            <p className="text-sm text-gray-500 mb-5">{t('kyc_form_note')}</p>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-[#FDE8EA] text-red-700 px-4 py-3 rounded-lg text-sm flex items-start gap-2">
                  <AlertTriangle className="size-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}
              {success && (
                <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg text-sm flex items-start gap-2">
                  <CheckCircle className="size-4 shrink-0 mt-0.5" />
                  <span>{success}</span>
                </div>
              )}

              {/* Personal info section */}
              <div className="bg-gray-50 rounded-xl p-5 space-y-4">
                <h3 className="text-sm font-semibold text-gray-700">{t('kyc_personal_info')}</h3>

                {/* Full name — readonly from registration */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    {t('kyc_full_name')} <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    className="h-12 bg-white"
                    value={fullName}
                    readOnly
                    disabled
                  />
                  <p className="text-xs text-gray-400">{t('kyc_name_hint')}</p>
                </div>

                {/* Date of birth */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    {t('kyc_dob')} <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="date"
                    className="h-12 bg-white"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
              </div>

              {/* ID document section */}
              <div className="bg-gray-50 rounded-xl p-5 space-y-4">
                <h3 className="text-sm font-semibold text-gray-700">{t('kyc_id_document')}</h3>

                {/* ID type */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    {t('kyc_id_type')} <span className="text-red-500">*</span>
                  </Label>
                  <select
                    value={idType}
                    onChange={(e) => setIdType(e.target.value)}
                    className="w-full h-12 rounded-lg border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5942]/20 focus:border-[#FF5942]"
                  >
                    {ID_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>

                {/* ID number */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    {t('kyc_id_number')} {idTypeShort} <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    className="h-12 bg-white"
                    value={idNumber}
                    onChange={(e) => setIdNumber(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))}
                    placeholder={idType === 'cccd' ? '001234567890' : idType === 'passport' ? 'B1234567' : 'B2 123456'}
                    maxLength={idType === 'cccd' ? 12 : 20}
                    required
                  />
                </div>
              </div>

              <Separator />

              {/* Photo upload section */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-1">{t('kyc_photo_section')}</h3>
                <div className="bg-amber-50 text-amber-700 px-4 py-3 rounded-lg text-xs mb-4 flex items-start gap-2">
                  <AlertTriangle className="size-4 shrink-0 mt-0.5" />
                  <div>
                    <strong>{t('kyc_photo_note_title')}</strong>
                    <ul className="mt-1 space-y-0.5 list-disc pl-4">
                      <li>{t('kyc_photo_note_1')}</li>
                      <li>{t('kyc_photo_note_2')}</li>
                      <li>{t('kyc_photo_note_3')}</li>
                      <li>{t('kyc_photo_note_4')}</li>
                    </ul>
                  </div>
                </div>

                <div className="grid gap-4">
                  {/* Front */}
                  <UploadBox
                    label={t('kyc_front_photo').replace('{type}', idTypeShort)}
                    required
                    preview={frontPreview}
                    inputRef={frontRef}
                    onSelect={(f) => handleFileSelect(f, setFrontFile, setFrontPreview)}
                    onClear={() => clearFile(setFrontFile, setFrontPreview)}
                    photoSelectedText={t('kyc_photo_selected')}
                    clickToSelectText={t('kyc_click_to_select')}
                  />

                  {/* Back */}
                  <UploadBox
                    label={t('kyc_back_photo').replace('{type}', idTypeShort)}
                    required
                    preview={backPreview}
                    inputRef={backRef}
                    onSelect={(f) => handleFileSelect(f, setBackFile, setBackPreview)}
                    onClear={() => clearFile(setBackFile, setBackPreview)}
                    photoSelectedText={t('kyc_photo_selected')}
                    clickToSelectText={t('kyc_click_to_select')}
                  />

                  {/* Selfie */}
                  <UploadBox
                    label={t('kyc_selfie_photo').replace('{type}', idTypeShort)}
                    required
                    preview={selfiePreview}
                    inputRef={selfieRef}
                    onSelect={(f) => handleFileSelect(f, setSelfieFile, setSelfiePreview)}
                    onClear={() => clearFile(setSelfieFile, setSelfiePreview)}
                    hint={t('kyc_selfie_hint')}
                    photoSelectedText={t('kyc_photo_selected')}
                    clickToSelectText={t('kyc_click_to_select')}
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-[#FF5942] hover:bg-[#e64d38] text-base font-bold"
                disabled={loading || !frontFile || !backFile || !selfieFile}
              >
                {loading ? t('kyc_submitting') : t('kyc_submit')}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Pending state */}
      {kycStatus === 'pending' && (
        <Card>
          <CardContent className="pt-6 text-center py-16">
            <div className="flex size-16 items-center justify-center rounded-full bg-amber-50 mx-auto mb-4">
              <Clock className="size-8 text-amber-500" />
            </div>
            <h2 className="text-lg font-semibold mb-2">{t('kyc_pending_title')}</h2>
            <p className="text-gray-500 max-w-md mx-auto">
              {t('kyc_pending_msg')}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function UploadBox({
  label, required, preview, inputRef, onSelect, onClear, hint, photoSelectedText, clickToSelectText,
}: {
  label: string
  required?: boolean
  preview: string | null
  inputRef: React.RefObject<HTMLInputElement | null>
  onSelect: (file: File | null) => void
  onClear: () => void
  hint?: string
  photoSelectedText: string
  clickToSelectText: string
}) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">
        {label} {required && <span className="text-red-500">*</span>}
      </Label>

      {preview ? (
        <div className="relative rounded-xl border-2 border-[#FF5942]/30 bg-[#FFEFED]/30 overflow-hidden">
          <img
            src={preview}
            alt={label}
            className="w-full h-48 object-contain bg-white"
          />
          <button
            type="button"
            onClick={onClear}
            className="absolute top-2 right-2 size-7 bg-red-600 text-white rounded-full flex items-center justify-center hover:bg-red-700 transition-colors"
          >
            <X className="size-4" />
          </button>
          <div className="px-3 py-2 bg-[#FFEFED] text-[#FF5942] text-xs font-medium flex items-center gap-1.5">
            <CheckCircle className="size-3.5" />
            {photoSelectedText}
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full h-40 rounded-xl border-2 border-dashed border-gray-300 hover:border-[#FF5942] hover:bg-[#FFEFED]/20 transition-colors flex flex-col items-center justify-center gap-2 cursor-pointer"
        >
          <div className="flex size-10 items-center justify-center rounded-full bg-gray-100">
            <Upload className="size-5 text-gray-400" />
          </div>
          <span className="text-sm text-gray-500">{clickToSelectText}</span>
          {hint && <span className="text-xs text-gray-400">{hint}</span>}
          <span className="text-[10px] text-gray-300">JPG, PNG, HEIC · max 10MB</span>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => onSelect(e.target.files?.[0] || null)}
      />
    </div>
  )
}
