import { Metadata } from "next";
import { Suspense } from "react";
import CatalogueClient from "./CatalogueClient";
import { createClient } from "@/utils/supabase/server";

export const metadata: Metadata = {
  title: "Product Catalogue | Alusea Premium Aluminum Solutions",
  description: "Explore our comprehensive catalogue of premium aluminum doors, windows, and structural glazing systems. Designed for modern architecture.",
};

export const revalidate = 0; // Ensure fresh data on requests

export default async function CataloguePage() {
  const supabase = await createClient();
  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Supabase Error fetching catalogue:", error);
  }

  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white dark:bg-matte-black pt-32 pb-24 px-6 flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#B68B4C] border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-steel-gray font-medium">Loading Alusea Catalogue...</p>
      </div>
    }>
      <CatalogueClient initialProducts={products || []} />
    </Suspense>
  );
}
