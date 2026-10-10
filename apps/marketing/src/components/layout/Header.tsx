"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarCheck, ChevronDown, Download, MapPin, Menu, Phone, X } from "lucide-react";
import { BROCHURE_FILENAME, BROCHURE_HREF, CONSULTATION_HREF, PHONE_DISPLAY, PHONE_HREF, SHOWROOM_MAP_URL } from "@/lib/site";
import { SPACES } from "@/lib/spaces";

const NAV_LINKS = [
  { name: "Who We Are", href: "/about" },
  { name: "Our Collection", href: "/catalogue" },
  { name: "The Alusea Difference", href: "/alusea-difference" },
  { name: "Blog", href: "/blog" },
  { name: "Careers", href: "/careers" },
  { name: "Contact Us", href: "/contact" },
];

const COLLECTION_HREF = "/catalogue";
// On wide screens the contact link is shown as a phone icon, to leave room for the other links.
const CONTACT_HREF = "/contact";

// The two ways into the collection, shown in the menu under "Our Collection".
const PRODUCT_LINKS = [
  { name: "All Products", href: "/catalogue" },
  { name: "Windows", href: "/catalogue?category=Windows" },
  { name: "Doors", href: "/catalogue?category=Doors" },
  { name: "Sliding Systems", href: "/catalogue?category=Sliding%20Systems" },
  { name: "Specialty", href: "/catalogue?category=Specialty" },
];
const SPACE_LINKS = SPACES.map((space) => ({ name: space.name, href: `/spaces/${space.slug}` }));

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollectionOpen, setIsCollectionOpen] = useState(false);
  const [isMobileCollectionOpen, setIsMobileCollectionOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // The page behind must not scroll while the full-screen menu is open.
  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  // Escape closes the collection menu, as it would any menu.
  useEffect(() => {
    if (!isCollectionOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsCollectionOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isCollectionOpen]);

  if (pathname?.startsWith("/admin")) return null;

  const isHome = pathname === "/";
  // At the top of the home page the header is see-through and sits on the film; everywhere else it is a solid bar.
  // The room pages open on a full photograph too, so the header is see-through there as well.
  const overVideo = (isHome || pathname === "/alusea-difference" || pathname === "/about" || !!pathname?.startsWith("/spaces/")) && !isScrolled && !isMobileMenuOpen && !isCollectionOpen;
  // The room pages belong to the collection, so they light up "Our Collection" too.
  const isCurrent = (href: string) =>
    pathname === href || pathname?.startsWith(`${href}/`) || (href === COLLECTION_HREF && !!pathname?.startsWith("/spaces"));
  const closeMenu = () => {
    setIsMobileMenuOpen(false);
    setIsMobileCollectionOpen(false);
  };
  const closeCollection = () => setIsCollectionOpen(false);
  const navLink = (href: string) =>
    `relative flex items-center gap-1.5 whitespace-nowrap py-2 text-[15px] font-medium transition-colors xl:text-[17px] after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:origin-left after:transition-transform after:duration-300 hover:after:scale-x-100 ${
      overVideo
        ? "text-white after:scale-x-0 after:bg-white"
        : isCurrent(href)
          ? "text-berry-bloom after:scale-x-100 after:bg-berry-bloom"
          : "text-blueberry after:scale-x-0 after:bg-berry-bloom hover:text-berry-bloom"
    }`;

  const pill = `flex items-center gap-2 rounded-full border px-4 py-1.5 text-[13px] font-medium transition-colors duration-300 ${
    overVideo
      ? "border-white/40 bg-black/25 text-white backdrop-blur-sm hover:bg-black/45"
      : "border-stem-grey/60 text-blueberry hover:border-blueberry hover:bg-blueberry hover:text-white"
  }`;
  const iconButton = `p-2.5 transition-colors ${overVideo ? "text-white hover:text-plate-white/80" : "text-blueberry hover:text-berry-bloom"}`;

  return (
    // On the home page the film plays full-screen first and the header fades in over it a moment later.
    <header className={`fixed top-0 z-50 w-full ${isHome ? "header-reveal" : ""}`} onMouseLeave={closeCollection}>
      <div aria-hidden="true" className={`absolute inset-0 -z-10 transition-opacity duration-300 ${isMobileMenuOpen ? "bg-plate-white" : "header-glass"} ${overVideo ? "opacity-0" : "opacity-100"}`} />
      <div className={`gutter flex items-center justify-between gap-6 ${overVideo ? "[text-shadow:0_1px_8px_rgb(0_0_0/0.45)]" : ""}`}>
        <Link href="/" aria-label="Alusea home" className="flex shrink-0 items-center">
          {overVideo ? (
            <Image src="/images/alusea-logo-white.svg" alt="Alusea" width={350} height={192} priority className="h-16 w-auto lg:h-24" />
          ) : (
            <Image
              src="/images/alusea-logo-dark.svg"
              alt="Alusea"
              width={350}
              height={192}
              priority
              className={`h-16 w-auto transition-[height] duration-300 ${isScrolled ? "lg:h-16" : "lg:h-24"}`}
            />
          )}
        </Link>

        {/* Desktop: quick actions above, page links below, both set to the right. */}
        <div className="hidden flex-col items-end lg:flex">
          <div
            className={`flex items-center gap-3 overflow-hidden transition-all duration-300 ${isScrolled ? "max-h-0 opacity-0" : "max-h-12 pt-2 opacity-100"}`}
            // Folded links must not be reachable by keyboard while they cannot be seen.
            inert={isScrolled}
          >
            <Link href={CONSULTATION_HREF} className={pill}>
              <CalendarCheck aria-hidden="true" className="size-4" />
              Book a Consultation
            </Link>
            <a href={SHOWROOM_MAP_URL} target="_blank" rel="noopener noreferrer" className={pill}>
              <MapPin aria-hidden="true" className="size-4" />
              Locate Us
            </a>
            <a href={BROCHURE_HREF} download={BROCHURE_FILENAME} className={pill}>
              <Download aria-hidden="true" className="size-4" />
              Download Brochure
            </a>
            <a href={PHONE_HREF} aria-label={`Call Alusea on ${PHONE_DISPLAY}`} className={pill}>
              <Phone aria-hidden="true" className="size-4" />
              Call Us
            </a>
          </div>

          <nav aria-label="Main" className="flex h-16 items-center gap-4 xl:gap-5 2xl:gap-10">
            {NAV_LINKS.map((link) =>
              link.href === COLLECTION_HREF ? (
                <button
                  key={link.href}
                  type="button"
                  aria-expanded={isCollectionOpen}
                  aria-controls="collection-menu"
                  onMouseEnter={() => setIsCollectionOpen(true)}
                  onClick={() => setIsCollectionOpen(true)}
                  className={navLink(link.href)}
                >
                  {link.name}
                  <ChevronDown aria-hidden="true" className={`size-4 transition-transform duration-300 ${isCollectionOpen ? "rotate-180" : ""}`} />
                </button>
              ) : (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={isCurrent(link.href) ? "page" : undefined}
                  onMouseEnter={closeCollection}
                  aria-label={link.href === CONTACT_HREF ? link.name : undefined}
                  title={link.href === CONTACT_HREF ? link.name : undefined}
                  className={navLink(link.href)}
                >
                  {link.href === CONTACT_HREF ? <Phone aria-hidden="true" className="size-5" /> : link.name}
                </Link>
              )
            )}
            {/* Once the quick actions fold away, the two main ones stay within reach here. */}
            {isScrolled && (
              <>
                <a
                  href={BROCHURE_HREF}
                  download={BROCHURE_FILENAME}
                  aria-label="Download Brochure"
                  className="flex items-center gap-2 whitespace-nowrap rounded-full border border-blueberry p-2.5 text-[13px] font-semibold text-blueberry transition-colors duration-300 hover:bg-blueberry hover:text-white xl:px-5"
                >
                  <Download aria-hidden="true" className="size-4" />
                  {/* Narrow laptops keep the icon alone so the row still fits. */}
                  <span className="hidden xl:inline">Download Brochure</span>
                </a>
                <Link
                  href={CONSULTATION_HREF}
                  className="whitespace-nowrap rounded-full bg-blueberry px-5 py-2.5 text-[13px] font-semibold text-white transition-colors duration-300 hover:bg-berry-bloom"
                >
                  Book a Consultation
                </Link>
              </>
            )}
          </nav>
        </div>

        {/* Phones and tablets: call and menu. */}
        <div className="flex items-center gap-1 lg:hidden">
          <a href={PHONE_HREF} aria-label={`Call Alusea on ${PHONE_DISPLAY}`} className={iconButton}>
            <Phone aria-hidden="true" className="size-5" />
          </a>
          <button
            type="button"
            className={iconButton}
            aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={isMobileMenuOpen}
            onClick={() => setIsMobileMenuOpen((open) => !open)}
          >
            {isMobileMenuOpen ? <X aria-hidden="true" className="size-7" /> : <Menu aria-hidden="true" className="size-7" />}
          </button>
        </div>
      </div>

      {/* Collection menu: two ways in, by product and by room. */}
      {isCollectionOpen && (
        <div id="collection-menu" className="menu-in swatch-shadow absolute inset-x-0 top-full hidden border-t border-stem-grey/40 bg-plate-white lg:block">
          <div className="shell grid grid-cols-12 gap-16 py-12">
            <div className="col-span-4">
              <p className="eyebrow">By Product</p>
              <ul className="mt-6 border-t border-stem-grey/50">
                {PRODUCT_LINKS.map((item) => (
                  <li key={item.href} className="border-b border-stem-grey/50">
                    <Link href={item.href} onClick={closeCollection} className="group flex items-center justify-between py-3.5 font-display text-xl text-blueberry transition-colors hover:text-berry-bloom">
                      {item.name}
                      <span aria-hidden="true" className="text-berry-bloom opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100">→</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="col-span-8">
              <p className="eyebrow">By Space</p>
              <ul className="mt-6 grid grid-cols-2 gap-x-12 border-t border-stem-grey/50">
                {SPACE_LINKS.map((item) => (
                  <li key={item.href} className="border-b border-stem-grey/50">
                    <Link href={item.href} onClick={closeCollection} className="group flex items-center justify-between py-3.5 font-display text-xl text-blueberry transition-colors hover:text-berry-bloom">
                      {item.name}
                      <span aria-hidden="true" className="text-berry-bloom opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100">→</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Full-screen menu for phones and tablets: every link and every action in one place. */}
      {isMobileMenuOpen && (
        <div className="sheet-in fixed inset-x-0 bottom-0 top-16 overflow-y-auto bg-plate-white lg:hidden">
          <nav aria-label="Main" className="flex flex-col px-6 pt-4">
            {NAV_LINKS.map((link, index) => {
              const rowClass = `sheet-item-in flex items-center justify-between border-b border-stem-grey/50 py-5 text-left font-display text-2xl transition-colors hover:text-berry-bloom ${
                isCurrent(link.href) ? "text-berry-bloom" : "text-blueberry"
              }`;
              const rowStyle = { animationDelay: `${80 + index * 60}ms` };
              if (link.href !== COLLECTION_HREF) {
                return (
                  <Link key={link.href} href={link.href} aria-current={isCurrent(link.href) ? "page" : undefined} onClick={closeMenu} style={rowStyle} className={rowClass}>
                    {link.name}
                  </Link>
                );
              }
              return (
                <div key={link.href} className="contents">
                  <button type="button" aria-expanded={isMobileCollectionOpen} onClick={() => setIsMobileCollectionOpen((open) => !open)} style={rowStyle} className={rowClass}>
                    {link.name}
                    <ChevronDown aria-hidden="true" className={`size-6 transition-transform duration-300 ${isMobileCollectionOpen ? "rotate-180" : ""}`} />
                  </button>
                  {isMobileCollectionOpen && (
                    <div className="sheet-in grid grid-cols-2 gap-x-6 border-b border-stem-grey/50 py-5">
                      {[
                        { title: "By Product", items: PRODUCT_LINKS },
                        { title: "By Space", items: SPACE_LINKS },
                      ].map((group) => (
                        <div key={group.title}>
                          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-berry-bloom">{group.title}</p>
                          <ul className="mt-2">
                            {group.items.map((item) => (
                              <li key={item.href}>
                                <Link href={item.href} onClick={closeMenu} className="flex min-h-11 items-center text-base text-blueberry">
                                  {item.name}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          <div className="sheet-item-in flex flex-col gap-3 px-6 py-8" style={{ animationDelay: "400ms" }}>
            <Link
              href={CONSULTATION_HREF}
              onClick={closeMenu}
              className="w-full rounded-card bg-blueberry py-4 text-center text-sm font-bold uppercase tracking-widest text-white transition-colors hover:bg-berry-bloom"
            >
              Book a Consultation
            </Link>
            <a
              href={SHOWROOM_MAP_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={closeMenu}
              className="flex w-full items-center justify-center gap-2 rounded-card border border-blueberry py-4 text-sm font-bold uppercase tracking-widest text-blueberry transition-colors hover:bg-blueberry hover:text-white"
            >
              <MapPin aria-hidden="true" className="size-4" />
              Locate Us
            </a>
            <a
              href={BROCHURE_HREF}
              download={BROCHURE_FILENAME}
              onClick={closeMenu}
              className="flex w-full items-center justify-center gap-2 rounded-card border border-blueberry py-4 text-sm font-bold uppercase tracking-widest text-blueberry transition-colors hover:bg-blueberry hover:text-white"
            >
              <Download aria-hidden="true" className="size-4" />
              Download Brochure
            </a>
            <a
              href={PHONE_HREF}
              onClick={closeMenu}
              className="flex w-full items-center justify-center gap-2 rounded-card border border-blueberry py-4 text-sm font-bold uppercase tracking-widest text-blueberry transition-colors hover:bg-blueberry hover:text-white"
            >
              <Phone aria-hidden="true" className="size-4" />
              Call Us · {PHONE_DISPLAY}
            </a>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
