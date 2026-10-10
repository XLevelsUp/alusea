import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import SpaceScroller from "@/components/sections/SpaceScroller";
import SpaceVisual from "@/components/ui/SpaceVisual";
import { CONSULTATION_HREF } from "@/lib/site";
import { SPACES, getSpace } from "@/lib/spaces";

type PageProps = { params: Promise<{ slug: string }> };

export const generateStaticParams = () => SPACES.map((space) => ({ slug: space.slug }));

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const space = getSpace(slug);
  if (!space) return {};

  return {
    title: `${space.name} Aluminium Windows & Doors`,
    description: `${space.line} Explore Alusea aluminium windows and doors for the ${space.name.toLowerCase()}.`,
    alternates: { canonical: `/spaces/${space.slug}` },
  };
}

export default async function SpacePage({ params }: PageProps) {
  const { slug } = await params;
  const space = getSpace(slug);
  if (!space) notFound();

  const otherSpaces = SPACES.filter((other) => other.slug !== space.slug);
  const roomAlt = (name: string) => `${name} with Alusea aluminium windows and doors`;
  const products = space.products ?? [];

  return (
    <div className="bg-plate-white">
      {/* The room's own photograph fills the top of the page, with its name set over it. */}
      <header className="relative flex h-[82svh] min-h-[34rem] items-end overflow-hidden bg-blueberry">
        <SpaceVisual image={space.image} drawing={space.drawing} alt={roomAlt(space.name)} sizes="100vw" priority />
        {/* Shade at the top keeps the menu readable; shade at the foot keeps the room's name readable. */}
        <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(to_bottom,rgb(0_0_0/0.5)_0%,transparent_26%,transparent_48%,rgb(0_0_0/0.62)_100%)]" />
        <div className="shell relative pb-[clamp(7rem,13vw,11rem)]">
          <p className="eyebrow on-dark">Design by Space</p>
          <h1 className="h-display mt-5 text-white [text-shadow:0_2px_24px_rgb(0_0_0/0.35)]">{space.name}</h1>
        </div>
      </header>

      {/* A frosted panel rides up over the foot of the photograph and carries the room's introduction. */}
      <div className="shell relative -mt-[clamp(4.5rem,8vw,7rem)]">
        <div className="reveal swatch-shadow rounded-card border border-white/60 bg-white/70 px-7 py-9 backdrop-blur-2xl backdrop-saturate-150 md:px-14 md:py-12">
          <p className="font-display mx-auto max-w-4xl text-center text-2xl font-light leading-snug text-blueberry md:text-[2rem] md:leading-[1.3]">{space.line}</p>
        </div>
      </div>

      {products.length > 0 && (
        <section className="section">
          <div className="shell">
            <h2 className="h-section reveal text-blueberry">Windows and Doors for the {space.name}</h2>
            <ol className="mt-14 space-y-[clamp(3.5rem,8vw,7rem)]">
              {products.map((product, index) => (
                <li key={product.name} className="reveal grid items-center gap-8 lg:grid-cols-12 lg:gap-16">
                  {product.image && (
                    // The picture swaps sides on every other row, so the page reads as a spread and not a list.
                    <div className={`media aspect-[4/3] lg:col-span-7 ${index % 2 === 1 ? "lg:order-2" : ""}`}>
                      <Image src={product.image} alt={`${product.name} in a ${space.name.toLowerCase()}`} fill loading="eager" sizes="(max-width: 1024px) 92vw, 56vw" className="object-cover" />
                    </div>
                  )}
                  <div className={product.image ? "lg:col-span-5" : "lg:col-span-12"}>
                    <span aria-hidden="true" className="font-display block text-sm tabular-nums text-berry-bloom">{String(index + 1).padStart(2, "0")}</span>
                    <h3 className="font-display mt-4 text-3xl font-normal leading-tight text-blueberry md:text-[2.5rem]">{product.name}</h3>
                    <p className="lede mt-4 border-t border-stem-grey/50 pt-4 text-berry-bloom">{product.line}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}

      <SpaceScroller spaces={otherSpaces} heading="Explore Other Spaces" />

      <section className="section window-grid bg-blueberry text-white">
        <div className="shell grid gap-8 lg:grid-cols-12 lg:items-end lg:gap-20">
          <h2 className="h-section text-white lg:col-span-7">Planning Your {space.name}?</h2>
          <div className="lg:col-span-5">
            <p className="lede text-plate-white">Tell us about the room and we will suggest the frames, glass and finish that fit it.</p>
            <Link href={CONSULTATION_HREF} className="btn btn-light mt-8">
              Book a Consultation
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
