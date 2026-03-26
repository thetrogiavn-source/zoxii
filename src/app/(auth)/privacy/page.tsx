'use client'

import Link from 'next/link'
import { useI18n } from '@/lib/i18n'

export default function PrivacyPage() {
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

        <h1 className="text-3xl font-bold text-black mb-2">{lang === 'en' ? 'Privacy Policy' : 'Chính sách bảo mật'}</h1>
        <p className="text-sm text-gray-400 mb-8">{lang === 'en' ? 'Last updated: March 26, 2026' : 'Cập nhật lần cuối: 26/03/2026'}</p>

        <div className="space-y-8 text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-black mb-3">{lang === 'en' ? '1. Introduction' : '1. Giới thiệu'}</h2>
            <p>
              {lang === 'en'
                ? 'ZOXI is committed to protecting your privacy and personal data. This privacy policy explains how we collect, use, store, and protect your information when you use the ZOXI platform — a BIDV virtual account service designed for Vietnamese sellers to receive payments from Etsy and other international marketplaces.'
                : 'ZOXI cam kết bảo vệ quyền riêng tư và dữ liệu cá nhân của bạn. Chính sách bảo mật này giải thích cách chúng tôi thu thập, sử dụng, lưu trữ và bảo vệ thông tin khi bạn sử dụng nền tảng ZOXI - dịch vụ tài khoản ảo BIDV dành cho seller Việt Nam nhận thanh toán từ Etsy và các sàn quốc tế.'}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-black mb-3">{lang === 'en' ? '2. Information We Collect' : '2. Thông tin chúng tôi thu thập'}</h2>
            <p className="mb-3">{lang === 'en' ? 'We collect the following types of information:' : 'Chúng tôi thu thập các loại thông tin sau:'}</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>{lang === 'en' ? 'Personal information:' : 'Thông tin cá nhân:'}</strong>{' '}
                {lang === 'en'
                  ? 'Full name, email, phone number, national ID/citizen ID card, and address when you register an account.'
                  : 'Họ tên, email, số điện thoại, CMND/CCCD, địa chỉ khi bạn đăng ký tài khoản.'}
              </li>
              <li>
                <strong>{lang === 'en' ? 'Financial information:' : 'Thông tin tài chính:'}</strong>{' '}
                {lang === 'en'
                  ? 'Bank account numbers, transaction details, and deposit/withdrawal history through BIDV virtual accounts.'
                  : 'Số tài khoản ngân hàng, thông tin giao dịch, lịch sử nhận và rút tiền qua tài khoản ảo BIDV.'}
              </li>
              <li>
                <strong>{lang === 'en' ? 'KYC information:' : 'Thông tin KYC:'}</strong>{' '}
                {lang === 'en'
                  ? 'Identity documents and verification photos as required by law.'
                  : 'Giấy tờ tùy thân, ảnh chụp xác minh danh tính theo yêu cầu tuân thủ pháp luật.'}
              </li>
              <li>
                <strong>{lang === 'en' ? 'Technical information:' : 'Thông tin kỹ thuật:'}</strong>{' '}
                {lang === 'en'
                  ? 'IP address, browser type, device information, and access timestamps for account security purposes.'
                  : 'Địa chỉ IP, loại trình duyệt, thiết bị, thời gian truy cập phục vụ bảo mật tài khoản.'}
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-black mb-3">{lang === 'en' ? '3. Purpose of Use' : '3. Mục đích sử dụng'}</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>{lang === 'en' ? 'Create and manage your BIDV virtual account.' : 'Tạo và quản lý tài khoản ảo BIDV cho bạn.'}</li>
              <li>{lang === 'en' ? 'Process incoming payments from Etsy and withdrawals to your Vietnamese bank account.' : 'Xử lý giao dịch nhận tiền từ Etsy và rút tiền về ngân hàng Việt Nam.'}</li>
              <li>{lang === 'en' ? 'Perform identity verification (KYC) and anti-money laundering (AML) checks.' : 'Xác minh danh tính (KYC) và phòng chống rửa tiền (AML).'}</li>
              <li>{lang === 'en' ? 'Send notifications about transactions, service changes, or security updates.' : 'Gửi thông báo về giao dịch, thay đổi dịch vụ, hoặc cập nhật bảo mật.'}</li>
              <li>{lang === 'en' ? 'Improve service quality and user experience.' : 'Cải thiện chất lượng dịch vụ và trải nghiệm người dùng.'}</li>
              <li>{lang === 'en' ? 'Comply with legal requirements and government authorities.' : 'Tuân thủ yêu cầu của pháp luật và cơ quan chức năng.'}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-black mb-3">{lang === 'en' ? '4. Information Sharing' : '4. Chia sẻ thông tin'}</h2>
            <p className="mb-3">
              {lang === 'en'
                ? 'We do not sell your personal information. Information is only shared in the following cases:'
                : 'Chúng tôi không bán thông tin cá nhân của bạn. Thông tin chỉ được chia sẻ trong các trường hợp sau:'}
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>{lang === 'en' ? 'Banking partners:' : 'Đối tác ngân hàng:'}</strong>{' '}
                {lang === 'en'
                  ? 'BIDV and payment partners for processing virtual account transactions.'
                  : 'BIDV và đối tác thanh toán để xử lý giao dịch tài khoản ảo.'}
              </li>
              <li>
                <strong>{lang === 'en' ? 'Government authorities:' : 'Cơ quan chức năng:'}</strong>{' '}
                {lang === 'en'
                  ? 'When required by lawful requests from government agencies.'
                  : 'Khi có yêu cầu hợp pháp từ cơ quan nhà nước.'}
              </li>
              <li>
                <strong>{lang === 'en' ? 'Service providers:' : 'Nhà cung cấp dịch vụ:'}</strong>{' '}
                {lang === 'en'
                  ? 'Third parties that support platform operations (hosting, email), bound by strict confidentiality obligations.'
                  : 'Các bên thứ ba hỗ trợ vận hành nền tảng (hosting, email), với ràng buộc bảo mật nghiêm ngặt.'}
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-black mb-3">{lang === 'en' ? '5. Data Security' : '5. Bảo mật dữ liệu'}</h2>
            <p>
              {lang === 'en'
                ? 'We employ industry-standard security measures including SSL/TLS encryption, sensitive data encryption, two-factor authentication, and continuous access monitoring. Financial data is stored on highly secure systems with restricted access.'
                : 'Chúng tôi áp dụng các biện pháp bảo mật tiêu chuẩn ngành bao gồm mã hóa SSL/TLS, mã hóa dữ liệu nhạy cảm, xác thực hai yếu tố, và giám sát truy cập liên tục. Dữ liệu tài chính được lưu trữ trên hệ thống bảo mật cao với quyền truy cập hạn chế.'}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-black mb-3">{lang === 'en' ? '6. Your Rights' : '6. Quyền của bạn'}</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>{lang === 'en' ? 'Access and view the personal information we store about you.' : 'Truy cập và xem thông tin cá nhân chúng tôi lưu trữ.'}</li>
              <li>{lang === 'en' ? 'Request correction of inaccurate information.' : 'Yêu cầu chỉnh sửa thông tin không chính xác.'}</li>
              <li>{lang === 'en' ? 'Request account deletion and erasure of personal data (subject to legal requirements).' : 'Yêu cầu xóa tài khoản và dữ liệu cá nhân (theo quy định pháp luật).'}</li>
              <li>{lang === 'en' ? 'Opt out of marketing emails (this does not affect transaction notifications).' : 'Từ chối nhận email marketing (không ảnh hưởng đến thông báo giao dịch).'}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-black mb-3">{lang === 'en' ? '7. Data Retention' : '7. Lưu trữ dữ liệu'}</h2>
            <p>
              {lang === 'en'
                ? 'Personal and transaction data is retained for the duration of your use of the service and for a minimum of 5 years after account closure, in accordance with legal requirements for financial record-keeping and anti-money laundering regulations.'
                : 'Dữ liệu cá nhân và giao dịch được lưu trữ trong suốt thời gian bạn sử dụng dịch vụ và tối thiểu 5 năm sau khi đóng tài khoản, theo quy định pháp luật về lưu trữ hồ sơ tài chính và phòng chống rửa tiền.'}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-black mb-3">{lang === 'en' ? '8. Contact' : '8. Liên hệ'}</h2>
            <p>
              {lang === 'en'
                ? 'If you have questions about this privacy policy or wish to exercise your rights, please contact us at: '
                : 'Nếu bạn có câu hỏi về chính sách bảo mật hoặc muốn thực hiện quyền của mình, vui lòng liên hệ: '}
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
