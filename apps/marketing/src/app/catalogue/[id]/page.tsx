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
    <main className="min-h-screen bg-white dark:bg-matte-black pt-32 pb-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />

      <div className="max-w-7xl mx-auto px-6">
        <nav className="mb-8 text-sm text-steel-gray dark:text-gray-400">
          <Link href="/catalogue" className="hover:text-[#A67C52] transition-colors">
            Catalogue
          </Link>
          <span className="mx-2">/</span>
          <span className="text-matte-black dark:text-white">{product.name}</span>
        </nav>

        <ProductDetailClient product={product} />
      </div>
    </main>
  );
}
