'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export function LandingPricing() {
  const [billing, setBilling] = useState<'monthly' | 'annual'>('annual')
  const proPrice = billing === 'annual' ? 49 : 75

  return (
    <section id="pricing" className="py-20">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-4">Biểu phí minh bạch</h2>
        <p className="text-center text-gray-600 mb-8">Tạo tài khoản miễn phí. Chỉ trả phí khi nhận tiền. Không phí ẩn.</p>

        {/* Billing toggle */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex items-center gap-1 bg-gray-100 rounded-full p-1">
            <button
              onClick={() => setBilling('monthly')}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                billing === 'monthly'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Hàng tháng
            </button>
            <button
              onClick={() => setBilling('annual')}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 ${
                billing === 'annual'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Hàng năm
              <span className="text-[10px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full">
                -35%
              </span>
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {/* Free */}
          <Card className="border-2 border-gray-200 hover:border-gray-400 transition-colors flex flex-col">
            <CardContent className="pt-6 px-5 flex flex-col flex-1">
              <div className="flex items-center gap-2 mb-3">
                <span className="inline-block px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600">Free</span>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">$0<span className="text-base font-normal text-gray-500">/tháng</span></div>
              <p className="text-sm text-gray-500 mb-1">Phí giao dịch: <span className="font-semibold text-gray-700">2.5%</span></p>
              <p className="text-sm text-gray-500 mb-5">Bắt đầu miễn phí, không cần thẻ</p>
              <ul className="text-sm space-y-2 text-gray-600 mb-6 flex-1">
                <li className="flex items-start gap-2"><span className="text-gray-500 mt-0.5">✓</span> 10 Virtual Accounts</li>
                <li className="flex items-start gap-2"><span className="text-gray-500 mt-0.5">✓</span> Rút tiền miễn phí</li>
                <li className="flex items-start gap-2"><span className="text-gray-500 mt-0.5">✓</span> Dashboard & báo cáo</li>
                <li className="flex items-start gap-2"><span className="text-gray-500 mt-0.5">✓</span> Hỗ trợ tiếng Việt</li>
              </ul>
              <Link href="/register" className="block">
                <Button className="w-full bg-gray-800 hover:bg-gray-900">Bắt đầu miễn phí</Button>
              </Link>
            </CardContent>
          </Card>

          {/* Pro — Popular */}
          <Card className="border-2 border-[#FF5942] relative overflow-visible hover:shadow-lg transition-shadow flex flex-col">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#FF5942] text-white text-xs font-bold rounded-full z-10">
              Phổ biến
            </div>
            <CardContent className="pt-8 px-5 flex flex-col flex-1">
              <div className="flex items-center gap-2 mb-3">
                <span className="inline-block px-2.5 py-1 rounded-full text-xs font-bold bg-[#FFF0EE] text-[#FF5942]">Pro</span>
              </div>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-3xl font-bold text-gray-900">${proPrice}</span>
                <span className="text-base font-normal text-gray-500">/tháng</span>
              </div>
              {billing === 'annual' && (
                <p className="text-xs text-green-600 font-medium mb-1">
                  ${49 * 12}/năm — thanh toán theo năm
                </p>
              )}
              {billing === 'monthly' && (
                <p className="text-xs text-gray-400 mb-1">
                  Chuyển sang năm để tiết kiệm 35%
                </p>
              )}
              <p className="text-sm text-gray-500 mb-1">Phí giao dịch: <span className="font-semibold text-gray-700">1.5%</span></p>
              <p className="text-sm text-gray-500 mb-5">Dùng thử 7 ngày miễn phí</p>
              <ul className="text-sm space-y-2 text-gray-600 mb-6 flex-1">
                <li className="flex items-start gap-2"><span className="text-[#FF5942] mt-0.5">✓</span> 100 Virtual Accounts</li>
                <li className="flex items-start gap-2"><span className="text-[#FF5942] mt-0.5">✓</span> Đồng bộ Etsy tự động</li>
                <li className="flex items-start gap-2"><span className="text-[#FF5942] mt-0.5">✓</span> Xuất hóa đơn / Invoice</li>
                <li className="flex items-start gap-2"><span className="text-[#FF5942] mt-0.5">✓</span> Hỗ trợ ưu tiên</li>
                <li className="flex items-start gap-2"><span className="text-[#FF5942] mt-0.5">✓</span> Rút tiền miễn phí</li>
              </ul>
              <Link href="/register" className="block">
                <Button className="w-full bg-[#FF5942] hover:bg-[#e64d38]">Dùng thử miễn phí</Button>
              </Link>
            </CardContent>
          </Card>

          {/* Enterprise */}
          <Card className="border-2 border-purple-200 hover:border-purple-400 transition-colors flex flex-col">
            <CardContent className="pt-6 px-5 flex flex-col flex-1">
              <div className="flex items-center gap-2 mb-3">
                <span className="inline-block px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-600">Enterprise</span>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">Custom</div>
              <p className="text-sm text-gray-500 mb-1">Phí giao dịch: <span className="font-semibold text-gray-700">từ 1.0%</span></p>
              <p className="text-sm text-gray-500 mb-5">Giải pháp tùy chỉnh cho doanh nghiệp</p>
              <ul className="text-sm space-y-2 text-gray-600 mb-6 flex-1">
                <li className="flex items-start gap-2"><span className="text-purple-500 mt-0.5">✓</span> Unlimited VAs</li>
                <li className="flex items-start gap-2"><span className="text-purple-500 mt-0.5">✓</span> Dedicated Account Manager</li>
                <li className="flex items-start gap-2"><span className="text-purple-500 mt-0.5">✓</span> API tích hợp nâng cao</li>
                <li className="flex items-start gap-2"><span className="text-purple-500 mt-0.5">✓</span> SLA & hỗ trợ 24/7</li>
                <li className="flex items-start gap-2"><span className="text-purple-500 mt-0.5">✓</span> Phí thỏa thuận riêng</li>
              </ul>
              <Link href="/register" className="block">
                <Button variant="outline" className="w-full border-purple-300 text-purple-600 hover:bg-purple-50">Liên hệ sales</Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <p className="text-center text-sm text-gray-400 mt-6">
          Tất cả gói: Tạo VA miễn phí · Rút tiền miễn phí · Không phí duy trì · Không phí ẩn
        </p>
      </div>
    </section>
  )
}
