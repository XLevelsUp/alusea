"use client";

import { useState, useMemo } from "react";
import PageBanner from "@/components/layout/PageBanner";
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
        <div className="relative aspect-[3/2] w-full overflow-hidden rounded-card bg-plate-white">
          <Image
            src={post.featured_image_url}
            alt={post.featured_image_alt}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-blueberry/40 via-blueberry/0 to-blueberry/0 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

          {/* Corner badge: rotates and scales in on hover, arrow flips to point outward */}
          <div className="absolute bottom-4 right-4 flex h-12 w-12 scale-75 items-center justify-center rounded-full bg-white text-blueberry opacity-0 shadow-lg transition-all duration-500 ease-out group-hover:scale-100 group-hover:opacity-100">
            <ArrowUpRight className="h-5 w-5 -rotate-45 transition-transform duration-500 ease-out group-hover:rotate-0" />
          </div>
        </div>

        <div className="mt-5 space-y-2">
          <div className="flex items-center gap-3 text-xs">
            <span className="font-semibold uppercase tracking-[0.18em] text-berry-bloom">
              {post.category}
            </span>
            <span className="text-berry-bloom">{formatDate(post.published_at)}</span>
          </div>
          <h3 className="font-display text-xl font-normal leading-snug text-blueberry transition-colors group-hover:text-berry-bloom md:text-2xl">
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
    <div className="bg-plate-white">
      <PageBanner crumb="Blog" eyebrow="Insights" title="Alusea Blog">
        <p>Guides and updates on aluminium windows, doors, sliding systems, and architectural facades.</p>
      </PageBanner>

      <div className="shell section">
        {/* Category filter pills */}
        <div className="mb-12 flex flex-wrap gap-2.5 md:mb-16">
          {filters.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => handleCategoryChange(name)}
              aria-pressed={activeCategory === name}
              className={`btn ${activeCategory === name ? "btn-primary" : "btn-outline"}`}
            >
              {name}
            </button>
          ))}
        </div>

        {/* Active tag filter indicator */}
        {activeTag && (
          <div className="mb-10 flex items-center gap-3">
            <span className="text-sm text-berry-bloom">
              Showing posts tagged <span className="font-semibold text-blueberry">“{activeTag}”</span>
            </span>
            <button
              type="button"
              onClick={handleClearTag}
              className="text-sm font-semibold text-berry-bloom hover:underline"
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
                  className="btn btn-outline"
                >
                  Load More Articles
                </button>
              </div>
            )}
          </>
        ) : (
          <p className="py-20 text-center text-berry-bloom">
            No articles in this category yet — check back soon.
          </p>
        )}
      </div>
    </div>
  );
}
