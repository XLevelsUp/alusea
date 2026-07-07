import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Read the Terms of Service for Alusea. Understand the rules, guidelines, and legal agreements governing the use of our website and services.",
  alternates: {
    canonical: "/terms-of-service",
  },
};

export default function TermsOfServicePage() {
  const lastUpdated = "April 7, 2026";

  return (
    <div className="pt-32 pb-24 px-6 min-h-screen bg-white">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-architectural-blue mb-4">
            Terms of <span className="text-brushed-bronze">Service</span>
          </h1>
          <p className="text-steel-gray text-lg leading-relaxed">
            Please read these terms carefully before using our website or
            engaging our services.
          </p>
          <p className="mt-4 text-sm text-steel-gray/70">
            Last updated: {lastUpdated}
          </p>
        </header>

        {/* Terms Content */}
        <div className="prose prose-lg max-w-none space-y-12 text-matte-black/90">
          {/* 1. Acceptance of Terms */}
          <section id="acceptance">
            <h2 className="text-2xl font-bold text-architectural-blue mb-4">
              1. Acceptance of Terms
            </h2>
            <p className="leading-relaxed">
              By accessing or using the website{" "}
              <a
                href="https://www.alusea.in"
                className="text-brushed-bronze hover:underline font-medium"
              >
                www.alusea.in
              </a>{" "}
              (the &quot;Website&quot;), operated by Alusea (&quot;we,&quot;
              &quot;our,&quot; or &quot;us&quot;), you agree to be bound by
              these Terms of Service (&quot;Terms&quot;). If you do not agree to
              these Terms, you must discontinue use of the Website immediately.
            </p>
            <p className="leading-relaxed mt-4">
              We reserve the right to modify these Terms at any time. Changes
              will be effective upon posting to this page with a revised
              &quot;Last updated&quot; date. Your continued use of the Website
              after any changes constitutes acceptance of the updated Terms.
            </p>
          </section>

          {/* 2. About Our Services */}
          <section id="services">
            <h2 className="text-2xl font-bold text-architectural-blue mb-4">
              2. About Our Services
            </h2>
            <p className="leading-relaxed">
              Alusea is a manufacturer of premium aluminium doors, windows,
              structural facades, and custom architectural systems based in
              Coimbatore, Tamil Nadu, India. Our Website provides information
              about our products, services, completed projects, and allows
              visitors to request free quotes and consultations.
            </p>
          </section>

          {/* 3. Use of the Website */}
          <section id="use-of-website">
            <h2 className="text-2xl font-bold text-architectural-blue mb-4">
              3. Use of the Website
            </h2>
            <p className="leading-relaxed">
              You agree to use our Website only for lawful purposes and in
              accordance with these Terms. You agree not to:
            </p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li>
                Use the Website in any way that violates any applicable national
                or international law or regulation.
              </li>
              <li>
                Attempt to gain unauthorised access to any portion of the
                Website, server, or any connected system or database.
              </li>
              <li>
                Use any automated system, including bots, scrapers, or crawlers,
                to access the Website for any purpose without our express written
                permission.
              </li>
              <li>
                Transmit any viruses, malware, or other harmful code through the
                Website.
              </li>
              <li>
                Impersonate any person or entity, or falsely represent your
                affiliation with any person or entity.
              </li>
              <li>
                Submit false, misleading, or fraudulent information through our
                contact or quote request forms.
              </li>
            </ul>
          </section>

          {/* 4. Intellectual Property */}
          <section id="intellectual-property">
            <h2 className="text-2xl font-bold text-architectural-blue mb-4">
              4. Intellectual Property
            </h2>
            <p className="leading-relaxed">
              All content on this Website — including but not limited to text,
              images, graphics, logos, icons, photographs, videos, page layouts,
              and software — is the property of Alusea or its licensors and is
              protected by applicable intellectual property laws.
            </p>
            <div className="mt-6 p-6 bg-aluminum-light rounded-xl">
              <h4 className="font-bold text-matte-black mb-2">
                You may not:
              </h4>
              <ul className="list-disc pl-6 space-y-2 text-steel-gray">
                <li>
                  Reproduce, distribute, or create derivative works from any
                  content without prior written consent.
                </li>
                <li>
                  Use our brand name, logo, or trademarks in any manner that
                  could cause confusion or imply endorsement without
                  authorisation.
                </li>
                <li>
                  Download, copy, or re-publish product images or project
                  gallery photographs for commercial use.
                </li>
              </ul>
            </div>
          </section>

          {/* 5. Quote Requests & Contact Forms */}
          <section id="quote-requests">
            <h2 className="text-2xl font-bold text-architectural-blue mb-4">
              5. Quote Requests &amp; Contact Forms
            </h2>
            <p className="leading-relaxed">
              When you submit a quote request or contact form on our Website:
            </p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li>
                You agree to provide accurate and complete information,
                including your name, email address, and phone number.
              </li>
              <li>
                You understand that submitting a quote request does not
                constitute a binding contract or guarantee of pricing,
                availability, or timeline.
              </li>
              <li>
                All quotations provided by Alusea are estimates only and are
                subject to change based on final specifications, site
                conditions, material costs, and other factors.
              </li>
              <li>
                Quotations are valid for a period of{" "}
                <strong>30 days</strong> from the date of issue unless otherwise
                stated in writing.
              </li>
              <li>
                Your submission data is processed in accordance with our{" "}
                <a
                  href="/privacy-policy"
                  className="text-brushed-bronze hover:underline font-medium"
                >
                  Privacy Policy
                </a>
                .
              </li>
            </ul>
          </section>

          {/* 6. Product Information & Pricing */}
          <section id="product-information">
            <h2 className="text-2xl font-bold text-architectural-blue mb-4">
              6. Product Information &amp; Pricing
            </h2>
            <p className="leading-relaxed">
              We make every effort to ensure that product descriptions,
              specifications, and images on our Website are accurate and
              up-to-date. However:
            </p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li>
                Colours displayed on screen may vary from actual product colours
                due to monitor settings and photographic limitations.
              </li>
              <li>
                Product specifications, dimensions, and features are subject to
                change without prior notice as we continually improve our
                offerings.
              </li>
              <li>
                Pricing is not displayed on the Website and is provided only
                through individual quotations based on project-specific
                requirements.
              </li>
              <li>
                Images of completed projects are representative examples and may
                not reflect available options for all configurations.
              </li>
            </ul>
          </section>

          {/* 7. Orders & Contracts */}
          <section id="orders-contracts">
            <h2 className="text-2xl font-bold text-architectural-blue mb-4">
              7. Orders &amp; Contracts
            </h2>
            <p className="leading-relaxed">
              A binding contract between you and Alusea is formed only upon
              execution of a separate written agreement, purchase order, or
              confirmed order acknowledgment — not through this Website alone.
              All orders are subject to:
            </p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li>
                Acceptance by Alusea upon review of project requirements and
                feasibility.
              </li>
              <li>
                Mutually agreed-upon terms including payment schedules,
                delivery timelines, and installation specifications.
              </li>
              <li>
                Any additional terms and conditions set forth in the formal
                agreement.
              </li>
            </ul>
          </section>

          {/* 8. Limitation of Liability */}
          <section id="limitation-of-liability">
            <h2 className="text-2xl font-bold text-architectural-blue mb-4">
              8. Limitation of Liability
            </h2>
            <p className="leading-relaxed">
              To the fullest extent permitted by applicable law:
            </p>
            <div className="mt-4 space-y-4">
              <div className="p-6 bg-aluminum-light rounded-xl">
                <p className="text-steel-gray leading-relaxed">
                  <strong className="text-matte-black">
                    Website provided &quot;as is&quot;:
                  </strong>{" "}
                  The Website and its content are provided on an &quot;as
                  is&quot; and &quot;as available&quot; basis without warranties
                  of any kind, whether express or implied, including but not
                  limited to implied warranties of merchantability, fitness for
                  a particular purpose, or non-infringement.
                </p>
              </div>
              <div className="p-6 bg-aluminum-light rounded-xl">
                <p className="text-steel-gray leading-relaxed">
                  <strong className="text-matte-black">
                    No liability for damages:
                  </strong>{" "}
                  Alusea shall not be liable for any direct, indirect,
                  incidental, consequential, or punitive damages arising from
                  your use of or inability to use the Website, including but not
                  limited to errors, interruptions, or loss of data.
                </p>
              </div>
              <div className="p-6 bg-aluminum-light rounded-xl">
                <p className="text-steel-gray leading-relaxed">
                  <strong className="text-matte-black">
                    Third-party links:
                  </strong>{" "}
                  Our Website may contain links to third-party websites. We are
                  not responsible for the content, privacy practices, or
                  availability of those websites.
                </p>
              </div>
            </div>
          </section>

          {/* 9. Indemnification */}
          <section id="indemnification">
            <h2 className="text-2xl font-bold text-architectural-blue mb-4">
              9. Indemnification
            </h2>
            <p className="leading-relaxed">
              You agree to indemnify, defend, and hold harmless Alusea, its
              directors, officers, employees, and agents from and against any
              claims, liabilities, damages, losses, and expenses (including
              reasonable legal fees) arising out of or in any way connected with
              your access to or use of the Website, your violation of these
              Terms, or your violation of any rights of a third party.
            </p>
          </section>

          {/* 10. Governing Law */}
          <section id="governing-law">
            <h2 className="text-2xl font-bold text-architectural-blue mb-4">
              10. Governing Law &amp; Jurisdiction
            </h2>
            <p className="leading-relaxed">
              These Terms shall be governed by and construed in accordance with
              the laws of India. Any disputes arising out of or relating to
              these Terms or your use of the Website shall be subject to the
              exclusive jurisdiction of the courts located in Coimbatore, Tamil
              Nadu, India.
            </p>
          </section>

          {/* 11. Severability */}
          <section id="severability">
            <h2 className="text-2xl font-bold text-architectural-blue mb-4">
              11. Severability
            </h2>
            <p className="leading-relaxed">
              If any provision of these Terms is held to be invalid or
              unenforceable by a court of competent jurisdiction, the remaining
              provisions shall continue in full force and effect. The invalid or
              unenforceable provision will be deemed modified to the minimum
              extent necessary to make it valid and enforceable.
            </p>
          </section>

          {/* 12. Entire Agreement */}
          <section id="entire-agreement">
            <h2 className="text-2xl font-bold text-architectural-blue mb-4">
              12. Entire Agreement
            </h2>
            <p className="leading-relaxed">
              These Terms, together with our{" "}
              <a
                href="/privacy-policy"
                className="text-brushed-bronze hover:underline font-medium"
              >
                Privacy Policy
              </a>
              , constitute the entire agreement between you and Alusea regarding
              the use of the Website and supersede all prior agreements and
              understandings, whether written or oral.
            </p>
          </section>

          {/* 13. Contact Us */}
          <section id="contact-us">
            <h2 className="text-2xl font-bold text-architectural-blue mb-4">
              13. Contact Us
            </h2>
            <p className="leading-relaxed">
              If you have any questions or concerns regarding these Terms of
              Service, please contact us:
            </p>
            <div className="mt-6 p-8 bg-aluminum-light rounded-xl space-y-4">
              <p className="font-bold text-matte-black text-lg">Alusea</p>
              <div className="space-y-2 text-steel-gray">
                <p>
                  <strong className="text-matte-black">Address:</strong> No 178,
                  A Ramachandra Road, RS Puram, Near Flower Market, Coimbatore,
                  Tamil Nadu – 641002, India
                </p>
                <p>
                  <strong className="text-matte-black">Email:</strong>{" "}
                  <a
                    href="mailto:aluseacbe@gmail.com"
                    className="text-brushed-bronze hover:underline font-medium"
                  >
                    aluseacbe@gmail.com
                  </a>
                </p>
                <p>
                  <strong className="text-matte-black">Phone:</strong>{" "}
                  <a
                    href="tel:+919626022722"
                    className="text-brushed-bronze hover:underline font-medium"
                  >
                    +91 96260 22722
                  </a>
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
