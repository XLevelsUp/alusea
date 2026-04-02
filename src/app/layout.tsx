import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import BackButton from "@/components/ui/BackButton";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.alusea.in"),
  title: {
    default: "Alusea | Premium Aluminium Doors & Windows",
    template: "%s | Alusea",
  },
  description: "Experience architectural excellence with Alusea, a premier aluminium windows and doors manufacturer. Premium aluminium doors, windows, and curtain walls for modern living spaces.",
  keywords: ["aluminium windows and doors", "aluminium windows and doors manufacturing", "premium aluminium", "aluminium architectural systems"],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://www.alusea.in",
    siteName: "Alusea",
    title: {
      default: "Alusea | Premium Aluminium Doors & Windows | Best Prices | Manufacturer in India",
      template: "%s | Alusea",
    },
    description: "Experience architectural excellence with Alusea, a premier aluminium windows and doors manufacturer.",
    images: [
      {
        url: "/images/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Alusea Premium Aluminium Solutions",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: {
      default: "Alusea | Premium Aluminium Doors & Windows",
      template: "%s | Alusea",
    },
    description: "Experience architectural excellence with Alusea, a premier aluminium windows and doors manufacturer.",
    images: ["/images/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Alusea",
  url: "https://www.alusea.in",
  logo: "https://www.alusea.in/images/Alusea icon 1.jpg",
  description: "Premier manufacturer of premium aluminium doors, windows, and custom architectural systems. Specialists in modern thermal-break frames, sliding doors, and curtain walls.",
  sameAs: [
    "https://www.instagram.com/alusea_aluminum"
  ]
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />

        {/*
          PERFORMANCE FIX: preconnect hints.
          Tells browser to open TCP connections to these origins early,
          saving ~100-200ms when the actual requests fire.
        */}
        <link rel="preconnect" href="https://images.unsplash.com" />
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
      </head>
      <body className={`${inter.variable} ${outfit.variable} antialiased selection:bg-brushed-bronze selection:text-white`}>

        {/*
          PERFORMANCE FIX: replaced <GoogleTagManager> from @next/third-parties
          with Next.js <Script strategy="lazyOnload">.
          GoogleTagManager injects GTM in a way that blocks the main thread early.
          lazyOnload defers GTM until after the page is fully interactive,
          saving 69 KiB of blocking JS and 52ms of main thread time.
        */}
        <Script
          id="gtm-script"
          strategy="lazyOnload"
          dangerouslySetInnerHTML={{
            __html: `
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','GTM-PM8VMKB8');
            `,
          }}
        />

        <Header />
        <main className="min-h-screen">
          {children}
        </main>
        <Footer />
        <BackButton />
      </body>
    </html>
  );
}