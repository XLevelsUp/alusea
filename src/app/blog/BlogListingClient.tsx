"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";

type Post = {
  slug: string;
  title: string;
  featured_image_url: string;
  featured_image_alt: string;
  category: string;
  tags: string[] | null;
  published_at: string | null;
};

type Category = {
  name: string;
  slug: string;
};

const POSTS_PER_PAGE = 12;

const ArrowUpRight = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={`${className} fill-none stroke-current`} viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M7 17L17 7M9 7h8v8" />
  </svg>
);

function formatDate(dateStr: string | null) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

function PostCard({ post, index }: { post: Post; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay: 0.05 * (index % 6), ease: "easeOut" }}
    >
      <Link href={`/blog/${post.slug}`} className="group block h-full">
        <div className="relative aspect-[3/2] w-full overflow-hidden rounded-2xl bg-alusea-light-gray">
          <Image
            src={post.featured_image_url}
            alt={post.featured_image_alt}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/0 to-black/0 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

          {/* Corner badge: rotates and scales in on hover, arrow flips to point outward */}
          <div className="absolute bottom-4 right-4 flex h-12 w-12 scale-75 items-center justify-center rounded-full bg-white text-matte-black opacity-0 shadow-lg transition-all duration-500 ease-out group-hover:scale-100 group-hover:opacity-100">
            <ArrowUpRight className="h-5 w-5 -rotate-45 transition-transform duration-500 ease-out group-hover:rotate-0" />
          </div>
        </div>

        <div className="mt-5 space-y-2">
          <div className="flex items-center gap-3 text-xs">
            <span className="rounded-full bg-[#7A5418]/10 px-3 py-1 font-bold uppercase tracking-wider text-[#7A5418]">
              {post.category}
            </span>
            <span className="text-steel-gray">{formatDate(post.published_at)}</span>
          </div>
          <h3 className="text-lg font-bold leading-snug text-matte-black transition-colors group-hover:text-[#7A5418] md:text-xl">
            {post.title}
          </h3>
        </div>
      </Link>
    </motion.div>
  );
}

export default function BlogListingClient({ posts, categories }: { posts: Post[]; categories: Category[] }) {
  const searchParams = useSearchParams();
  const tagFromUrl = searchParams.get("tag");

  const [activeCategory, setActiveCategory] = useState<string>("All Blogs");
  // A tag link (e.g. from a post's sidebar) takes over filtering until cleared,
  // independent of the category pills above it.
  const [activeTag, setActiveTag] = useState<string | null>(tagFromUrl);
  const [visibleCount, setVisibleCount] = useState(POSTS_PER_PAGE);

  const filters = useMemo(() => ["All Blogs", ...categories.map((c) => c.name)], [categories]);

  const filteredPosts = useMemo(() => {
    let result = posts;
    if (activeTag) {
      result = result.filter((p) => p.tags?.includes(activeTag));
    }
    if (activeCategory !== "All Blogs") {
      result = result.filter((p) => p.category === activeCategory);
    }
    return result;
  }, [posts, activeCategory, activeTag]);

  // Reset pagination whenever the active filter changes, so switching
  // categories/tags doesn't leave you deep in a page of the new filter's results.
  const visiblePosts = filteredPosts.slice(0, visibleCount);
  const hasMore = visibleCount < filteredPosts.length;

  const handleCategoryChange = (name: string) => {
    setActiveCategory(name);
    setVisibleCount(POSTS_PER_PAGE);
  };

  const handleClearTag = () => {
    setActiveTag(null);
    setVisibleCount(POSTS_PER_PAGE);
  };

  return (
    <main className="min-h-screen bg-white pt-32 pb-24 md:pt-40">
      <div className="mx-auto max-w-7xl px-6">
        {/* Header */}
        <div className="mb-12 space-y-4 text-center md:mb-16">
          <span className="block text-xs font-bold uppercase tracking-[0.3em] text-[#7A5418]">
            Insights
          </span>
          <h1 className="text-[40px] font-bold leading-[1.08] text-matte-black md:text-[54px]">
            Alusea Blog
          </h1>
          <p className="mx-auto max-w-xl text-lg text-steel-gray">
            Guides and updates on aluminium windows, doors, sliding systems, and architectural facades.
          </p>
        </div>

        {/* Category filter pills */}
        <div className="mb-12 flex flex-wrap justify-center gap-2.5 md:mb-16">
          {filters.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => handleCategoryChange(name)}
              className={`rounded-full border px-5 py-2.5 text-sm font-semibold transition-all duration-300 ${
                activeCategory === name
                  ? "border-[#7A5418] bg-[#7A5418] text-white shadow-md"
                  : "border-gray-200 bg-white text-steel-gray hover:border-[#7A5418]/50 hover:text-[#7A5418]"
              }`}
            >
              {name}
            </button>
          ))}
        </div>

        {/* Active tag filter indicator */}
        {activeTag && (
          <div className="mb-10 flex items-center justify-center gap-3">
            <span className="text-sm text-steel-gray">
              Showing posts tagged <span className="font-semibold text-matte-black">“{activeTag}”</span>
            </span>
            <button
              type="button"
              onClick={handleClearTag}
              className="text-sm font-semibold text-[#7A5418] hover:underline"
            >
              Clear
            </button>
          </div>
        )}

        {/* Post grid */}
        {filteredPosts.length > 0 ? (
          <>
            <div className="grid grid-cols-1 gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
              {visiblePosts.map((post, index) => (
                <PostCard key={post.slug} post={post} index={index} />
              ))}
            </div>

            {hasMore && (
              <div className="mt-16 flex justify-center">
                <button
                  type="button"
                  onClick={() => setVisibleCount((prev) => prev + POSTS_PER_PAGE)}
                  className="rounded-full border border-[#7A5418]/40 px-8 py-3.5 text-sm font-semibold text-[#7A5418] transition-all duration-300 hover:bg-[#7A5418] hover:text-white"
                >
                  Load More Articles
                </button>
              </div>
            )}
          </>
        ) : (
          <p className="py-20 text-center text-steel-gray">
            No articles in this category yet — check back soon.
          </p>
        )}
      </div>
    </main>
  );
}
