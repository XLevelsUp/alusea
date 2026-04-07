import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Data Deletion Instructions",
  description:
    "Learn how to request deletion of your personal data from Alusea. Follow these simple steps to exercise your right to data erasure.",
  alternates: {
    canonical: "/data-deletion",
  },
};

export default function DataDeletionPage() {
  const lastUpdated = "April 7, 2026";

  return (
    <div className="pt-32 pb-24 px-6 min-h-screen bg-white">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-architectural-blue mb-4">
            Data <span className="text-brushed-bronze">Deletion</span>
          </h1>
          <p className="text-steel-gray text-lg leading-relaxed">
            We respect your right to control your personal data. This page
            explains how to request the deletion of any personal information
            we hold about you.
          </p>
          <p className="mt-4 text-sm text-steel-gray/70">
            Last updated: {lastUpdated}
          </p>
        </header>

        {/* Content */}
        <div className="prose prose-lg max-w-none space-y-12 text-matte-black/90">
          {/* What Data We Hold */}
          <section id="data-we-hold">
            <h2 className="text-2xl font-bold text-architectural-blue mb-4">
              What Data We May Hold About You
            </h2>
            <p className="leading-relaxed">
              When you interact with our website or services, we may have
              collected the following personal information:
            </p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li>
                <strong>Contact information</strong> — Name, email address, and
                phone number submitted through our quote request or contact
                forms.
              </li>
              <li>
                <strong>Project details</strong> — Any messages or project
                requirements you shared in your enquiry.
              </li>
              <li>
                <strong>Usage data</strong> — Anonymous analytics data collected
                via Google Analytics (cookies and browsing behaviour).
              </li>
            </ul>
          </section>

          {/* How to Request Deletion */}
          <section id="how-to-request">
            <h2 className="text-2xl font-bold text-architectural-blue mb-4">
              How to Request Data Deletion
            </h2>
            <p className="leading-relaxed">
              To request deletion of your personal data, follow these steps:
            </p>

            <div className="mt-8 space-y-6">
              {/* Step 1 */}
              <div className="flex gap-6">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-architectural-blue text-white flex items-center justify-center font-bold text-lg">
                  1
                </div>
                <div className="pt-2">
                  <h3 className="text-xl font-semibold text-matte-black mb-2">
                    Send a Deletion Request
                  </h3>
                  <p className="text-steel-gray leading-relaxed">
                    Email us at{" "}
                    <a
                      href="mailto:aluseacbe@gmail.com?subject=Data%20Deletion%20Request"
                      className="text-brushed-bronze hover:underline font-medium"
                    >
                      aluseacbe@gmail.com
                    </a>{" "}
                    with the subject line{" "}
                    <strong>&quot;Data Deletion Request&quot;</strong>. Include
                    the name, email address, and/or phone number you used when
                    contacting us, so we can locate your records.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-6">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-architectural-blue text-white flex items-center justify-center font-bold text-lg">
                  2
                </div>
                <div className="pt-2">
                  <h3 className="text-xl font-semibold text-matte-black mb-2">
                    Identity Verification
                  </h3>
                  <p className="text-steel-gray leading-relaxed">
                    For your security, we may ask you to verify your identity
                    before processing your request. This ensures that data is
                    only deleted at the request of the rightful data owner.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-6">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-architectural-blue text-white flex items-center justify-center font-bold text-lg">
                  3
                </div>
                <div className="pt-2">
                  <h3 className="text-xl font-semibold text-matte-black mb-2">
                    Processing &amp; Confirmation
                  </h3>
                  <p className="text-steel-gray leading-relaxed">
                    Once verified, we will delete your personal data from our
                    records within{" "}
                    <strong>30 business days</strong>. You will receive an email
                    confirmation once the deletion is complete.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* What Gets Deleted */}
          <section id="what-gets-deleted">
            <h2 className="text-2xl font-bold text-architectural-blue mb-4">
              What Gets Deleted
            </h2>
            <p className="leading-relaxed">
              Upon processing your request, we will permanently remove the
              following from our systems:
            </p>

            <div className="mt-6 space-y-4">
              <div className="p-6 bg-aluminum-light rounded-xl">
                <h4 className="font-bold text-matte-black mb-2">
                  Contact Form Submissions
                </h4>
                <p className="text-steel-gray leading-relaxed">
                  Your name, email, phone number, and any messages submitted
                  through our website forms will be removed from our Google
                  Sheets records and internal databases.
                </p>
              </div>

              <div className="p-6 bg-aluminum-light rounded-xl">
                <h4 className="font-bold text-matte-black mb-2">
                  WhatsApp Notification Records
                </h4>
                <p className="text-steel-gray leading-relaxed">
                  Any records of notifications sent via WhatsApp Business API
                  containing your enquiry details will be deleted from our
                  systems. Please note that WhatsApp message history on Meta's
                  servers is subject to{" "}
                  <a
                    href="https://www.whatsapp.com/legal/privacy-policy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brushed-bronze hover:underline font-medium"
                  >
                    WhatsApp&apos;s own data retention policy
                  </a>
                  .
                </p>
              </div>

              <div className="p-6 bg-aluminum-light rounded-xl">
                <h4 className="font-bold text-matte-black mb-2">
                  Email Correspondence
                </h4>
                <p className="text-steel-gray leading-relaxed">
                  Any email communications associated with your enquiry will be
                  deleted from our mailbox.
                </p>
              </div>
            </div>
          </section>

          {/* Exceptions */}
          <section id="exceptions">
            <h2 className="text-2xl font-bold text-architectural-blue mb-4">
              Exceptions
            </h2>
            <p className="leading-relaxed">
              In certain circumstances, we may be unable to delete some or all
              of your data. These exceptions include:
            </p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li>
                <strong>Legal obligations</strong> — Data that must be retained
                to comply with applicable laws, tax regulations, or court
                orders.
              </li>
              <li>
                <strong>Active contracts</strong> — If you have an ongoing
                project or order with Alusea, certain transactional records may
                need to be retained until completion.
              </li>
              <li>
                <strong>Anonymised data</strong> — Aggregated analytics data
                that does not personally identify you (e.g., Google Analytics
                reports) may be retained for website improvement purposes.
              </li>
            </ul>
            <p className="leading-relaxed mt-4">
              If any exception applies, we will notify you and explain which
              data cannot be deleted and why.
            </p>
          </section>

          {/* Third-Party Data */}
          <section id="third-party">
            <h2 className="text-2xl font-bold text-architectural-blue mb-4">
              Third-Party Data Deletion
            </h2>
            <p className="leading-relaxed">
              Our website uses third-party services that may independently
              collect data. To delete data held by these providers, you can use
              the following resources:
            </p>
            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-architectural-blue text-white">
                    <th className="p-4 font-semibold rounded-tl-lg">Service</th>
                    <th className="p-4 font-semibold rounded-tr-lg">
                      How to Delete Your Data
                    </th>
                  </tr>
                </thead>
                <tbody className="text-steel-gray">
                  <tr className="border-b border-gray-100">
                    <td className="p-4 font-medium text-matte-black">
                      Google Analytics
                    </td>
                    <td className="p-4">
                      Clear your browser cookies or use the{" "}
                      <a
                        href="https://tools.google.com/dlpage/gaoptout"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brushed-bronze hover:underline font-medium"
                      >
                        Google Analytics Opt-out Add-on
                      </a>
                    </td>
                  </tr>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <td className="p-4 font-medium text-matte-black">
                      WhatsApp / Meta
                    </td>
                    <td className="p-4">
                      Visit{" "}
                      <a
                        href="https://www.facebook.com/help/contact/deletion"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brushed-bronze hover:underline font-medium"
                      >
                        Meta&apos;s Data Deletion Page
                      </a>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Contact */}
          <section id="contact-us">
            <h2 className="text-2xl font-bold text-architectural-blue mb-4">
              Contact Us
            </h2>
            <p className="leading-relaxed">
              For any questions about data deletion or your privacy rights,
              please reach out:
            </p>
            <div className="mt-6 p-8 bg-aluminum-light rounded-xl space-y-4">
              <p className="font-bold text-matte-black text-lg">Alusea</p>
              <div className="space-y-2 text-steel-gray">
                <p>
                  <strong className="text-matte-black">Email:</strong>{" "}
                  <a
                    href="mailto:aluseacbe@gmail.com?subject=Data%20Deletion%20Request"
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
                <p>
                  <strong className="text-matte-black">Address:</strong> No 178,
                  A Ramachandra Road, RS Puram, Near Flower Market, Coimbatore,
                  Tamil Nadu – 641002, India
                </p>
              </div>
            </div>
          </section>

          {/* Related Policies */}
          <section id="related">
            <h2 className="text-2xl font-bold text-architectural-blue mb-4">
              Related Policies
            </h2>
            <ul className="space-y-3">
              <li>
                <a
                  href="/privacy-policy"
                  className="text-brushed-bronze hover:underline font-medium text-lg"
                >
                  Privacy Policy →
                </a>
              </li>
              <li>
                <a
                  href="/terms-of-service"
                  className="text-brushed-bronze hover:underline font-medium text-lg"
                >
                  Terms of Service →
                </a>
              </li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
