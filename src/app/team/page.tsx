import type { Metadata } from "next";
import ComingSoon from "@/components/sections/ComingSoon";

export const metadata: Metadata = {
  title: "Our Team | Alusea",
  description:
    "Meet the skilled craftsmen and professionals behind Alusea's premium aluminium solutions.",
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
      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
    />
  </svg>
);

export default function TeamPage() {
  return (
    <ComingSoon
      pageName="Our Team"
      description="Get to know the dedicated team behind Alusea's craftsmanship. Our team profiles are coming soon."
      icon={icon}
    />
  );
}
