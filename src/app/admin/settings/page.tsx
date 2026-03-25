'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Settings, Save, Check, CreditCard, Percent, Globe } from 'lucide-react'

const PLATFORMS = [
  { id: 'etsy', name: 'Etsy', icon: '🛍️' },
  { id: 'paypal', name: 'PayPal', icon: '💳' },
  { id: 'payoneer', name: 'Payoneer', icon: '💰' },
  { id: 'pingpong', name: 'Pingpong', icon: '🏓' },
  { id: 'wise', name: 'Wise', icon: '🌐' },
  { id: 'airwallex', name: 'Airwallex', icon: '✈️' },
  { id: 'worldfirst', name: 'WorldFirst', icon: '🌏' },
  { id: 'lianlian', name: 'LianLian', icon: '🔗' },
]

const TIERS = [
  { key: 'FREE', label: 'Free', color: 'text-green-600', bg: 'bg-green-50', desc: '$0/tháng · 2.5% phí' },
  { key: 'PRO', label: 'Pro', color: 'text-[#FF5942]', bg: 'bg-[#FFF0EE]', desc: '$49/tháng · 1.5% phí' },
  { key: 'ENTERPRISE', label: 'Enterprise', color: 'text-purple-600', bg: 'bg-purple-50', desc: 'Custom pricing' },
] as const

interface PlatformFee {
  FREE: number
  PRO: number
  ENTERPRISE: number
}

interface SystemSettings {
  defaultFee: number
  tierLimits: {
    FREE: number
    PRO: number
    ENTERPRISE: number // -1 = unlimited
  }
  platformFees: Record<string, PlatformFee>
}

const DEFAULT_SETTINGS: SystemSettings = {
  defaultFee: 2.5,
  tierLimits: { FREE: 10, PRO: 100, ENTERPRISE: -1 },
  platformFees: {
    etsy: { FREE: 2.5, PRO: 1.5, ENTERPRISE: 1.0 },
    paypal: { FREE: 2.5, PRO: 1.5, ENTERPRISE: 1.0 },
    payoneer: { FREE: 2.5, PRO: 1.5, ENTERPRISE: 1.0 },
    pingpong: { FREE: 2.5, PRO: 1.5, ENTERPRISE: 1.0 },
    wise: { FREE: 2.5, PRO: 1.5, ENTERPRISE: 1.0 },
    airwallex: { FREE: 2.5, PRO: 1.5, ENTERPRISE: 1.0 },
    worldfirst: { FREE: 2.5, PRO: 1.5, ENTERPRISE: 1.0 },
    lianlian: { FREE: 2.5, PRO: 1.5, ENTERPRISE: 1.0 },
  },
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SystemSettings>(DEFAULT_SETTINGS)
  const [saved, setSaved] = useState(false)
  const [activeSection, setActiveSection] = useState<'fees' | 'limits'>('fees')

  useEffect(() => {
    const stored = localStorage.getItem('zoxi_admin_settings')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setSettings({ ...DEFAULT_SETTINGS, ...parsed, platformFees: { ...DEFAULT_SETTINGS.platformFees, ...parsed.platformFees } })
      } catch { /* ignore */ }
    }
  }, [])

  function handleSave() {
    localStorage.setItem('zoxi_admin_settings', JSON.stringify(settings))
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  function updatePlatformFee(platformId: string, tier: string, value: number) {
    setSettings(prev => ({
      ...prev,
      platformFees: {
        ...prev.platformFees,
        [platformId]: { ...prev.platformFees[platformId], [tier]: value },
      },
    }))
  }

  function updateTierLimit(tier: string, value: number) {
    setSettings(prev => ({
      ...prev,
      tierLimits: { ...prev.tierLimits, [tier]: value },
    }))
  }

  function applyDefaultToAll() {
    const newPlatformFees = { ...settings.platformFees }
    for (const p of PLATFORMS) {
      newPlatformFees[p.id] = {
        FREE: settings.defaultFee,
        PRO: settings.defaultFee,
        ENTERPRISE: settings.defaultFee,
      }
    }
    setSettings(prev => ({ ...prev, platformFees: newPlatformFees }))
  }

  function applyWealifyPricing() {
    const newPlatformFees = { ...settings.platformFees }
    for (const p of PLATFORMS) {
      newPlatformFees[p.id] = { FREE: 2.5, PRO: 1.5, ENTERPRISE: 1.0 }
    }
    setSettings(prev => ({ ...prev, platformFees: newPlatformFees }))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold mb-1">Cài đặt hệ thống</h1>
          <p className="text-gray-500 text-sm">Cấu hình phí, giới hạn VA theo Tier và nguồn nhận.</p>
        </div>
        <button
          onClick={handleSave}
          className="h-10 px-6 rounded-lg bg-red-600 text-white font-medium text-sm hover:bg-red-700 transition-colors flex items-center gap-2"
        >
          {saved ? <Check className="size-4" /> : <Save className="size-4" />}
          {saved ? 'Đã lưu!' : 'Lưu cài đặt'}
        </button>
      </div>

      {saved && (
        <div className="mb-4 bg-green-50 text-green-700 px-4 py-3 rounded-lg text-sm font-medium">
          Cài đặt đã được lưu thành công.
        </div>
      )}

      {/* Section tabs */}
      <div className="flex items-center gap-1 mb-6">
        <button
          onClick={() => setActiveSection('fees')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
            activeSection === 'fees' ? 'bg-red-600 text-white' : 'text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <Percent className="size-4" /> Phí giao dịch
        </button>
        <button
          onClick={() => setActiveSection('limits')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
            activeSection === 'limits' ? 'bg-red-600 text-white' : 'text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <CreditCard className="size-4" /> Giới hạn VA
        </button>
      </div>

      {/* === FEES SECTION === */}
      {activeSection === 'fees' && (
        <div className="space-y-6">
          {/* Default fee */}
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-semibold flex items-center gap-2">
                    <Settings className="size-4 text-red-600" />
                    Phí mặc định
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">Áp dụng khi chưa có cấu hình riêng cho nguồn/tier</p>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    max="20"
                    value={settings.defaultFee}
                    onChange={(e) => setSettings({ ...settings, defaultFee: Number(e.target.value) })}
                    className="h-10 w-24 text-center font-semibold"
                  />
                  <span className="text-sm text-gray-500 font-medium">%</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={applyDefaultToAll} className="text-xs px-3 py-1.5 rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">
                  Áp dụng {settings.defaultFee}% cho tất cả
                </button>
                <button onClick={applyWealifyPricing} className="text-xs px-3 py-1.5 rounded-md bg-red-50 text-red-600 hover:bg-red-100 transition-colors">
                  Dùng giá mặc định (2.5/1.5/1.0)
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Fee matrix: Platform × Tier */}
          <Card>
            <CardContent className="pt-5">
              <h2 className="text-base font-semibold flex items-center gap-2 mb-1">
                <Globe className="size-4 text-red-600" />
                Phí theo Nguồn nhận × Tier
              </h2>
              <p className="text-xs text-gray-400 mb-4">Mỗi ô là % phí ZOXI thu trên mỗi giao dịch top-up từ nguồn đó.</p>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2.5 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-[160px]">
                        Nguồn nhận
                      </th>
                      {TIERS.map(tier => (
                        <th key={tier.key} className="text-center py-2.5 px-2 text-xs font-semibold uppercase tracking-wider w-[100px]">
                          <span className={`inline-block px-2 py-0.5 rounded-full ${tier.bg} ${tier.color}`}>
                            {tier.label}
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {PLATFORMS.map((platform) => (
                      <tr key={platform.id} className="border-b last:border-0 hover:bg-gray-50/50">
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{platform.icon}</span>
                            <span className="text-sm font-medium">{platform.name}</span>
                          </div>
                        </td>
                        {TIERS.map(tier => (
                          <td key={tier.key} className="py-3 px-2 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Input
                                type="number"
                                step="0.1"
                                min="0"
                                max="20"
                                value={settings.platformFees[platform.id]?.[tier.key as keyof PlatformFee] ?? settings.defaultFee}
                                onChange={(e) => updatePlatformFee(platform.id, tier.key, Number(e.target.value))}
                                className="h-9 w-[70px] text-center text-sm font-medium"
                              />
                              <span className="text-xs text-gray-400">%</span>
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <Separator className="my-4" />

              {/* Preview */}
              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Ví dụ tính phí</h3>
                <div className="bg-gray-50 rounded-lg p-4 text-sm">
                  <p className="text-gray-600">
                    Seller tier <span className="font-semibold text-gray-900">Free</span> nhận từ <span className="font-semibold text-gray-900">Etsy</span> số tiền <span className="font-semibold">10,000,000 VND</span>:
                  </p>
                  <div className="mt-2 flex items-center gap-4">
                    <span className="text-gray-500">Phí = {settings.platformFees.etsy?.FREE ?? settings.defaultFee}%</span>
                    <span className="text-gray-300">→</span>
                    <span className="font-semibold text-red-600">
                      {new Intl.NumberFormat('vi-VN').format(10000000 * (settings.platformFees.etsy?.FREE ?? settings.defaultFee) / 100)} VND
                    </span>
                    <span className="text-gray-300">→</span>
                    <span className="text-gray-600">
                      Seller nhận: <span className="font-semibold text-green-600">
                        {new Intl.NumberFormat('vi-VN').format(10000000 - 10000000 * (settings.platformFees.etsy?.FREE ?? settings.defaultFee) / 100)} VND
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pricing comparison with Wealify */}
          <Card>
            <CardContent className="pt-5">
              <h2 className="text-base font-semibold mb-3">So sánh với Wealify</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-3 text-xs text-gray-500">Tier</th>
                      <th className="text-center py-2 px-3 text-xs text-gray-500">Wealify</th>
                      <th className="text-center py-2 px-3 text-xs text-gray-500">ZOXI (Etsy)</th>
                      <th className="text-center py-2 px-3 text-xs text-gray-500">Chênh lệch</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { tier: 'Free', wealify: 3.5, key: 'FREE' as const },
                      { tier: 'Pro', wealify: 3.0, key: 'PRO' as const },
                      { tier: 'Enterprise', wealify: 2.0, key: 'ENTERPRISE' as const },
                    ].map(row => {
                      const zoxiFee = settings.platformFees.etsy?.[row.key] ?? settings.defaultFee
                      const diff = zoxiFee - row.wealify
                      return (
                        <tr key={row.key} className="border-b last:border-0">
                          <td className="py-2.5 px-3 font-medium">{row.tier}</td>
                          <td className="py-2.5 px-3 text-center text-gray-600">{row.wealify}%</td>
                          <td className="py-2.5 px-3 text-center font-semibold">{zoxiFee}%</td>
                          <td className="py-2.5 px-3 text-center">
                            <span className={`font-semibold ${diff < 0 ? 'text-green-600' : diff > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                              {diff > 0 ? '+' : ''}{diff.toFixed(1)}%
                              {diff < 0 && ' ✓ rẻ hơn'}
                              {diff === 0 && ' bằng'}
                              {diff > 0 && ' đắt hơn'}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* === LIMITS SECTION === */}
      {activeSection === 'limits' && (
        <div className="space-y-6">
          <Card>
            <CardContent className="pt-5">
              <h2 className="text-base font-semibold flex items-center gap-2 mb-1">
                <CreditCard className="size-4 text-red-600" />
                Giới hạn VA theo Tier
              </h2>
              <p className="text-xs text-gray-400 mb-5">Số lượng Virtual Account tối đa mỗi seller có thể tạo.</p>

              <div className="space-y-4">
                {TIERS.map(tier => (
                  <div key={tier.key} className="flex items-center justify-between p-4 rounded-xl border hover:bg-gray-50/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${tier.bg} ${tier.color} w-[90px] text-center`}>
                        {tier.label}
                      </span>
                      <span className="text-sm text-gray-500">{tier.desc}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {tier.key === 'ENTERPRISE' ? (
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-purple-600 bg-purple-50 px-4 py-2 rounded-lg">Unlimited</span>
                        </div>
                      ) : (
                        <>
                          <Input
                            type="number"
                            min="1"
                            max="1000"
                            value={settings.tierLimits[tier.key as keyof typeof settings.tierLimits]}
                            onChange={(e) => updateTierLimit(tier.key, Number(e.target.value))}
                            className="h-10 w-24 text-center font-semibold"
                          />
                          <span className="text-sm text-gray-400">VA</span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Tier summary */}
          <Card>
            <CardContent className="pt-5">
              <h2 className="text-base font-semibold mb-3">Tổng quan Tier</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2.5 px-3 text-xs text-gray-500 uppercase">Tier</th>
                      <th className="text-center py-2.5 px-3 text-xs text-gray-500 uppercase">VA tối đa</th>
                      <th className="text-center py-2.5 px-3 text-xs text-gray-500 uppercase">Phí Etsy</th>
                      <th className="text-center py-2.5 px-3 text-xs text-gray-500 uppercase">Phí PayPal</th>
                      <th className="text-center py-2.5 px-3 text-xs text-gray-500 uppercase">Phí Payoneer</th>
                    </tr>
                  </thead>
                  <tbody>
                    {TIERS.map(tier => (
                      <tr key={tier.key} className="border-b last:border-0">
                        <td className="py-2.5 px-3">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${tier.bg} ${tier.color}`}>
                            {tier.label}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center font-medium">
                          {tier.key === 'ENTERPRISE' ? 'Unlimited' : settings.tierLimits[tier.key as keyof typeof settings.tierLimits]}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {settings.platformFees.etsy?.[tier.key as keyof PlatformFee] ?? settings.defaultFee}%
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {settings.platformFees.paypal?.[tier.key as keyof PlatformFee] ?? settings.defaultFee}%
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {settings.platformFees.payoneer?.[tier.key as keyof PlatformFee] ?? settings.defaultFee}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
