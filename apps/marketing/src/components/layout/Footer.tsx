"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { MapPin } from "lucide-react";
import { SHOWROOM_MAP_URL } from "@/lib/site";

const socials = [
  { label: "Facebook", href: "https://www.facebook.com/people/Alu-Sea/61575357051060/", path: "M14 13.5h2.5l1-3.5H14V7.8c0-.9.2-1.3 1.2-1.3h1.8V3.2c-.3-.1-1.3-.2-2.5-.2-2.5 0-4.3 1.5-4.3 4.4V10H7v3.5h3.2V22h3.8v-8.5z" },
  { label: "Instagram", href: "https://www.instagram.com/alusea_aluminum/", path: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" },
  { label: "X (Twitter)", href: "https://x.com/ALU_SEA", path: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.254 5.622 5.91-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" },
  { label: "LinkedIn", href: "https://www.linkedin.com/company/alu-sea/", path: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452z" },
  { label: "YouTube", href: "https://www.youtube.com/@ALU_SEA", path: "M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" },
  { label: "Reddit", href: "https://www.reddit.com/user/ALU_SEA/", path: "M24 11.5c0-1.65-1.35-3-3-3-.96 0-1.86.48-2.42 1.24-1.64-1-3.75-1.64-5.99-1.72l1.27-3.96 3.48.77c.05.94.84 1.7 1.82 1.7 1.01 0 1.83-.82 1.83-1.83s-.82-1.83-1.83-1.83c-.88 0-1.61.62-1.78 1.44l-3.83-.85c-.24-.05-.47.1-.54.34L11.75 7.03C9.43 7.09 7.24 7.74 5.56 8.76A3.003 3.003 0 0 0 3 11.5c0 1.2.71 2.23 1.73 2.72-.05.25-.08.51-.08.78 0 3.59 4.1 6.5 9.15 6.5 5.05 0 9.15-2.91 9.15-6.5 0-.27-.03-.53-.08-.78 1.02-.49 1.73-1.52 1.73-2.72zM6 13.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5c0 .83-.67 1.5-1.5 1.5S6 14.33 6 13.5zm8.51 4.54c-1.2 1.2-3.82 1.2-5.02 0-.15-.15-.15-.39 0-.54.15-.15.39-.15.54 0 .91.91 3.03.91 3.94 0 .15-.15.39-.15.54 0 .15.15.15.39 0 .54zm-.53-3.04c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" },
];

const linkGroups = [
  {
    title: "Our Links",
    links: [
      { name: "Our Products", href: "/products" },
      { name: "Blog", href: "/blog" },
      { name: "Our Careers", href: "/careers" },
      { name: "Contact Us", href: "/contact" },
    ],
  },
  {
    title: "Find It Fast",
    links: [
      { name: "Home", href: "/" },
      { name: "Services", href: "/services" },
      { name: "About Us", href: "/about" },
    ],
  },
];

const legalLinks = [
  { name: "Privacy Policy", href: "/privacy-policy" },
  { name: "Terms of Service", href: "/terms-of-service" },
  { name: "Data Deletion", href: "/data-deletion" },
];

const footerLink = "text-[15px] text-plate-white transition-colors hover:text-white hover:underline hover:underline-offset-4";
const columnTitle = "text-xs font-semibold uppercase tracking-[0.22em] text-plate-white/70";

const Footer = () => {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) return null;

  return (
    <footer className="window-grid bg-blueberry text-white">
      <div className="shell pb-10 pt-[var(--section-y)]">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-5">
            <Link href="/" aria-label="Alusea home" className="inline-block">
              <Image src="/images/alusea-logo-white.svg" alt="Alusea Logo" width={350} height={192} className="-ml-3 h-24 w-auto md:h-28" />
            </Link>
            <ul className="mt-6 flex flex-wrap gap-3">
              {socials.map((social) => (
                <li key={social.label}>
                  <a
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className="flex size-11 items-center justify-center rounded-full border border-white/40 text-white transition-colors duration-300 hover:bg-white hover:text-blueberry"
                  >
                    <svg aria-hidden="true" className="size-[18px] fill-current" viewBox="0 0 24 24">
                      <path d={social.path} />
                    </svg>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {linkGroups.map((group) => (
            <nav key={group.title} aria-label={group.title} className="lg:col-span-2">
              <h3 className={columnTitle}>{group.title}</h3>
              <ul className="mt-6 space-y-3.5">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className={footerLink}>{link.name}</Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          <address className="space-y-3.5 text-[15px] not-italic leading-relaxed text-plate-white lg:col-span-3">
            <a href="mailto:aluseacbe@gmail.com" className={`block ${footerLink}`}>aluseacbe@gmail.com</a>
            <a href="https://wa.me/919626022722" target="_blank" rel="noopener noreferrer" className={`block ${footerLink}`}>
              96260 22722
            </a>
            <p>
              No 178, A Ramachandra Road<br />
              RS Puram, Near Flower Market<br />
              Coimbatore, Tamil Nadu - 641002
            </p>
            <a
              href={SHOWROOM_MAP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/40 px-4 text-sm font-medium text-white transition-colors duration-300 hover:bg-white hover:text-blueberry"
            >
              <MapPin aria-hidden="true" className="size-4" />
              Open in Maps
            </a>
          </address>
        </div>

        <div className="mt-16 flex flex-col items-start justify-between gap-6 border-t border-white/25 pb-16 pt-8 text-sm text-plate-white md:flex-row md:items-center md:pb-0 md:pr-24">
          <ul className="flex flex-wrap gap-x-8 gap-y-2">
            {legalLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="transition-colors hover:text-white hover:underline hover:underline-offset-4">{link.name}</Link>
              </li>
            ))}
          </ul>
          <p>
            Built With ❤️ By{" "}
            <a href="https://xlevelsup.com/" target="_blank" rel="noopener noreferrer" className="font-semibold text-white hover:underline hover:underline-offset-4">
              XLEVELSUP
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
