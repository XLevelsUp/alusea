import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ProductDetailClient from "./ProductDetailClient";
import type { ProductRow } from "@/lib/supabase/types";

export const revalidate = 0;

type Product = ProductRow;

const BASE_URL = "https://www.alusea.in";

async function getProduct(id: string): Promise<Product | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("products").select("*").eq("id", id).single();
  return data as Product | null;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) return {};

  return {
    title: `${product.name} | Alusea Premium Aluminium Solutions`,
    description: product.description,
    alternates: { canonical: `/catalogue/${product.id}` },
    openGraph: {
      title: product.name,
      description: product.description,
      type: "website",
      url: `${BASE_URL}/catalogue/${product.id}`,
      images: [{ url: product.image_url }],
    },
  };
}

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    notFound();
  }

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.image_urls?.length ? product.image_urls : [product.image_url],
    category: product.category,
    brand: { "@type": "Brand", name: "Alusea" },
  };

  return (
    <div className="min-h-screen bg-plate-white pb-[var(--section-y)] pt-[calc(var(--header-h)+3rem)]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />

      <div className="shell">
        <nav aria-label="Breadcrumb" className="mb-8 text-sm text-berry-bloom">
          <Link href="/catalogue" className="transition-colors hover:text-blueberry">
            Catalogue
          </Link>
          <span className="mx-2">/</span>
          <span className="text-blueberry">{product.name}</span>
        </nav>

        <ProductDetailClient product={product} />
      </div>
    </div>
  );
}
