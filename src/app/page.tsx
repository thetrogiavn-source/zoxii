import { LandingHeader } from '@/components/landing-header'
import { LandingContent } from '@/components/landing-content'

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

      {/* All content sections (bilingual) */}
      <LandingContent />
    </div>
  )
}
