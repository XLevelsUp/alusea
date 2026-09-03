import type { Metadata } from "next";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import BlogListingClient from "./BlogListingClient";

export const metadata: Metadata = {
  title: "Blog | Alusea Aluminium Doors & Windows",
  description:
    "Insights on aluminium windows, doors, sliding systems, facades and architectural glazing from the Alusea team.",
  alternates: { canonical: "/blog" },
};

export const revalidate = 300;

export default async function BlogPage() {
  const supabase = await createClient();

  const [{ data: posts }, { data: categories }] = await Promise.all([
    supabase
      .from("blog_posts")
      .select("slug, title, featured_image_url, featured_image_alt, category, tags, published_at")
      .order("published_at", { ascending: false }),
    supabase.from("blog_categories").select("name, slug").order("sort_order", { ascending: true }),
  ]);

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white pt-32 pb-24 px-6 flex flex-col items-center justify-center md:pt-40">
          <div className="w-10 h-10 border-4 border-[#B68B4C] border-t-transparent rounded-full animate-spin" />
          <p className="mt-4 text-steel-gray font-medium">Loading articles...</p>
        </div>
      }
    >
      <BlogListingClient posts={posts || []} categories={categories || []} />
    </Suspense>
  );
}
