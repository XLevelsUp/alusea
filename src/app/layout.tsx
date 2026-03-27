import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
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
      default: "Alusea | Premium Aluminium Doors & Windows",
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
  url: "https://alusea.in",
  logo: "https://alusea.in/images/Alusea icon 1.jpg",
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
        {/* Google Tag Manager */}
        <script
          id="gtm-script"
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-PM8VMKB8');`
          }}
        />
        {/* End Google Tag Manager */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
      </head>
      <body className={`${inter.variable} ${outfit.variable} antialiased selection:bg-brushed-bronze selection:text-white`}>
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-PM8VMKB8"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        {/* End Google Tag Manager (noscript) */}

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
