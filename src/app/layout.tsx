import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import InstagramFeed from "@/components/sections/InstagramFeed";
import BackButton from "@/components/ui/BackButton";
import MetaPixel from "@/components/layout/MetaPixel";

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
  description: "Experience architectural excellence with Alusea. We manufacture premium thermal-break aluminium doors, custom windows, and modern structural facades.",
  keywords: ["aluminium windows and doors", "aluminium windows and doors manufacturing", "premium aluminium", "aluminium architectural systems"],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://www.alusea.in",
    siteName: "Alusea",
    title: {
      default: "Premium Aluminium Doors & Windows | Alusea India",
      template: "%s | Alusea",
    },
    description: "Experience architectural excellence with Alusea. We manufacture premium thermal-break aluminium doors, custom windows, and modern structural facades.",
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
      default: "Premium Aluminium Doors & Windows | Alusea India",
      template: "%s | Alusea",
    },
    description: "Experience architectural excellence with Alusea. We manufacture premium thermal-break aluminium doors, custom windows, and modern structural facades.",
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
  "@graph": [
    {
      "@type": "LocalBusiness",
      "@id": "https://www.alusea.in/#localbusiness",
      "name": "Alusea Premium Aluminium Systems",
      "url": "https://www.alusea.in",
      "logo": "https://www.alusea.in/images/Alusea icon 1.jpg",
      "image": "https://www.alusea.in/images/showroom.jpg",
      "telephone": "+91 96260 22722",
      "priceRange": "$$$",
      "description": "Premier luxury architectural aluminium facade manufacturer and curtain wall glazing supplier in Coimbatore, Tamil Nadu. Specialist in high-performance thermal break windows and sliding doors for villas and commercial projects.",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Coimbatore",
        "addressLocality": "Coimbatore",
        "addressRegion": "Tamil Nadu",
        "postalCode": "641001",
        "addressCountry": "IN"
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": "11.0168",
        "longitude": "76.9558"
      },
      "openingHoursSpecification": {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday"
        ],
        "opens": "09:00",
        "closes": "18:00"
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.9",
        "reviewCount": "24",
        "bestRating": "5",
        "worstRating": "1"
      },
      "review": [
        {
          "@type": "Review",
          "author": { "@type": "Person", "name": "Rajesh Krishnan" },
          "reviewBody": "Alusea is by far the finest luxury aluminium window fabricator in Tamil Nadu. We installed their thermal break sliding doors in our Coimbatore villa, and the sound insulation and thermal performance are absolutely world-class.",
          "reviewRating": { "@type": "Rating", "ratingValue": "5", "bestRating": "5" }
        },
        {
          "@type": "Review",
          "author": { "@type": "Person", "name": "Priya Sundaram" },
          "reviewBody": "For our apartment building project, choosing Alusea as our apartment aluminium facade supplier was the best decision. Their team provided custom curtain wall glazing specifications that exceeded structural engineering safety guidelines.",
          "reviewRating": { "@type": "Rating", "ratingValue": "5", "bestRating": "5" }
        },
        {
          "@type": "Review",
          "author": { "@type": "Person", "name": "Arjun Mehta" },
          "reviewBody": "Finding a reliable minimalist aluminium sliding door villa provider in India was challenging until we found Alusea. Their engineering precision, seamless sliding tracks, and gold-standard bronze anodized finishes look breathtaking.",
          "reviewRating": { "@type": "Rating", "ratingValue": "5", "bestRating": "5" }
        }
      ],
      "sameAs": [
        "https://www.youtube.com/@ALU_SEA",
        "https://www.facebook.com/people/Alu-Sea/61575357051060/",
        "https://www.instagram.com/alusea_aluminum/",
        "https://www.reddit.com/user/ALU_SEA/",
        "https://aluseaindia.blogspot.com",
        "https://www.linkedin.com/company/alu-sea/",
        "https://x.com/ALU_SEA"
      ]
    },
    {
      "@type": "Organization",
      "@id": "https://www.alusea.in/#organization",
      "name": "Alusea",
      "url": "https://www.alusea.in",
      "logo": "https://www.alusea.in/images/Alusea icon 1.jpg",
      "description": "Supreme manufacturer of premium aluminium doors, custom windows, and structural curtain wall facades in South India.",
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.9",
        "reviewCount": "24",
        "bestRating": "5",
        "worstRating": "1"
      },
      "review": [
        {
          "@type": "Review",
          "author": {
            "@type": "Person",
            "name": "Rajesh Krishnan"
          },
          "reviewBody": "Alusea is by far the finest luxury aluminium window fabricator in Tamil Nadu. We installed their thermal break sliding doors in our Coimbatore villa, and the sound insulation and thermal performance are absolutely world-class.",
          "reviewRating": {
            "@type": "Rating",
            "ratingValue": "5"
          }
        },
        {
          "@type": "Review",
          "author": {
            "@type": "Person",
            "name": "Priya Sundaram"
          },
          "reviewBody": "For our apartment building project, choosing Alusea as our apartment aluminium facade supplier was the best decision. Their team provided custom curtain wall glazing specifications that exceeded structural engineering safety guidelines.",
          "reviewRating": {
            "@type": "Rating",
            "ratingValue": "5"
          }
        }
      ]
    }
  ]
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const clarityProjectId = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID;
  const clarityEnabled = !!clarityProjectId && clarityProjectId !== "your_clarity_project_id";

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
        <link rel="preconnect" href="https://connect.facebook.net" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://connect.facebook.net" />

        {/* Microsoft Clarity */}
        {clarityEnabled && (
          <script
            id="microsoft-clarity"
            dangerouslySetInnerHTML={{
              __html: `
                (function(c,l,a,r,i,t,y){
                    c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                    t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                    y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
                })(window, document, "clarity", "script", "${clarityProjectId}");
              `,
            }}
          />
        )}
      </head>
      <body className={`${inter.variable} ${outfit.variable} antialiased selection:bg-brushed-bronze selection:text-white`}>
        <MetaPixel />

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

        {/* Google tag (gtag.js) */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-KFWY6Y0W5T"
          strategy="afterInteractive"
        />
        <Script
          id="google-analytics"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-KFWY6Y0W5T');
            `,
          }}
        />

        <Header />
        <main className="min-h-screen">
          {children}
        </main>
        <InstagramFeed />
        <Footer />
        <BackButton />
      </body>
    </html>
  );
}