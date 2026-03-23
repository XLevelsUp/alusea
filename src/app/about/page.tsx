import type { Metadata } from "next";
import ComingSoon from "@/components/sections/ComingSoon";

export const metadata: Metadata = {
  title: "About Us | Alusea",
  description:
    "Learn about Alusea — our story, our team, and our passion for premium aluminium architecture.",
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
      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
    />
  </svg>
);

export default function AboutPage() {
  return (
    <ComingSoon
      pageName="About Us"
      description="Discover the story behind Alusea — our heritage, our craftsmen, and our commitment to architectural excellence."
      icon={icon}
    />
  );
}
