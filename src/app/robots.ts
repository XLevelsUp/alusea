import type { MetadataRoute } from "next";
import { BASE_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Primary search engines — full access, tiered crawl delay
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: ["/api/", "/_next/"],
        crawlDelay: 2,
      },
      {
        userAgent: "Bingbot",
        allow: "/",
        disallow: ["/api/", "/_next/"],
        crawlDelay: 5,
      },
      {
        userAgent: "DuckDuckBot",
        allow: "/",
        disallow: ["/api/", "/_next/"],
        crawlDelay: 5,
      },
      {
        userAgent: "Applebot",
        allow: "/",
        disallow: ["/api/", "/_next/"],
        crawlDelay: 5,
      },
      {
        userAgent: "Yandex",
        allow: "/",
        disallow: ["/api/", "/_next/"],
        crawlDelay: 10,
      },

      // AI search indexers — permitted; these power AI search surfaces
      // that drive referral traffic. Content navigation guided via /llms.txt.
      {
        userAgent: "PerplexityBot",
        allow: ["/", "/products", "/services", "/features", "/experience-center", "/about", "/projects", "/catalogue"],
        disallow: ["/api/", "/_next/", "/data-deletion"],
        crawlDelay: 10,
      },
      {
        userAgent: "Claude-SearchBot",
        allow: ["/", "/products", "/services", "/features", "/about", "/projects"],
        disallow: ["/api/", "/_next/", "/data-deletion"],
        crawlDelay: 10,
      },
      {
        userAgent: "Applebot-Extended",
        allow: "/",
        disallow: ["/api/", "/_next/", "/data-deletion"],
        crawlDelay: 10,
      },

      // AI training crawlers — blocked; Alusea does not consent to model training use.
      // Product specifications and brand content are proprietary.
      { userAgent: "GPTBot", disallow: "/" },
      { userAgent: "ClaudeBot", disallow: "/" },
      { userAgent: "Google-Extended", disallow: "/" },
      { userAgent: "Amazonbot", disallow: "/" },
      { userAgent: "FacebookExternalHit", disallow: "/" },
      { userAgent: "Meta-ExternalAgent", disallow: "/" },
      { userAgent: "Bytespider", disallow: "/" },

      // Open datasets — blocked; CCBot feeds LLM training corpora
      { userAgent: "CCBot", disallow: "/" },

      // Internet Archive — permitted with strict rate limit
      {
        userAgent: "ia_archiver",
        allow: "/",
        disallow: ["/api/", "/_next/"],
        crawlDelay: 30,
      },

      // Commercial data products — blocked; these resell extracted structured data
      { userAgent: "DataForSeoBot", disallow: "/" },
      { userAgent: "Diffbot", disallow: "/" },
      { userAgent: "MJ12bot", disallow: "/" },
      { userAgent: "ZoominfoBot", disallow: "/" },
      { userAgent: "PetalBot", disallow: "/" },

      // SEO audit tools — permitted with strict rate limit
      {
        userAgent: "SemrushBot",
        allow: "/",
        disallow: ["/api/", "/_next/"],
        crawlDelay: 30,
      },
      {
        userAgent: "AhrefsBot",
        allow: "/",
        disallow: ["/api/", "/_next/"],
        crawlDelay: 30,
      },

      // Wildcard fallback — cautious default for all unidentified agents
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/_next/", "/data-deletion"],
        crawlDelay: 15,
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
