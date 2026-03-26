'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { LandingPricing } from '@/components/landing-pricing'
import { useI18n } from '@/lib/i18n'

export function LandingContent() {
  const { lang } = useI18n()

  const howItWorks = lang === 'en'
    ? [
        { step: '1', title: 'Sign up & Verify', desc: 'Create an account, upload ID for identity verification' },
        { step: '2', title: 'Get virtual account', desc: 'Receive a VND account number to add to Etsy Payment' },
        { step: '3', title: 'Etsy sends payment', desc: 'Etsy automatically deposits revenue into your virtual account' },
        { step: '4', title: 'Withdraw to bank', desc: 'Withdraw to any Vietnamese bank whenever you want' },
      ]
    : [
        { step: '1', title: 'Đăng ký & Xác minh', desc: 'Tạo tài khoản, upload CCCD để xác minh danh tính' },
        { step: '2', title: 'Nhận tài khoản ảo', desc: 'Nhận số tài khoản VNĐ để thêm vào Etsy Payment' },
        { step: '3', title: 'Etsy chuyển tiền', desc: 'Etsy tự động chuyển doanh thu vào tài khoản ảo của bạn' },
        { step: '4', title: 'Rút về ngân hàng', desc: 'Rút tiền về bất kỳ ngân hàng Việt Nam nào bạn muốn' },
      ]

  const benefits = lang === 'en'
    ? [
        { title: '100% Legal', desc: 'Partnered with a payment intermediary licensed by the State Bank of Vietnam. Full legal compliance.' },
        { title: 'Competitive fees', desc: 'Transaction fees from 1.5%, lower than Payoneer and other international solutions.' },
        { title: 'Vietnamese support', desc: 'Vietnamese support team that understands the needs of Vietnamese sellers.' },
        { title: 'Fast', desc: 'Create a virtual account in minutes. Withdraw to Vietnamese banks same day.' },
        { title: 'Transparent', desc: 'Track all transactions in real-time on your dashboard. No hidden fees.' },
        { title: 'Secure', desc: 'Data encryption, two-factor authentication, bank-grade security.' },
      ]
    : [
        { title: 'Hợp pháp 100%', desc: 'Hợp tác với đơn vị trung gian thanh toán được NHNN cấp phép. An tâm về pháp lý.' },
        { title: 'Phí cạnh tranh', desc: 'Phí giao dịch từ 1.5%, thấp hơn Payoneer và các giải pháp quốc tế khác.' },
        { title: 'Hỗ trợ tiếng Việt', desc: 'Đội ngũ hỗ trợ người Việt, hiểu rõ nhu cầu seller Việt Nam.' },
        { title: 'Nhanh chóng', desc: 'Tạo tài khoản ảo trong vài phút. Rút tiền về bank VN trong ngày.' },
        { title: 'Minh bạch', desc: 'Theo dõi mọi giao dịch real-time trên dashboard. Không phí ẩn.' },
        { title: 'An toàn', desc: 'Mã hóa dữ liệu, xác thực 2 lớp, bảo mật theo chuẩn ngân hàng.' },
      ]

  const faqs = lang === 'en'
    ? [
        {
          q: 'How does ZOXI work?',
          a: 'ZOXI provides you with a VND Virtual Account. You add this account number to your Etsy Payment Settings. When Etsy pays out, the funds go into your virtual account and you can withdraw to any Vietnamese bank anytime.',
        },
        {
          q: 'Is ZOXI legal?',
          a: 'Yes. ZOXI partners with a payment intermediary licensed by the State Bank of Vietnam. All transactions comply with legal regulations.',
        },
        {
          q: 'How long does it take to receive funds?',
          a: 'When Etsy sends payment, it usually takes 1-3 business days to arrive in your virtual account. Withdrawals to Vietnamese banks typically complete within a few hours.',
        },
        {
          q: 'Which platforms are supported?',
          a: 'Currently ZOXI supports Etsy. We are expanding to Amazon, Shopify, and other platforms.',
        },
        {
          q: 'What do I need to sign up?',
          a: 'You only need an email, national ID number (CCCD/CMND), and a selfie for identity verification. KYC usually completes within 24 hours.',
        },
      ]
    : [
        {
          q: 'ZOXI hoạt động như thế nào?',
          a: 'ZOXI cung cấp tài khoản ảo VNĐ (Virtual Account) cho bạn. Bạn thêm số tài khoản này vào Etsy Payment Settings. Khi Etsy trả tiền, tiền sẽ vào tài khoản ảo và bạn có thể rút về ngân hàng Việt Nam bất kỳ lúc nào.',
        },
        {
          q: 'ZOXI có hợp pháp không?',
          a: 'Có. ZOXI hợp tác với đơn vị trung gian thanh toán được Ngân hàng Nhà nước Việt Nam cấp phép. Mọi giao dịch đều tuân thủ quy định pháp luật.',
        },
        {
          q: 'Mất bao lâu để nhận tiền?',
          a: 'Khi Etsy chuyển tiền, thường mất 1-3 ngày làm việc để tiền vào tài khoản ảo. Rút tiền về bank VN thường trong vòng vài giờ.',
        },
        {
          q: 'Hỗ trợ những nền tảng nào?',
          a: 'Hiện tại ZOXI hỗ trợ Etsy. Chúng tôi đang mở rộng sang Amazon, Shopify và các nền tảng khác.',
        },
        {
          q: 'Cần gì để đăng ký?',
          a: 'Bạn chỉ cần email, số CCCD/CMND và ảnh selfie để xác minh danh tính. Quy trình KYC thường hoàn tất trong 24 giờ.',
        },
      ]

  return (
    <>
      {/* Hero - above the fold, prioritized for LCP */}
      <section className="py-12 sm:py-20 bg-gradient-to-br from-[#FFEFED] to-[#FFF5F3]">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            {lang === 'en' ? 'Receive payments from Etsy' : 'Nhận thanh toán từ Etsy'}
            <br />
            <span className="text-[#FF5942]">
              {lang === 'en' ? 'directly to Vietnamese banks' : 'trực tiếp vào bank Việt Nam'}
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            {lang === 'en'
              ? 'VND virtual accounts for Vietnamese sellers. Legal, transparent, competitive fees. No Payoneer, no PayPal needed.'
              : 'Tài khoản ảo VNĐ cho seller Việt Nam. Hợp pháp, minh bạch, phí cạnh tranh. Không cần Payoneer, không cần PayPal.'}
          </p>
          <div className="flex flex-col sm:flex-row flex-wrap gap-4 justify-center px-4 sm:px-0">
            <Link href="/register" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto text-lg px-8 py-6 bg-[#FF5942] hover:bg-[#e64d38]">
                {lang === 'en' ? 'Get started' : 'Bắt đầu ngay'}
              </Button>
            </Link>
            <a href="#how-it-works" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg px-8 py-6">
                {lang === 'en' ? 'Learn more' : 'Tìm hiểu thêm'}
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            {lang === 'en' ? 'How ZOXI works' : 'Cách hoạt động'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8">
            {howItWorks.map((item) => (
              <Card key={item.step} className="text-center">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 rounded-full bg-[#FF5942] text-white text-xl font-bold flex items-center justify-center mx-auto mb-4">
                    {item.step}
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                  <p className="text-gray-600">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            {lang === 'en' ? 'Why choose ZOXI?' : 'Tại sao chọn ZOXI?'}
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {benefits.map((item) => (
              <Card key={item.title}>
                <CardContent className="pt-6">
                  <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                  <p className="text-gray-600">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <LandingPricing />

      {/* FAQ */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-3xl font-bold text-center mb-12">
            {lang === 'en' ? 'Frequently asked questions' : 'Câu hỏi thường gặp'}
          </h2>
          <div className="space-y-6">
            {faqs.map((item) => (
              <div key={item.q} className="bg-white rounded-lg p-4 sm:p-6 shadow-sm">
                <h3 className="font-semibold text-lg mb-2">{item.q}</h3>
                <p className="text-gray-600">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-[#FF5942] to-[#e64d38]">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            {lang === 'en' ? 'Start receiving payments today' : 'Bắt đầu nhận thanh toán ngay hôm nay'}
          </h2>
          <p className="text-white/90 text-lg mb-8 max-w-xl mx-auto">
            {lang === 'en'
              ? 'Create a free account in minutes. No credit card required.'
              : 'Tạo tài khoản miễn phí trong vài phút. Không cần thẻ tín dụng.'}
          </p>
          <Link href="/register">
            <Button size="lg" className="text-lg px-8 py-6 bg-white text-[#FF5942] hover:bg-gray-100">
              {lang === 'en' ? 'Create free account' : 'Tạo tài khoản miễn phí'}
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t">
        <div className="container mx-auto px-4 text-center text-gray-500">
          <p>&copy; 2026 ZOXI. {lang === 'en' ? 'All rights reserved.' : 'Bảo lưu mọi quyền.'}</p>
        </div>
      </footer>
    </>
  )
}
