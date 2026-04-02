import type { Metadata } from "next";
import ProductsClient from "./ProductsClient";

export const metadata: Metadata = {
  title: "Custom Aluminium Window & Door Collections",
  description:
    "Explore Alusea's high-performance aluminium window frames and door systems. Designed with ultra-slim profiles, multi-point locks, and acoustic glass.",
  alternates: {
    canonical: "/products",
  },
};

export default function ProductsPage() {
  return <ProductsClient />;
}
