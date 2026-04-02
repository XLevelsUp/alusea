import type { Metadata } from "next";
import ProductsClient from "./ProductsClient";

export const metadata: Metadata = {
  title: "Custom Aluminium Window & Door Collections | Alusea",
  description:
    "Explore Alusea's comprehensive range of high-performance aluminium window frames and door systems. Ultra-slim profiles, multi-point locking, and acoustic insulation.",
  alternates: {
    canonical: "/products",
  },
};

export default function ProductsPage() {
  return <ProductsClient />;
}
