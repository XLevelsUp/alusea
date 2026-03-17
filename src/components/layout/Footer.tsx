import Link from "next/link";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-matte-black text-aluminum-light pt-32 pb-12 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-16">
        {/* Brand Section */}
        <div className="space-y-8">
          <Link href="/" className="text-3xl font-bold tracking-tighter">
            ALUSEA<span className="text-brushed-bronze">.</span>
          </Link>
          <p className="text-steel-gray text-base leading-relaxed font-light">
            Defining modern architectural excellence through precision-engineered aluminium solutions. Forged for durability, designed for life.
          </p>
          <div className="flex space-x-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-brushed-bronze hover:border-brushed-bronze transition-all duration-300 cursor-pointer text-white/40 hover:text-white">
                <div className="w-4 h-4 border border-current rounded-[1px]" />
              </div>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div className="pt-2">
          <h4 className="text-white font-bold mb-10 uppercase tracking-[0.2em] text-[11px]">Navigation</h4>
          <ul className="space-y-5 text-[14px] text-steel-gray font-medium">
            <li><Link href="/" className="hover:text-brushed-bronze transition-colors flex items-center gap-2 group"><span className="w-0 group-hover:w-4 h-[1px] bg-brushed-bronze transition-all" /> Home</Link></li>
            <li><Link href="#about" className="hover:text-brushed-bronze transition-colors flex items-center gap-2 group"><span className="w-0 group-hover:w-4 h-[1px] bg-brushed-bronze transition-all" /> About Us</Link></li>
            <li><Link href="#services" className="hover:text-brushed-bronze transition-colors flex items-center gap-2 group"><span className="w-0 group-hover:w-4 h-[1px] bg-brushed-bronze transition-all" /> Services</Link></li>
            <li><Link href="#contact" className="hover:text-brushed-bronze transition-colors flex items-center gap-2 group"><span className="w-0 group-hover:w-4 h-[1px] bg-brushed-bronze transition-all" /> Contact</Link></li>
          </ul>
        </div>

        {/* Products */}
        <div className="pt-2">
          <h4 className="text-white font-bold mb-10 uppercase tracking-[0.2em] text-[11px]">Solutions</h4>
          <ul className="space-y-5 text-[14px] text-steel-gray font-medium">
            <li><Link href="#" className="hover:text-white transition-colors">Sliding Systems</Link></li>
            <li><Link href="#" className="hover:text-white transition-colors">Bi-Fold Enclosures</Link></li>
            <li><Link href="#" className="hover:text-white transition-colors">Thermal Windows</Link></li>
            <li><Link href="#" className="hover:text-white transition-colors">Curtain Walls</Link></li>
          </ul>
        </div>

        {/* Contact info */}
        <div className="pt-2">
          <h4 className="text-white font-bold mb-10 uppercase tracking-[0.2em] text-[11px]">Contact Us</h4>
          <ul className="space-y-6 text-[14px] text-steel-gray font-light">
            <li className="flex items-start space-x-4">
              <svg className="w-5 h-5 text-brushed-bronze shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>123 Architectural District,<br />Business Bay, Dubai, UAE</span>
            </li>
            <li className="flex items-center space-x-4">
              <svg className="w-5 h-5 text-brushed-bronze shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <span>+971 4 123 4567</span>
            </li>
            <li className="flex items-center space-x-4">
              <svg className="w-5 h-5 text-brushed-bronze shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span>contact@alusea.com</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-32 pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center space-y-6 md:space-y-0 text-[12px] text-steel-gray uppercase tracking-widest font-bold">
        <p>© {currentYear} Alusea Global. All rights reserved.</p>
        <div className="flex space-x-10">
          <Link href="#" className="hover:text-white transition-colors">Privacy</Link>
          <Link href="#" className="hover:text-white transition-colors">Terms</Link>
          <Link href="#" className="hover:text-white transition-colors">Cookie Policy</Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

