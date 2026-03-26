'use client'

import Link from 'next/link'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* Logo */}
        <div className="mb-10">
          <Link href="/" className="inline-block">
            <span className="text-4xl font-bold text-[#FF5942]">ZOXI</span>
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-black mb-2">Điều khoản dịch vụ</h1>
        <p className="text-sm text-gray-400 mb-8">Cập nhật lần cuối: 26/03/2026</p>

        <div className="space-y-8 text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-black mb-3">1. Giới thiệu</h2>
            <p>
              Chào mừng bạn đến với ZOXI. Bằng việc truy cập và sử dụng nền tảng ZOXI, bạn đồng ý
              tuân thủ các điều khoản và điều kiện được nêu trong tài liệu này. ZOXI là nền tảng
              cung cấp dịch vụ tài khoản ảo (Virtual Account) thông qua ngân hàng BIDV, giúp seller
              Việt Nam nhận thanh toán từ các sàn thương mại điện tử quốc tế như Etsy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-black mb-3">2. Điều kiện sử dụng</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>Bạn phải từ 18 tuổi trở lên và có năng lực hành vi dân sự đầy đủ.</li>
              <li>Bạn phải cung cấp thông tin chính xác, đầy đủ khi đăng ký tài khoản.</li>
              <li>Mỗi cá nhân hoặc doanh nghiệp chỉ được đăng ký một tài khoản ZOXI.</li>
              <li>Bạn chịu trách nhiệm bảo mật thông tin đăng nhập của mình.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-black mb-3">3. Dịch vụ tài khoản ảo (VA)</h2>
            <p>
              ZOXI cung cấp tài khoản ảo BIDV để bạn nhận thanh toán từ Etsy và các sàn quốc tế
              khác. Tài khoản ảo được tạo dưới dạng số tài khoản thuần số, tương thích với yêu cầu
              của các sàn thương mại điện tử.
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-3">
              <li>Tài khoản ảo chỉ được sử dụng cho mục đích nhận thanh toán hợp pháp.</li>
              <li>ZOXI có quyền tạm khóa hoặc đóng tài khoản nếu phát hiện hoạt động bất thường.</li>
              <li>Số dư trong tài khoản ảo sẽ được chuyển về tài khoản ngân hàng Việt Nam của bạn theo quy trình rút tiền.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-black mb-3">4. Phí dịch vụ</h2>
            <p>
              Phí dịch vụ được công bố công khai trên trang pricing của ZOXI. Chúng tôi có quyền
              thay đổi biểu phí với thông báo trước ít nhất 30 ngày qua email hoặc thông báo trên
              nền tảng. Việc bạn tiếp tục sử dụng dịch vụ sau khi thay đổi phí đồng nghĩa với
              việc bạn chấp nhận biểu phí mới.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-black mb-3">5. Tuân thủ pháp luật</h2>
            <p>
              Bạn cam kết sử dụng ZOXI tuân thủ pháp luật Việt Nam và các quy định về ngoại hối,
              chống rửa tiền (AML), và xác minh danh tính khách hàng (KYC). ZOXI có quyền yêu cầu
              bạn cung cấp giấy tờ xác minh danh tính bất kỳ lúc nào.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-black mb-3">6. Giới hạn trách nhiệm</h2>
            <p>
              ZOXI không chịu trách nhiệm đối với các thiệt hại phát sinh từ việc sàn Etsy hoặc
              bên thứ ba thay đổi chính sách, gián đoạn dịch vụ ngân hàng, hoặc các sự kiện bất
              khả kháng. Chúng tôi cam kết nỗ lực tối đa để đảm bảo dịch vụ hoạt động ổn định
              và liên tục.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-black mb-3">7. Chấm dứt dịch vụ</h2>
            <p>
              Bạn có thể ngừng sử dụng ZOXI bất kỳ lúc nào. ZOXI có quyền chấm dứt hoặc tạm
              ngưng tài khoản của bạn nếu bạn vi phạm điều khoản dịch vụ, có hành vi gian lận,
              hoặc theo yêu cầu của cơ quan chức năng.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-black mb-3">8. Liên hệ</h2>
            <p>
              Nếu bạn có bất kỳ câu hỏi nào về điều khoản dịch vụ, vui lòng liên hệ chúng tôi
              qua email: <span className="font-medium text-black">support@zoxi.vn</span>
            </p>
          </section>
        </div>

        {/* Back link */}
        <div className="mt-12 pt-8 border-t border-gray-100">
          <Link
            href="/"
            className="text-sm font-bold text-[#FF5942] hover:underline"
          >
            &larr; Quay lại trang chủ
          </Link>
        </div>
      </div>
    </div>
  )
}
