import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page Not Found",
  robots: { index: false, follow: true },
};

const destinations = [
  { href: "/catalogue", label: "Catalogue", description: "Windows, doors and facade systems" },
  { href: "/projects", label: "Projects", description: "Villas and commercial installations" },
  { href: "/experience-center", label: "Experience Center", description: "See the systems in person" },
  { href: "/contact", label: "Contact", description: "Talk to our team" },
];

export default function NotFound() {
  return (
    <div className="pt-32 pb-24 px-6 bg-white">
      <div className="max-w-5xl mx-auto">
        <header className="mb-16 text-center space-y-4">
          <p className="text-[11px] uppercase tracking-[0.2em] text-brushed-bronze font-semibold">
            Error 404
          </p>
          <h1 className="text-4xl md:text-6xl font-bold text-architectural-blue tracking-tight">
            This Page <span className="text-brushed-bronze">Doesn&apos;t Exist</span>
          </h1>
          <p className="text-steel-gray text-lg leading-relaxed max-w-2xl mx-auto">
            The page you&apos;re looking for may have been moved or removed. Here&apos;s where to find what you need.
          </p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-16">
          {destinations.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group border border-gray-100 rounded-xl p-8 hover:border-brushed-bronze/50 hover:shadow-lg transition-all flex items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-matte-black group-hover:text-architectural-blue transition-colors">
                  {item.label}
                </h2>
                <p className="text-sm text-steel-gray">{item.description}</p>
              </div>
              <svg
                className="w-5 h-5 shrink-0 text-brushed-bronze transform group-hover:translate-x-1 transition-transform"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          ))}
        </div>

        <div className="text-center space-y-6">
          <div className="w-full h-px bg-gray-100" />
          <p className="text-steel-gray text-sm">
            Looking for something specific? We&apos;ll point you in the right direction.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/"
              className="inline-block px-8 py-3 bg-gray-50 text-matte-black font-bold text-sm rounded-lg hover:bg-brushed-bronze hover:text-white transition-colors"
            >
              Back to Home
            </Link>
            <a
              href="https://wa.me/919626022722?text=Hello,%20I%20was%20looking%20for%20a%20page%20on%20your%20website."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-8 py-3 border border-brushed-bronze text-brushed-bronze font-bold text-sm rounded-lg hover:bg-brushed-bronze hover:text-white transition-colors"
            >
              Message Us on WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
