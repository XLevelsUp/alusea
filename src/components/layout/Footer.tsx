"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const Footer = () => {
  const pathname = usePathname();
  if (pathname?.startsWith('/admin')) return null;

  return (
    <footer className="bg-[#7A5418] text-white pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 items-start mb-16">
          {/* Brand Section */}
          <div className="space-y-8">
            <Link href="/" className="inline-block">
              <Image
                src="/images/alusea-logo.svg"
                alt="Alusea Logo"
                width={300}
                height={108}
                className="brightness-0 invert object-contain h-16 md:h-20 w-auto pr-4"
              />
            </Link>
            <div className="flex flex-wrap gap-3">
              {[
                {
                  label: "Facebook",
                  icon: (
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M14 13.5h2.5l1-3.5H14V7.8c0-.9.2-1.3 1.2-1.3h1.8V3.2c-.3-.1-1.3-.2-2.5-.2-2.5 0-4.3 1.5-4.3 4.4V10H7v3.5h3.2V22h3.8v-8.5z" />
                    </svg>
                  ),
                  href: "https://www.facebook.com/people/Alu-Sea/61575357051060/"
                },
                {
                  label: "Instagram",
                  icon: (
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
                    </svg>
                  ),
                  href: "https://www.instagram.com/alusea_aluminum/"
                },
                {
                  label: "X (Twitter)",
                  icon: (
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.254 5.622 5.91-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  ),
                  href: "https://x.com/ALU_SEA"
                },
                {
                  label: "LinkedIn",
                  icon: (
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452z" />
                    </svg>
                  ),
                  href: "https://www.linkedin.com/company/alu-sea/"
                },
                {
                  label: "YouTube",
                  icon: (
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                    </svg>
                  ),
                  href: "https://www.youtube.com/@ALU_SEA"
                },
                {
                  label: "Reddit",
                  icon: (
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M24 11.5c0-1.65-1.35-3-3-3-.96 0-1.86.48-2.42 1.24-1.64-1-3.75-1.64-5.99-1.72l1.27-3.96 3.48.77c.05.94.84 1.7 1.82 1.7 1.01 0 1.83-.82 1.83-1.83s-.82-1.83-1.83-1.83c-.88 0-1.61.62-1.78 1.44l-3.83-.85c-.24-.05-.47.1-.54.34L11.75 7.03C9.43 7.09 7.24 7.74 5.56 8.76A3.003 3.003 0 0 0 3 11.5c0 1.2.71 2.23 1.73 2.72-.05.25-.08.51-.08.78 0 3.59 4.1 6.5 9.15 6.5 5.05 0 9.15-2.91 9.15-6.5 0-.27-.03-.53-.08-.78 1.02-.49 1.73-1.52 1.73-2.72zM6 13.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5c0 .83-.67 1.5-1.5 1.5S6 14.33 6 13.5zm8.51 4.54c-1.2 1.2-3.82 1.2-5.02 0-.15-.15-.15-.39 0-.54.15-.15.39-.15.54 0 .91.91 3.03.91 3.94 0 .15-.15.39-.15.54 0 .15.15.15.39 0 .54zm-.53-3.04c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
                    </svg>
                  ),
                  href: "https://www.reddit.com/user/ALU_SEA/"
                }
              ].map((social) => (
                <Link
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="w-10 h-10 rounded-full border-2 border-white text-white flex items-center justify-center hover:bg-white hover:text-[#7A5418] transition-all duration-300"
                >
                  {social.icon}
                </Link>
              ))}
            </div>
          </div>

          {/* Our Links */}
          <div className="pt-2">
            {/* FIX: heading is white on dark bg — fine */}
            <h3 className="font-bold mb-8 text-[18px]">Our Links</h3>
            {/* FIX: removed opacity-90, now full opacity for contrast */}
            <ul className="space-y-4 text-[15px] font-medium">
              <li><Link href="/products" className="hover:underline transition-all">Our Products</Link></li>
              <li><Link href="/careers" className="hover:underline transition-all">Our Careers</Link></li>
              <li><Link href="/contact" className="hover:underline transition-all">Contact Us</Link></li>
            </ul>
          </div>

          {/* Find It Fast */}
          <div className="pt-2">
            <h3 className="font-bold mb-8 text-[18px]">Find It Fast</h3>
            {/* FIX: removed opacity-90 */}
            <ul className="space-y-4 text-[15px] font-medium">
              <li><Link href="/" className="hover:underline transition-all">Home</Link></li>
              <li><Link href="/services" className="hover:underline transition-all">Services</Link></li>
              <li><Link href="/about" className="hover:underline transition-all">About Us</Link></li>
              {/* <li><Link href="/projects" className="hover:underline transition-all">Project Gallery</Link></li> */}
            </ul>
          </div>

          {/* Contact Details */}
          {/* FIX: removed opacity-90 */}
          <div className="pt-2 space-y-4 text-[16px] md:text-[18px] font-medium">
            <p>aluseacbe@gmail.com</p>
            <a href="https://wa.me/919626022722" target="_blank" rel="noopener noreferrer" className="hover:underline block">96260 22722</a>
            <p className="leading-tight">
              No 178, A Ramachandra Road<br />
              RS Puram, Near Flower Market<br />
              Coimbatore, Tamil Nadu - 641002
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        {/* FIX: border-white/30 → border-white/50 for better visibility */}
        <div className="pt-8 border-t border-white/50 flex flex-col md:flex-row justify-between items-center gap-6 text-[14px] md:text-[15px] font-medium">
          <div className="flex flex-wrap gap-x-8 gap-y-2">
            <Link href="/privacy-policy" className="hover:underline">Privacy Policy</Link>
            <Link href="/terms-of-service" className="hover:underline">Terms of Service</Link>
            <Link href="/data-deletion" className="hover:underline">Data Deletion</Link>
          </div>
          <p> Built With ❤️ By {" "}
            <a
              href="https://xlevelsup.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline font-bold"
            >
              XLEVELSUP
            </a>{" "}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;