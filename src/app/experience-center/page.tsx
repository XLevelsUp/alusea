import type { Metadata } from "next";
import ExperienceCenterClient from "./ExperienceCenterClient";
import { createClient } from "@/utils/supabase/server";

export const metadata: Metadata = {
  title: "Visit Our Premium Aluminium Showroom",
  description:
    "Schedule a consultation at the Alusea Experience Center. Partner with our engineers for custom aluminium fabrications tailored to your project's needs.",
  alternates: {
    canonical: "/experience-center",
  },
};

export const revalidate = 60; // Revalidate every 60 seconds

export default async function ExperienceCenterPage() {
  const supabase = await createClient();

  const { data: zones } = await supabase
    .from("page_media")
    .select("*")
    .eq("page", "experience_center")
    .order("sort_order", { ascending: true });

  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "Alusea Experience Center",
    "image": "https://www.alusea.in/images/showroom.jpg",
    "telephone": "+91 96260 22722",
    "areaServed": "India",
    "description": "Visit the Alusea experience center to interact with our premium aluminium doors, windows, and curtain walls firsthand. Schedule a design consultation today."
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
      />
      <ExperienceCenterClient dbZones={zones || []} />
    </>
  );
}
