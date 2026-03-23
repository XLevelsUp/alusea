import type { Metadata } from "next";
import ComingSoon from "@/components/sections/ComingSoon";

export const metadata: Metadata = {
  title: "Contact Us | Alusea",
  description:
    "Get in touch with Alusea for quotes, consultations, or inquiries about our aluminium products and services.",
};

const icon = (
  <svg
    className="w-16 h-16 text-alusea-gold"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1}
      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
    />
  </svg>
);

export default function ContactPage() {
  return (
    <ComingSoon
      pageName="Contact Us"
      description="A full-featured contact page is on its way. For now, reach us directly at aluseacbe@gmail.com or call +91 96260 22722."
      icon={icon}
    />
  );
}
