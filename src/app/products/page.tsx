import type { Metadata } from "next";
import ComingSoon from "@/components/sections/ComingSoon";

export const metadata: Metadata = {
  title: "Products | Alusea",
  description:
    "Browse Alusea's premium collection of aluminium doors, windows, curtain walls, and architectural systems.",
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
      d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
    />
  </svg>
);

export default function ProductsPage() {
  return (
    <ComingSoon
      pageName="Our Collection"
      description="Our full product catalogue is being curated. Expect a showcase of premium aluminium systems designed for modern architecture."
      icon={icon}
    />
  );
}
