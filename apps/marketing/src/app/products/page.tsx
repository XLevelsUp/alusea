import type { Metadata } from "next";
import ProductsClient from "./ProductsClient";

export const metadata: Metadata = {
  title: "Thermal Break Aluminium Windows & Doors Coimbatore | Alusea",
  description:
    "Explore Alusea's premium thermal break aluminium windows and doors in Coimbatore. We fabricate custom architectural aluminium glass doors, minimalist sliding systems, and luxury glazing specifications for apartments and residential villas in Tamil Nadu.",
  keywords: [
    "Thermal break aluminium windows Coimbatore",
    "Aluminium sliding doors Coimbatore",
    "Aluminium glass door Coimbatore",
    "Aluminium windows manufacturer Coimbatore",
    "Aluminium window supply Tamil Nadu",
    "Thermal break aluminium window specification",
    "Apartment aluminium facade supplier",
    "Alusea aluminium Coimbatore",
    "Alusea windows doors India"
  ],
  alternates: {
    canonical: "/products",
  },
};

export default function ProductsPage() {
  return <ProductsClient />;
}
