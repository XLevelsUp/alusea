import Link from "next/link";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-matte-black text-aluminum-light pt-20 pb-10 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
        {/* Brand Section */}
        <div className="space-y-6">
          <Link href="/" className="text-2xl font-bold tracking-tighter">
            ALUSEA<span className="text-brushed-bronze">.</span>
          </Link>
          <p className="text-steel-gray text-sm leading-relaxed max-w-xs">
            Premium aluminium solutions for modern architectural excellence. Crafting windows and doors that define spaces.
          </p>
          <div className="flex space-x-4">
            {/* Social Placeholders */}
            <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center hover:bg-brushed-bronze transition-colors cursor-pointer">
              <span className="sr-only">Instagram</span>
              <div className="w-4 h-4 border border-current rounded-sm" />
            </div>
            <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center hover:bg-brushed-bronze transition-colors cursor-pointer">
              <span className="sr-only">LinkedIn</span>
              <div className="w-4 h-4 border border-current rounded-sm" />
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="text-white font-semibold mb-6 uppercase tracking-wider text-xs">Navigation</h4>
          <ul className="space-y-4 text-sm text-steel-gray">
            <li><Link href="/" className="hover:text-brushed-bronze transition-colors">Home</Link></li>
            <li><Link href="/products" className="hover:text-brushed-bronze transition-colors">Products</Link></li>
            <li><Link href="/about" className="hover:text-brushed-bronze transition-colors">About Us</Link></li>
            <li><Link href="/quote" className="hover:text-brushed-bronze transition-colors">Contact</Link></li>
          </ul>
        </div>

        {/* Products */}
        <div>
          <h4 className="text-white font-semibold mb-6 uppercase tracking-wider text-xs">Products</h4>
          <ul className="space-y-4 text-sm text-steel-gray">
            <li><Link href="#" className="hover:text-brushed-bronze transition-colors">Sliding Doors</Link></li>
            <li><Link href="#" className="hover:text-brushed-bronze transition-colors">Bi-Fold Systems</Link></li>
            <li><Link href="#" className="hover:text-brushed-bronze transition-colors">Casement Windows</Link></li>
            <li><Link href="#" className="hover:text-brushed-bronze transition-colors">Curtain Walls</Link></li>
          </ul>
        </div>

        {/* Contact info */}
        <div>
          <h4 className="text-white font-semibold mb-6 uppercase tracking-wider text-xs">Contact Us</h4>
          <ul className="space-y-4 text-sm text-steel-gray">
            <li className="flex items-start space-x-3">
              <svg className="w-5 h-5 text-brushed-bronze mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>123 Architectural Way,<br />Steel City, DXB 5678</span>
            </li>
            <li className="flex items-center space-x-3">
              <svg className="w-5 h-5 text-brushed-bronze" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <span>+1 (555) ALUMINUM</span>
            </li>
            <li className="flex items-center space-x-3">
              <svg className="w-5 h-5 text-brushed-bronze" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span>sales@alusea.com</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-20 pt-8 border-t border-gray-900 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0 text-xs text-steel-gray">
        <p>© {currentYear} Alusea Premium Aluminium Systems. All rights reserved.</p>
        <div className="flex space-x-6">
          <Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link>
          <Link href="#" className="hover:text-white transition-colors">Terms of Service</Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
