import Link from "next/link";

const Footer = () => {
  return (
    <footer className="bg-alusea-gold text-white pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 items-start mb-16">
          {/* Brand Section */}
          <div className="space-y-8">
            <h2 className="text-[32px] md:text-[42px] font-bold tracking-tight">
              ALU - SEA
            </h2>
            <div className="flex gap-4">
              {[
                {
                  icon: (
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                    </svg>
                  ),
                  href: "#"
                },
                {
                  icon: (
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M12 2.04c-5.5 0-10 4.49-10 10.02 0 5 3.66 9.15 8.44 9.9v-7h-2.54V12.02h2.54V9.41c0-2.51 1.49-3.89 3.77-3.89 1.09 0 2.23.19 2.23.19v2.47h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.45 2.89h-2.33v7a10 10 0 008.44-9.9c0-5.53-4.5-10.02-10-10.02z" />
                    </svg>
                  ),
                  href: "#"
                },
                {
                  icon: (
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 01-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 017.8 2m-.2 2A3.6 3.6 0 004 7.6v8.8A3.6 3.6 0 007.6 20h8.8a3.6 3.6 0 003.6-3.6V7.6A3.6 3.6 0 0016.4 4H7.6m9.65 1.5a1.25 1.25 0 011.25 1.25A1.25 1.25 0 0117.25 8 1.25 1.25 0 0116 6.75a1.25 1.25 0 011.25-1.25M12 7a5 5 0 015 5 5 5 0 01-5 5 5 5 0 01-5-5 5 5 0 015-5m0 2a3 3 0 00-3 3 3 3 0 003 3 3 3 0 003-3 3 3 0 00-3-3z" />
                    </svg>
                  ),
                  href: "https://www.instagram.com/alusea_aluminum/"
                },
                {
                  icon: (
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M19 3a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h14m-.5 15.5v-5.3a3.26 3.26 0 00-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 011.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 001.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 00-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
                    </svg>
                  ),
                  href: "#"
                }
              ].map((social, idx) => (
                <Link
                  key={idx}
                  href={social.href}
                  target={social.href !== "#" ? "_blank" : undefined}
                  rel={social.href !== "#" ? "noopener noreferrer" : undefined}
                  className="w-12 h-12 rounded-full border border-white flex items-center justify-center hover:bg-white hover:text-alusea-gold transition-all duration-300 cursor-pointer"
                >
                  {social.icon}
                </Link>
              ))}
            </div>
          </div>

          {/* Our Links */}
          <div className="pt-2">
            <h4 className="font-bold mb-8 text-[18px]">Our Links</h4>
            <ul className="space-y-4 text-[15px] font-medium opacity-90">
              <li><Link href="/products" className="hover:opacity-100 transition-opacity">Our Products</Link></li>
              <li><Link href="/team" className="hover:opacity-100 transition-opacity">Team Member</Link></li>
              <li><Link href="/careers" className="hover:opacity-100 transition-opacity">Our Careers</Link></li>
              <li><Link href="/contact" className="hover:opacity-100 transition-opacity">Contact Us</Link></li>
            </ul>
          </div>

          {/* Find It Fast */}
          <div className="pt-2">
            <h4 className="font-bold mb-8 text-[18px]">Find It Fast</h4>
            <ul className="space-y-4 text-[15px] font-medium opacity-90">
              <li><Link href="/" className="hover:opacity-100 transition-opacity">Home</Link></li>
              <li><Link href="/services" className="hover:opacity-100 transition-opacity">Services</Link></li>
              <li><Link href="/about" className="hover:opacity-100 transition-opacity">About Us</Link></li>
              <li><Link href="/projects" className="hover:opacity-100 transition-opacity">Project Gallery</Link></li>
            </ul>
          </div>

          {/* Contact Details */}
          <div className="pt-2 space-y-4 text-[16px] md:text-[18px] font-medium opacity-90">
            <p>aluseacbe@gmail.com</p>
            <a href="https://wa.me/919626022722" target="_blank" rel="noopener noreferrer" className="hover:underline">96260 22722</a>
            <p className="leading-tight">
              No 178, A Ramachandra Road<br />
              RS Puram, Near Flower Market<br />
              Coimbatore, Tamil Nadu - 641002
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/30 flex flex-col md:flex-row justify-between items-center gap-6 text-[14px] md:text-[15px] font-medium">
          <p>With Love -{" "}
            <a
              href="https://xlevelsup.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline font-bold"
            >
              XLEVELSUP
            </a>{" "}
            ❤️
          </p>
          <div className="flex gap-8">
            <Link href="/about" className="hover:underline">About</Link>
            <Link href="/contact" className="hover:underline">Contact</Link>
            <Link href="/careers" className="hover:underline">Careers</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

