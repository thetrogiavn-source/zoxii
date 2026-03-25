import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { I18nProvider } from "@/lib/i18n";

const SITE_URL = "https://zoxi.vn";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#FF5942",
};

export const metadata: Metadata = {
  title: {
    default: "ZOXI - Nhận thanh toán xuyên biên giới cho seller Việt Nam",
    template: "%s | ZOXI",
  },
  description:
    "Nền tảng nhận thanh toán quốc tế cho seller Việt Nam bán hàng trên Etsy, Amazon, Shopify. Tài khoản ảo VNĐ, rút tiền về ngân hàng Việt Nam.",
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: "/",
    languages: {
      vi: "/",
      en: "/en",
    },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "vi_VN",
    url: SITE_URL,
    siteName: "ZOXI",
    title: "ZOXI - Nhận thanh toán xuyên biên giới cho seller Việt Nam",
    description:
      "Nền tảng nhận thanh toán quốc tế cho seller Việt Nam bán hàng trên Etsy, Amazon, Shopify. Tài khoản ảo VNĐ, rút tiền về ngân hàng Việt Nam.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "ZOXI - Nhận thanh toán xuyên biên giới",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ZOXI - Nhận thanh toán xuyên biên giới cho seller Việt Nam",
    description:
      "Nền tảng nhận thanh toán quốc tế cho seller Việt Nam. Tài khoản ảo VNĐ, rút tiền về ngân hàng Việt Nam.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <link
          rel="preconnect"
          href="https://frkevjnojxzazwvjnzxb.supabase.co"
        />
        <link
          rel="dns-prefetch"
          href="https://frkevjnojxzazwvjnzxb.supabase.co"
        />
      </head>
      <body className="min-h-full flex flex-col">
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}
