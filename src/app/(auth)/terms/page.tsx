'use client'

import Link from 'next/link'
import { useI18n } from '@/lib/i18n'

export default function TermsPage() {
  const { lang } = useI18n()
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* Logo */}
        <div className="mb-10">
          <Link href="/" className="inline-block">
            <span className="text-4xl font-bold text-[#FF5942]">ZOXI</span>
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-black mb-2">{lang === 'en' ? 'Terms of Service' : 'Điều khoản dịch vụ'}</h1>
        <p className="text-sm text-gray-400 mb-8">{lang === 'en' ? 'Last updated: March 26, 2026' : 'Cập nhật lần cuối: 26/03/2026'}</p>

        <div className="space-y-8 text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-black mb-3">{lang === 'en' ? '1. Introduction' : '1. Giới thiệu'}</h2>
            <p>
              {lang === 'en'
                ? 'Welcome to ZOXI. By accessing and using the ZOXI platform, you agree to comply with the terms and conditions set forth in this document. ZOXI is a platform that provides Virtual Account (VA) services through BIDV bank, enabling Vietnamese sellers to receive payments from international e-commerce marketplaces such as Etsy.'
                : 'Chào mừng bạn đến với ZOXI. Bằng việc truy cập và sử dụng nền tảng ZOXI, bạn đồng ý tuân thủ các điều khoản và điều kiện được nêu trong tài liệu này. ZOXI là nền tảng cung cấp dịch vụ tài khoản ảo (Virtual Account) thông qua ngân hàng BIDV, giúp seller Việt Nam nhận thanh toán từ các sàn thương mại điện tử quốc tế như Etsy.'}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-black mb-3">{lang === 'en' ? '2. Conditions of Use' : '2. Điều kiện sử dụng'}</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>{lang === 'en' ? 'You must be at least 18 years old and have full legal capacity.' : 'Bạn phải từ 18 tuổi trở lên và có năng lực hành vi dân sự đầy đủ.'}</li>
              <li>{lang === 'en' ? 'You must provide accurate and complete information when registering an account.' : 'Bạn phải cung cấp thông tin chính xác, đầy đủ khi đăng ký tài khoản.'}</li>
              <li>{lang === 'en' ? 'Each individual or business may only register one ZOXI account.' : 'Mỗi cá nhân hoặc doanh nghiệp chỉ được đăng ký một tài khoản ZOXI.'}</li>
              <li>{lang === 'en' ? 'You are responsible for maintaining the confidentiality of your login credentials.' : 'Bạn chịu trách nhiệm bảo mật thông tin đăng nhập của mình.'}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-black mb-3">{lang === 'en' ? '3. Virtual Account (VA) Services' : '3. Dịch vụ tài khoản ảo (VA)'}</h2>
            <p>
              {lang === 'en'
                ? 'ZOXI provides BIDV virtual accounts for you to receive payments from Etsy and other international marketplaces. Virtual accounts are created as numeric-only account numbers, compatible with e-commerce marketplace requirements.'
                : 'ZOXI cung cấp tài khoản ảo BIDV để bạn nhận thanh toán từ Etsy và các sàn quốc tế khác. Tài khoản ảo được tạo dưới dạng số tài khoản thuần số, tương thích với yêu cầu của các sàn thương mại điện tử.'}
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-3">
              <li>{lang === 'en' ? 'Virtual accounts may only be used for lawful payment collection purposes.' : 'Tài khoản ảo chỉ được sử dụng cho mục đích nhận thanh toán hợp pháp.'}</li>
              <li>{lang === 'en' ? 'ZOXI reserves the right to suspend or close accounts if suspicious activity is detected.' : 'ZOXI có quyền tạm khóa hoặc đóng tài khoản nếu phát hiện hoạt động bất thường.'}</li>
              <li>{lang === 'en' ? 'Funds in your virtual account will be transferred to your Vietnamese bank account through the withdrawal process.' : 'Số dư trong tài khoản ảo sẽ được chuyển về tài khoản ngân hàng Việt Nam của bạn theo quy trình rút tiền.'}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-black mb-3">{lang === 'en' ? '4. Service Fees' : '4. Phí dịch vụ'}</h2>
            <p>
              {lang === 'en'
                ? 'Service fees are publicly listed on the ZOXI pricing page. We reserve the right to modify the fee schedule with at least 30 days\' prior notice via email or platform notification. Your continued use of the service after a fee change constitutes acceptance of the new fee schedule.'
                : 'Phí dịch vụ được công bố công khai trên trang pricing của ZOXI. Chúng tôi có quyền thay đổi biểu phí với thông báo trước ít nhất 30 ngày qua email hoặc thông báo trên nền tảng. Việc bạn tiếp tục sử dụng dịch vụ sau khi thay đổi phí đồng nghĩa với việc bạn chấp nhận biểu phí mới.'}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-black mb-3">{lang === 'en' ? '5. Legal Compliance' : '5. Tuân thủ pháp luật'}</h2>
            <p>
              {lang === 'en'
                ? 'You agree to use ZOXI in compliance with Vietnamese law and regulations on foreign exchange, anti-money laundering (AML), and know-your-customer (KYC) requirements. ZOXI reserves the right to request identity verification documents from you at any time.'
                : 'Bạn cam kết sử dụng ZOXI tuân thủ pháp luật Việt Nam và các quy định về ngoại hối, chống rửa tiền (AML), và xác minh danh tính khách hàng (KYC). ZOXI có quyền yêu cầu bạn cung cấp giấy tờ xác minh danh tính bất kỳ lúc nào.'}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-black mb-3">{lang === 'en' ? '6. Limitation of Liability' : '6. Giới hạn trách nhiệm'}</h2>
            <p>
              {lang === 'en'
                ? 'ZOXI shall not be liable for damages arising from changes in Etsy or third-party policies, banking service interruptions, or force majeure events. We are committed to making our best efforts to ensure the service operates reliably and continuously.'
                : 'ZOXI không chịu trách nhiệm đối với các thiệt hại phát sinh từ việc sàn Etsy hoặc bên thứ ba thay đổi chính sách, gián đoạn dịch vụ ngân hàng, hoặc các sự kiện bất khả kháng. Chúng tôi cam kết nỗ lực tối đa để đảm bảo dịch vụ hoạt động ổn định và liên tục.'}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-black mb-3">{lang === 'en' ? '7. Termination of Service' : '7. Chấm dứt dịch vụ'}</h2>
            <p>
              {lang === 'en'
                ? 'You may stop using ZOXI at any time. ZOXI reserves the right to terminate or suspend your account if you violate these terms of service, engage in fraudulent activity, or upon request from government authorities.'
                : 'Bạn có thể ngừng sử dụng ZOXI bất kỳ lúc nào. ZOXI có quyền chấm dứt hoặc tạm ngưng tài khoản của bạn nếu bạn vi phạm điều khoản dịch vụ, có hành vi gian lận, hoặc theo yêu cầu của cơ quan chức năng.'}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-black mb-3">{lang === 'en' ? '8. Contact' : '8. Liên hệ'}</h2>
            <p>
              {lang === 'en'
                ? 'If you have any questions about these terms of service, please contact us at: '
                : 'Nếu bạn có bất kỳ câu hỏi nào về điều khoản dịch vụ, vui lòng liên hệ chúng tôi qua email: '}
              <span className="font-medium text-black">support@zoxi.vn</span>
            </p>
          </section>
        </div>

        {/* Back link */}
        <div className="mt-12 pt-8 border-t border-gray-100">
          <Link
            href="/"
            className="text-sm font-bold text-[#FF5942] hover:underline"
          >
            &larr; {lang === 'en' ? 'Back to home' : 'Quay lại trang chủ'}
          </Link>
        </div>
      </div>
    </div>
  )
}
