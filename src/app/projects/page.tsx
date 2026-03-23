import type { Metadata } from "next";
import ComingSoon from "@/components/sections/ComingSoon";

export const metadata: Metadata = {
  title: "Projects | Alusea",
  description:
    "Explore Alusea's portfolio of completed projects — residential, commercial, and architectural installations.",
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
      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
    />
  </svg>
);

export default function ProjectsPage() {
  return (
    <ComingSoon
      pageName="Project Gallery"
      description="We're building our portfolio gallery. Soon you'll be able to explore our finest completed aluminium installations."
      icon={icon}
    />
  );
}
