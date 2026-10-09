import type { Metadata } from "next";
import ContactForm from "@/components/sections/ContactForm";
import PageBanner from "@/components/layout/PageBanner";

export const metadata: Metadata = {
  title: "Get Quotes for Custom Aluminium Systems",
  description:
    "Get in touch with Alusea's architectural experts to request a free quote. We design bespoke premium aluminium windows and doors for modern properties.",
  alternates: {
    canonical: "/contact",
  },
};

const detailLabel = "text-xs font-semibold uppercase tracking-[0.2em] text-berry-bloom";
const detailValue = "font-display text-xl text-blueberry underline-offset-4 hover:underline md:text-2xl";

export default function ContactPage() {
  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "Alusea Experience Center",
    "image": "https://www.alusea.in/images/showroom.jpg",
    "telephone": "+91 96260 22722",
    "areaServed": "India",
    "description": "Visit the Alusea experience center to interact with our premium aluminium doors, windows, and curtain walls firsthand. Schedule a design consultation today."
  };

  return (
    <div className="bg-plate-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
      />
      <PageBanner crumb="Contact Us" title={<>Let&apos;s Build <span className="text-plate-white/80">Together</span></>}>
        <p>
          Looking for premium aluminium windows and doors near me? Whether you have a specific project in mind or need expert advice on the best aluminium systems for your space, our team is ready to assist.
        </p>
      </PageBanner>

      <section className="section">
        <div className="shell grid gap-12 lg:grid-cols-12 lg:gap-20">
          <dl className="reveal lg:col-span-4">
            <div className="border-t border-stem-grey/50 py-7">
              <dt className={detailLabel}>Email</dt>
              <dd className="mt-2">
                <a href="mailto:aluseacbe@gmail.com" className={detailValue}>aluseacbe@gmail.com</a>
              </dd>
            </div>
            <div className="border-t border-stem-grey/50 py-7">
              <dt className={detailLabel}>Phone</dt>
              <dd className="mt-2">
                <a href="tel:+919626022722" className={detailValue}>+91 96260 22722</a>
              </dd>
            </div>
            <div className="border-t border-stem-grey/50 py-7">
              <dt className={detailLabel}>Headquarters</dt>
              <dd className="mt-2">
                <address className="font-display text-xl not-italic leading-snug text-blueberry md:text-2xl">
                  Coimbatore, <br />
                  Tamil Nadu, India
                </address>
              </dd>
            </div>
            <div className="border-y border-stem-grey/50 py-7">
              <dt className={detailLabel}>Follow Us</dt>
              <dd className="mt-4">
                <a
                  href="https://www.instagram.com/alusea_aluminum"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="flex size-11 items-center justify-center rounded-full border border-blueberry/40 text-blueberry transition-colors duration-300 hover:bg-blueberry hover:text-white"
                >
                  <svg aria-hidden="true" className="size-[18px]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>
                </a>
              </dd>
            </div>
          </dl>

          <div id="enquiry" className="reveal swatch-shadow scroll-mt-28 rounded-card bg-white p-6 sm:p-10 lg:col-span-8 lg:p-12">
            <ContactForm />
          </div>
        </div>
      </section>
    </div>
  );
}
