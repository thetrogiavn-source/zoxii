import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { LandingPricing } from '@/components/landing-pricing'
import { LandingHeader } from '@/components/landing-header'

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      name: 'ZOXI',
      url: 'https://zoxi.vn',
      logo: 'https://zoxi.vn/og-image.png',
      description:
        'Nền tảng nhận thanh toán quốc tế cho seller Việt Nam bán hàng trên Etsy, Amazon, Shopify.',
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'customer service',
        availableLanguage: ['Vietnamese', 'English'],
      },
    },
    {
      '@type': 'WebApplication',
      name: 'ZOXI',
      url: 'https://zoxi.vn',
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'Web',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'VND',
        description: 'Tạo tài khoản miễn phí. Phí giao dịch từ 1.5%.',
      },
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'ZOXI hoạt động như thế nào?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'ZOXI cung cấp tài khoản ảo VNĐ (Virtual Account) cho bạn. Bạn thêm số tài khoản này vào Etsy Payment Settings. Khi Etsy trả tiền, tiền sẽ vào tài khoản ảo và bạn có thể rút về ngân hàng Việt Nam bất kỳ lúc nào.',
          },
        },
        {
          '@type': 'Question',
          name: 'ZOXI có hợp pháp không?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Có. ZOXI hợp tác với đơn vị trung gian thanh toán được Ngân hàng Nhà nước Việt Nam cấp phép. Mọi giao dịch đều tuân thủ quy định pháp luật.',
          },
        },
        {
          '@type': 'Question',
          name: 'Mất bao lâu để nhận tiền?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Khi Etsy chuyển tiền, thường mất 1-3 ngày làm việc để tiền vào tài khoản ảo. Rút tiền về bank VN thường trong vòng vài giờ.',
          },
        },
        {
          '@type': 'Question',
          name: 'Hỗ trợ những nền tảng nào?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Hiện tại ZOXI hỗ trợ Etsy. Chúng tôi đang mở rộng sang Amazon, Shopify và các nền tảng khác.',
          },
        },
        {
          '@type': 'Question',
          name: 'Cần gì để đăng ký?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Bạn chỉ cần email, số CCCD/CMND và ảnh selfie để xác minh danh tính. Quy trình KYC thường hoàn tất trong 24 giờ.',
          },
        },
      ],
    },
  ],
}

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Header */}
      <LandingHeader />

      {/* Hero - above the fold, prioritized for LCP */}
      <section className="py-12 sm:py-20 bg-gradient-to-br from-[#FFEFED] to-[#FFF5F3]">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Nhận thanh toán từ Etsy
            <br />
            <span className="text-[#FF5942]">trực tiếp vào bank Việt Nam</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Tài khoản ảo VNĐ cho seller Việt Nam. Hợp pháp, minh bạch, phí cạnh tranh.
            Không cần Payoneer, không cần PayPal.
          </p>
          <div className="flex flex-col sm:flex-row flex-wrap gap-4 justify-center px-4 sm:px-0">
            <Link href="/register" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto text-lg px-8 py-6 bg-[#FF5942] hover:bg-[#e64d38]">
                Bắt đầu ngay
              </Button>
            </Link>
            <a href="#how-it-works" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg px-8 py-6">
                Tìm hiểu thêm
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Cách hoạt động</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8">
            {[
              { step: '1', title: 'Đăng ký & Xác minh', desc: 'Tạo tài khoản, upload CCCD để xác minh danh tính' },
              { step: '2', title: 'Nhận tài khoản ảo', desc: 'Nhận số tài khoản VNĐ để thêm vào Etsy Payment' },
              { step: '3', title: 'Etsy chuyển tiền', desc: 'Etsy tự động chuyển doanh thu vào tài khoản ảo của bạn' },
              { step: '4', title: 'Rút về ngân hàng', desc: 'Rút tiền về bất kỳ ngân hàng Việt Nam nào bạn muốn' },
            ].map((item) => (
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
          <h2 className="text-3xl font-bold text-center mb-12">Tại sao chọn ZOXI?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: 'Hợp pháp 100%', desc: 'Hợp tác với đơn vị trung gian thanh toán được NHNN cấp phép. An tâm về pháp lý.' },
              { title: 'Phí cạnh tranh', desc: 'Phí giao dịch từ 1.5%, thấp hơn Payoneer và các giải pháp quốc tế khác.' },
              { title: 'Hỗ trợ tiếng Việt', desc: 'Đội ngũ hỗ trợ người Việt, hiểu rõ nhu cầu seller Việt Nam.' },
              { title: 'Nhanh chóng', desc: 'Tạo tài khoản ảo trong vài phút. Rút tiền về bank VN trong ngày.' },
              { title: 'Minh bạch', desc: 'Theo dõi mọi giao dịch real-time trên dashboard. Không phí ẩn.' },
              { title: 'An toàn', desc: 'Mã hóa dữ liệu, xác thực 2 lớp, bảo mật theo chuẩn ngân hàng.' },
            ].map((item) => (
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
          <h2 className="text-3xl font-bold text-center mb-12">Câu hỏi thường gặp</h2>
          <div className="space-y-6">
            {[
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
            ].map((item) => (
              <div key={item.q} className="bg-white rounded-lg p-4 sm:p-6 shadow-sm">
                <h3 className="font-semibold text-lg mb-2">{item.q}</h3>
                <p className="text-gray-600">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t">
        <div className="container mx-auto px-4 text-center text-gray-500">
          <p>&copy; 2026 ZOXI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
