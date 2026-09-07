import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Learn how Alusea collects, uses, and protects your personal information. Read our complete privacy policy covering data collection, cookies, and your rights.",
  alternates: {
    canonical: "/privacy-policy",
  },
};

export default function PrivacyPolicyPage() {
  const lastUpdated = "April 7, 2026";

  return (
    <div className="pt-32 pb-24 px-6 min-h-screen bg-white">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-architectural-blue mb-4">
            Privacy <span className="text-brushed-bronze">Policy</span>
          </h1>
          <p className="text-steel-gray text-lg leading-relaxed">
            Your privacy matters to us. This policy explains how Alusea
            collects, uses, and safeguards your personal information.
          </p>
          <p className="mt-4 text-sm text-steel-gray/70">
            Last updated: {lastUpdated}
          </p>
        </header>

        {/* Policy Content */}
        <div className="prose prose-lg max-w-none space-y-12 text-matte-black/90">
          {/* 1. Introduction */}
          <section id="introduction">
            <h2 className="text-2xl font-bold text-architectural-blue mb-4">
              1. Introduction
            </h2>
            <p className="leading-relaxed">
              Alusea (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;)
              operates the website{" "}
              <a
                href="https://www.alusea.in"
                className="text-brushed-bronze hover:underline font-medium"
              >
                www.alusea.in
              </a>{" "}
              (the &quot;Website&quot;). This Privacy Policy describes the types
              of personal information we collect when you visit our Website,
              submit a query or quote request, or interact with us in any way.
              It also explains how we use, store, and protect that information.
            </p>
            <p className="leading-relaxed mt-4">
              By accessing or using our Website, you agree to the practices
              described in this Privacy Policy. If you do not agree with this
              policy, please discontinue use of our Website.
            </p>
          </section>

          {/* 2. Information We Collect */}
          <section id="information-we-collect">
            <h2 className="text-2xl font-bold text-architectural-blue mb-4">
              2. Information We Collect
            </h2>

            <h3 className="text-xl font-semibold text-matte-black mt-6 mb-3">
              2.1 Personal Information You Provide
            </h3>
            <p className="leading-relaxed">
              When you fill out our &quot;Get Free Quote&quot; or contact form,
              we collect the following information:
            </p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li>
                <strong>Name</strong> — First name and last name
              </li>
              <li>
                <strong>Email Address</strong> — To respond to your enquiry
              </li>
              <li>
                <strong>Phone Number</strong> — To contact you regarding your
                request
              </li>
              <li>
                <strong>Message / Project Details</strong> — Any additional
                information you choose to provide about your requirements
              </li>
            </ul>

            <h3 className="text-xl font-semibold text-matte-black mt-6 mb-3">
              2.2 Information Collected Automatically
            </h3>
            <p className="leading-relaxed">
              When you visit our Website, certain information is collected
              automatically through cookies and similar technologies:
            </p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li>IP address and approximate geographic location</li>
              <li>Browser type and version</li>
              <li>Operating system</li>
              <li>Pages visited, time spent on each page, and navigation path</li>
              <li>Referring website or source</li>
              <li>Device type (desktop, tablet, or mobile)</li>
            </ul>
          </section>

          {/* 3. How We Use Your Information */}
          <section id="how-we-use-information">
            <h2 className="text-2xl font-bold text-architectural-blue mb-4">
              3. How We Use Your Information
            </h2>
            <p className="leading-relaxed">
              We use the information we collect for the following purposes:
            </p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li>
                <strong>Respond to enquiries</strong> — To process and reply to
                your quote requests, questions, or feedback.
              </li>
              <li>
                <strong>Provide services</strong> — To deliver the products and
                services you request, including custom aluminium door and window
                solutions.
              </li>
              <li>
                <strong>Internal notifications</strong> — To alert our team of
                new enquiries so we can respond promptly.
              </li>
              <li>
                <strong>Improve our Website</strong> — To analyse usage patterns
                and enhance user experience, content, and functionality.
              </li>
              <li>
                <strong>Legal compliance</strong> — To comply with applicable
                laws, regulations, and legal processes.
              </li>
            </ul>
          </section>

          {/* 4. Third-Party Services */}
          <section id="third-party-services">
            <h2 className="text-2xl font-bold text-architectural-blue mb-4">
              4. Third-Party Services
            </h2>
            <p className="leading-relaxed">
              We use the following third-party services to operate and improve
              our Website. Each service may collect and process data under its
              own privacy policy:
            </p>

            <div className="mt-6 space-y-6">
              <div className="p-6 bg-aluminum-light rounded-xl">
                <h4 className="font-bold text-matte-black mb-2">
                  Google Analytics 4 (via Google Tag Manager)
                </h4>
                <p className="text-steel-gray leading-relaxed">
                  We use Google Analytics to understand how visitors interact
                  with our Website. Google Analytics collects anonymous usage
                  data such as pages visited, session duration, and traffic
                  sources. This data is processed by Google LLC. For more
                  information, see{" "}
                  <a
                    href="https://policies.google.com/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brushed-bronze hover:underline font-medium"
                  >
                    Google&apos;s Privacy Policy
                  </a>
                  .
                </p>
              </div>

              <div className="p-6 bg-aluminum-light rounded-xl">
                <h4 className="font-bold text-matte-black mb-2">
                  Google Sheets
                </h4>
                <p className="text-steel-gray leading-relaxed">
                  Contact form submissions are stored in Google Sheets for our
                  team to review and respond. This data is transmitted securely
                  and stored within our private Google Workspace account.
                </p>
              </div>

              <div className="p-6 bg-aluminum-light rounded-xl">
                <h4 className="font-bold text-matte-black mb-2">
                  WhatsApp Business API
                </h4>
                <p className="text-steel-gray leading-relaxed">
                  When you submit a quote request, a notification containing
                  your enquiry details is sent to our team via WhatsApp Business
                  API to enable prompt responses. For more information, see{" "}
                  <a
                    href="https://www.whatsapp.com/legal/privacy-policy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brushed-bronze hover:underline font-medium"
                  >
                    WhatsApp&apos;s Privacy Policy
                  </a>
                  .
                </p>
              </div>
            </div>
          </section>

          {/* 5. Cookies */}
          <section id="cookies">
            <h2 className="text-2xl font-bold text-architectural-blue mb-4">
              5. Cookies &amp; Tracking Technologies
            </h2>
            <p className="leading-relaxed">
              Our Website uses cookies — small text files placed on your device
              — to improve your browsing experience and gather analytical data.
            </p>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-architectural-blue text-white">
                    <th className="p-4 font-semibold rounded-tl-lg">Type</th>
                    <th className="p-4 font-semibold">Purpose</th>
                    <th className="p-4 font-semibold rounded-tr-lg">Duration</th>
                  </tr>
                </thead>
                <tbody className="text-steel-gray">
                  <tr className="border-b border-gray-100">
                    <td className="p-4 font-medium text-matte-black">Essential</td>
                    <td className="p-4">
                      Required for the Website to function correctly (e.g.,
                      session management).
                    </td>
                    <td className="p-4">Session</td>
                  </tr>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <td className="p-4 font-medium text-matte-black">Analytics</td>
                    <td className="p-4">
                      Google Analytics cookies that help us understand user
                      behaviour and improve our Website.
                    </td>
                    <td className="p-4">Up to 2 years</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="leading-relaxed mt-4">
              You can manage or disable cookies through your browser settings.
              Please note that disabling cookies may affect the functionality of
              our Website.
            </p>
          </section>

          {/* 6. Data Sharing */}
          <section id="data-sharing">
            <h2 className="text-2xl font-bold text-architectural-blue mb-4">
              6. Data Sharing &amp; Disclosure
            </h2>
            <p className="leading-relaxed">
              We do <strong>not</strong> sell, rent, or trade your personal
              information to third parties for marketing purposes. We may share
              your information only in the following circumstances:
            </p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li>
                <strong>Service providers</strong> — With trusted third-party
                services (listed above) that assist in operating our Website and
                business, subject to their own privacy policies.
              </li>
              <li>
                <strong>Legal requirements</strong> — When required by law, court
                order, or governmental authority.
              </li>
              <li>
                <strong>Business transfers</strong> — In connection with a
                merger, acquisition, or sale of assets, your information may be
                transferred as part of that transaction.
              </li>
            </ul>
          </section>

          {/* 7. Data Security */}
          <section id="data-security">
            <h2 className="text-2xl font-bold text-architectural-blue mb-4">
              7. Data Security
            </h2>
            <p className="leading-relaxed">
              We take reasonable technical and organisational measures to protect
              your personal information from unauthorised access, alteration,
              disclosure, or destruction. These measures include:
            </p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li>SSL/TLS encryption for all data transmitted via our Website</li>
              <li>
                Restricted access to personal data within our organisation
              </li>
              <li>Secure third-party platforms for data storage</li>
            </ul>
            <p className="leading-relaxed mt-4">
              However, no method of transmission over the Internet or electronic
              storage is 100% secure. While we strive to protect your personal
              information, we cannot guarantee its absolute security.
            </p>
          </section>

          {/* 8. Data Retention */}
          <section id="data-retention">
            <h2 className="text-2xl font-bold text-architectural-blue mb-4">
              8. Data Retention
            </h2>
            <p className="leading-relaxed">
              We retain your personal information only for as long as necessary
              to fulfil the purposes described in this policy, typically for the
              duration of our business relationship plus any additional period
              required by applicable law. Quote request data is retained for up
              to 24 months unless you request earlier deletion.
            </p>
          </section>

          {/* 9. Your Rights */}
          <section id="your-rights">
            <h2 className="text-2xl font-bold text-architectural-blue mb-4">
              9. Your Rights
            </h2>
            <p className="leading-relaxed">
              Depending on your jurisdiction, you may have the following rights
              regarding your personal data:
            </p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li>
                <strong>Access</strong> — Request a copy of the personal
                information we hold about you.
              </li>
              <li>
                <strong>Correction</strong> — Request correction of inaccurate
                or incomplete information.
              </li>
              <li>
                <strong>Deletion</strong> — Request deletion of your personal
                information, subject to legal obligations.
              </li>
              <li>
                <strong>Objection</strong> — Object to the processing of your
                personal information for specific purposes.
              </li>
              <li>
                <strong>Portability</strong> — Request a machine-readable copy
                of your data.
              </li>
            </ul>
            <p className="leading-relaxed mt-4">
              To exercise any of these rights, please contact us using the
              details provided below.
            </p>
          </section>

          {/* 10. Children's Privacy */}
          <section id="childrens-privacy">
            <h2 className="text-2xl font-bold text-architectural-blue mb-4">
              10. Children&apos;s Privacy
            </h2>
            <p className="leading-relaxed">
              Our Website is not intended for individuals under the age of 18.
              We do not knowingly collect personal information from children. If
              we become aware that we have inadvertently collected data from a
              child, we will take steps to delete it promptly.
            </p>
          </section>

          {/* 11. Changes to Policy */}
          <section id="changes">
            <h2 className="text-2xl font-bold text-architectural-blue mb-4">
              11. Changes to This Policy
            </h2>
            <p className="leading-relaxed">
              We may update this Privacy Policy from time to time to reflect
              changes in our practices, technology, or legal requirements. Any
              updates will be posted on this page with a revised &quot;Last
              updated&quot; date. We encourage you to review this policy
              periodically.
            </p>
          </section>

          {/* 12. Contact Us */}
          <section id="contact-us">
            <h2 className="text-2xl font-bold text-architectural-blue mb-4">
              12. Contact Us
            </h2>
            <p className="leading-relaxed">
              If you have any questions, concerns, or requests regarding this
              Privacy Policy or how we handle your data, please get in touch:
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
