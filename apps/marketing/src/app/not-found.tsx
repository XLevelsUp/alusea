import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page Not Found",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <div data-not-found className="relative flex min-h-svh flex-col items-center justify-center bg-plate-white px-6 pb-16 pt-28 text-center">
      {/* The page has no header of its own, so the logo alone leads back home. */}
      <Link href="/" aria-label="Alusea home" className="absolute left-[var(--gutter)] top-5">
        <Image src="/images/alusea-logo-dark.svg" alt="Alusea" width={350} height={192} priority className="h-16 w-auto" />
      </Link>

      <p className="eyebrow">Error 404</p>

      {/* The same arched door as the home page: it stands ajar, and opens onto the way back home. */}
      <div className="reveal door mt-10 w-44 sm:w-52">
        <Link
          href="/"
          aria-label="Back to Home"
          className="door-frame swatch-shadow group block aspect-[3/4] rounded-b-[0.25rem] rounded-t-[999px] bg-gradient-to-b from-stem-grey to-stem-grey-deep p-1.5 lg:p-2"
        >
          <span className="relative block size-full overflow-hidden rounded-t-[999px] bg-stem-grey/30">
            <Image src="/images/spaces/living-room.webp" alt="" fill priority sizes="208px" className="object-cover" />
            <span className="door-caption absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 to-transparent p-4 pt-16">
              <span className="font-display text-lg leading-tight text-white">This way home</span>
            </span>

            {/* The door: a slim aluminium frame around frosted glass, hinged on the left, swinging into the room. */}
            <span aria-hidden="true" className="door-leaf absolute inset-0">
              <span className="door-label absolute inset-0 bg-white/15 backdrop-blur-[5px]" />
              <span className="absolute inset-0 bg-[linear-gradient(115deg,rgb(255_255_255/0.32)_0%,transparent_32%,transparent_62%,rgb(255_255_255/0.14)_100%)]" />
              <span className="absolute inset-0 rounded-t-[999px] border-[6px] border-stem-grey-deep" />
              <span className="absolute right-3 top-[58%] h-12 w-1.5 rounded-full bg-gradient-to-b from-plate-white to-stem-grey shadow-[0_2px_6px_rgb(0_0_0/0.35)]" />
              <span className="door-label font-display absolute inset-x-0 top-[34%] text-center text-5xl font-light tabular-nums text-white [text-shadow:0_1px_10px_rgb(0_0_0/0.45)]">404</span>
            </span>
          </span>
        </Link>
      </div>

      <h1 className="h-section mt-10 max-w-2xl text-blueberry">This Page Doesn&apos;t Exist</h1>
      <p className="lede mt-5 max-w-md text-berry-bloom">
        The page you&apos;re looking for may have been moved or removed.
      </p>

      <div className="mt-9 flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row">
        <Link href="/" className="btn btn-primary w-full sm:w-auto">
          Back to Home
        </Link>
        <a
          href="https://wa.me/919626022722?text=Hello,%20I%20was%20looking%20for%20a%20page%20on%20your%20website."
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-outline w-full sm:w-auto"
        >
          Message Us on WhatsApp
        </a>
      </div>
    </div>
  );
}
