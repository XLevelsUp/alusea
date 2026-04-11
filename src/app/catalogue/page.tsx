import { Metadata } from "next";
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

  return <CatalogueClient initialProducts={products || []} />;
}
