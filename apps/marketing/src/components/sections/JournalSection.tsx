import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const formatDate = (date: string | null) =>
  date ? new Date(date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "";

/** The three newest blog articles, shown as a short reading list. */
const JournalSection = async () => {
  const supabase = await createClient();
  const { data: posts } = await supabase
    .from("blog_posts")
    .select("slug, title, featured_image_url, featured_image_alt, category, published_at")
    .order("published_at", { ascending: false })
    .limit(3);

  // With nothing published yet the section is left out, not shown empty.
  if (!posts?.length) return null;

  return (
    <section className="section bg-plate-white">
      <div className="shell">
        <div className="reveal flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="eyebrow">The Alusea Journal</p>
            <h2 className="h-section mt-5 text-blueberry">Ideas That Let the Light In</h2>
          </div>
          <Link href="/blog" className="link-arrow self-start text-blueberry md:self-auto">
            View All Articles <span aria-hidden="true">→</span>
          </Link>
        </div>

        <ul className="mt-14 grid gap-x-8 gap-y-12 md:grid-cols-3">
          {posts.map((post) => (
            <li key={post.slug} className="reveal">
              <Link href={`/blog/${post.slug}`} className="group block">
                <div className="media aspect-[3/2]">
                  <Image
                    src={post.featured_image_url}
                    alt={post.featured_image_alt}
                    fill
                    sizes="(max-width: 768px) 92vw, 30vw"
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                </div>
                <p className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-berry-bloom">
                  <span className="font-semibold uppercase tracking-[0.18em]">{post.category}</span>
                  <span>{formatDate(post.published_at)}</span>
                </p>
                <h3 className="font-display mt-2 text-xl font-normal leading-snug text-blueberry transition-colors group-hover:text-berry-bloom md:text-2xl">{post.title}</h3>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default JournalSection;
