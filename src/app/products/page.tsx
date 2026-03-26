import type { Metadata } from "next";
import ProductsClient from "./ProductsClient";

export const metadata: Metadata = {
  title: "Products",
  description:
    "Browse Alusea's premium collection of aluminium doors, windows, curtain walls, and architectural systems. Contact us for the latest aluminium windows and doors price list.",
  alternates: {
    canonical: "https://alusea.in/products",
  },
};

export default function ProductsPage() {
  return <ProductsClient />;
}
