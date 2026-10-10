import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ShareLinks from "./ShareLinks";
import CommentForm from "./CommentForm";
import type { BlogPostRow } from "@/lib/supabase/types";

export const revalidate = 300;

type BlogPost = BlogPostRow;

const BASE_URL = "https://www.alusea.in";

function excerptFromHtml(html: string, maxLength = 160): string {
  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return text.length > maxLength ? `${text.slice(0, maxLength - 1).trimEnd()}…` : text;
}

async function getPost(slug: string): Promise<BlogPost | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("blog_posts").select("*").eq("slug", slug).single();
  return data as BlogPost | null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return {};

  const description = excerptFromHtml(post.intro_html) || post.title;

  return {
    title: post.title,
    description,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      title: post.title,
      description,
      type: "article",
      url: `${BASE_URL}/blog/${post.slug}`,
      images: [{ url: post.featured_image_url }],
      publishedTime: post.published_at,
      modifiedTime: post.updated_at,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description,
      images: [post.featured_image_url],
    },
  };
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    notFound();
  }

  const supabase = await createClient();
  const { data: comments } = await supabase
    .from("blog_comments")
    .select("id, name, message, created_at")
    .eq("post_id", post.id)
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    image: [post.featured_image_url],
    datePublished: post.published_at,
    dateModified: post.updated_at,
    author: { "@type": "Organization", name: post.author },
    publisher: {
      "@type": "Organization",
      name: "Alusea",
      logo: { "@type": "ImageObject", url: `${BASE_URL}/images/Alusea icon 1.jpg` },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": `${BASE_URL}/blog/${post.slug}` },
  };

  return (
    <div className="min-h-screen bg-plate-white pb-24 pt-[calc(var(--header-h)+3rem)]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />

      <article className="mx-auto max-w-7xl px-6">
        {/* H1 */}
        <header className="mx-auto mb-10 max-w-4xl text-center space-y-4">
          <div className="flex items-center justify-center gap-3 text-xs">
            <span className="rounded-full bg-berry-bloom/10 px-3 py-1 font-bold uppercase tracking-wider text-berry-bloom">
              {post.category}
            </span>
            <span className="text-berry-bloom">{formatDate(post.published_at)}</span>
            <span className="text-berry-bloom">·</span>
            <span className="text-berry-bloom">{post.reading_time_minutes} min read</span>
          </div>
          <h1 className="text-[32px] font-bold leading-[1.15] text-blueberry md:text-[46px]">
            {post.title}
          </h1>
        </header>

        {/* Featured image */}
        <div className="mx-auto mb-10 max-w-5xl">
          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-card bg-plate-white">
            <Image
              src={post.featured_image_url}
              alt={post.featured_image_alt}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 1024px"
              className={post.featured_image_fit === "contain" ? "object-contain" : "object-cover"}
            />
          </div>
        </div>

        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-12 lg:grid-cols-[1fr_260px]">
          {/* Main content */}
          <div className="min-w-0">
            {/* Introduction */}
            <div
              className="prose prose-lg max-w-none prose-headings:text-blueberry prose-a:text-berry-bloom"
              dangerouslySetInnerHTML={{ __html: post.intro_html }}
            />

            {/* Sections */}
            {post.sections?.map((section, sIdx) => (
              <section key={sIdx} className="mt-10">
                <h2 className="text-2xl md:text-[28px] font-bold text-blueberry mb-4">{section.heading}</h2>
                <div
                  className="prose prose-lg max-w-none prose-headings:text-blueberry prose-a:text-berry-bloom"
                  dangerouslySetInnerHTML={{ __html: section.body_html }}
                />

                {/* Second image, shown after the first section (matches the reference placement) */}
                {sIdx === 0 && post.second_image_url && (
                  <div className="relative my-8 aspect-[16/9] w-full overflow-hidden rounded-card bg-plate-white">
                    <Image
                      src={post.second_image_url}
                      alt={post.second_image_alt || post.title}
                      fill
                      sizes="(max-width: 1024px) 100vw, 800px"
                      className={post.second_image_fit === "contain" ? "object-contain" : "object-cover"}
                    />
                  </div>
                )}

                {section.subsections?.map((sub, subIdx) => (
                  <div key={subIdx} className="mt-6">
                    <h3 className="text-xl font-bold text-blueberry mb-3">{sub.heading}</h3>
                    <div
                      className="prose prose-lg max-w-none prose-headings:text-blueberry prose-a:text-berry-bloom"
                      dangerouslySetInnerHTML={{ __html: sub.body_html }}
                    />
                  </div>
                ))}
              </section>
            ))}

            {/* Q&A */}
            {post.qa?.length > 0 && (
              <section className="mt-12">
                <h2 className="text-2xl md:text-[28px] font-bold text-blueberry mb-6">Frequently Asked Questions</h2>
                <div className="space-y-6">
                  {post.qa.map((item, index) => (
                    <div key={index} className="border-b border-stem-grey/50 pb-6 last:border-0">
                      <h3 className="text-lg font-bold text-blueberry mb-2">{item.question}</h3>
                      <p className="text-berry-bloom leading-relaxed">{item.answer}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* CTA */}
            {post.cta?.buttons?.length > 0 && (
              <section className="mt-14 rounded-card bg-plate-white px-8 py-10 text-center md:px-12">
                {post.cta.intro && (
                  <p className="mx-auto mb-7 max-w-2xl text-berry-bloom leading-relaxed">{post.cta.intro}</p>
                )}
                <div className="flex flex-wrap justify-center gap-4">
                  {post.cta.buttons.map((button, index) => (
                    <Link
                      key={index}
                      href={button.href}
                      className={
                        index === 0
                          ? "inline-flex items-center rounded-card bg-blueberry px-7 py-3.5 text-sm font-bold uppercase tracking-widest text-white transition-colors hover:bg-berry-bloom"
                          : "inline-flex items-center rounded-card border border-berry-bloom/40 px-7 py-3.5 text-sm font-bold uppercase tracking-widest text-berry-bloom transition-colors hover:bg-blueberry hover:text-white"
                      }
                    >
                      {button.label}
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Comments */}
            <section id="comments" className="mt-16 scroll-mt-28">
              <h2 className="text-2xl font-bold text-blueberry mb-6">
                Comments {comments && comments.length > 0 ? `(${comments.length})` : ""}
              </h2>
              {comments && comments.length > 0 && (
                <div className="mb-10 space-y-6">
                  {comments.map((comment) => (
                    <div key={comment.id} className="border-b border-stem-grey/50 pb-6">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-bold text-blueberry">{comment.name}</span>
                        <span className="text-xs text-berry-bloom">{formatDate(comment.created_at)}</span>
                      </div>
                      <p className="text-berry-bloom leading-relaxed">{comment.message}</p>
                    </div>
                  ))}
                </div>
              )}
              <CommentForm postId={post.id} postSlug={post.slug} />
            </section>
          </div>

          {/* Sidebar — sticks in place while the article scrolls past it */}
          <aside className="space-y-8 self-start lg:sticky lg:top-28 lg:border-l lg:border-stem-grey/50 lg:pl-8">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-berry-bloom mb-1">By</p>
              <p className="font-bold text-blueberry">{post.author}</p>
              <p className="text-sm text-berry-bloom mt-1 mb-3">{formatDate(post.published_at)}</p>
              <a
                href="#comments"
                className="inline-flex items-center gap-1.5 text-sm text-berry-bloom hover:text-berry-bloom transition-colors"
              >
                <svg className="w-4 h-4 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="1.8" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                {comments?.length || 0} comment{comments?.length === 1 ? "" : "s"}
              </a>
            </div>

            {post.tags?.length > 0 && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-berry-bloom mb-3">Tags</p>
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <Link
                      key={tag}
                      href={`/blog?tag=${encodeURIComponent(tag)}`}
                      className="rounded-full bg-plate-white px-3 py-1 text-xs font-medium text-berry-bloom transition-colors hover:bg-berry-bloom/10 hover:text-berry-bloom"
                    >
                      {tag}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-berry-bloom mb-3">Share</p>
              <ShareLinks url={`${BASE_URL}/blog/${post.slug}`} title={post.title} />
            </div>
          </aside>
        </div>
      </article>
    </div>
  );
}
