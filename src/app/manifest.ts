import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'ZOXI - Nhận thanh toán xuyên biên giới cho seller Việt Nam',
    short_name: 'ZOXI',
    description:
      'Nền tảng nhận thanh toán quốc tế cho seller Việt Nam bán hàng trên Etsy, Amazon, Shopify. Tài khoản ảo VNĐ, rút tiền về ngân hàng Việt Nam.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#FF5942',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  }
}
