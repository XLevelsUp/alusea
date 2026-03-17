"use client";

const ContactCTA = () => {
  return (
    <section id="contact" className="relative py-32 overflow-hidden bg-matte-black">
      {/* Background image overlay */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <img 
          src="https://images.unsplash.com/photo-1541746972996-4e0b0f43e02a?auto=format&fit=crop&q=80&w=2000" 
          alt="Office background"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-matte-black/60" />
      </div>

      <div className="max-container relative z-10 px-6">
        <div className="bg-white p-12 md:p-24 rounded-sm shadow-2xl overflow-hidden relative">
          {/* Decorative element */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-brushed-bronze transform translate-x-16 -translate-y-16 rotate-45" />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <h2 className="text-brushed-bronze text-sm uppercase tracking-[0.3em] font-bold">Get In Touch</h2>
                <p className="text-4xl md:text-5xl font-bold text-matte-black leading-tight">
                  Ready to Elevate <br />
                  <span className="italic">Your Project?</span>
                </p>
              </div>
              <p className="text-steel-gray text-lg font-light leading-relaxed">
                Consult with our experts to find the perfect aluminium solutions tailored to your architectural requirements.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-6 pt-4">
                <button className="px-10 py-5 bg-brushed-bronze text-white text-sm uppercase tracking-widest font-bold rounded-sm hover:bg-bronze-light transition-all shadow-xl">
                  Schedule Consultation
                </button>
                <div className="flex items-center space-x-4 px-2">
                  <div className="w-12 h-12 rounded-full border border-gray-100 flex items-center justify-center text-brushed-bronze">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6.62,10.79C8.06,13.62 10.38,15.94 13.21,17.38L15.41,15.18C15.68,14.91 16.08,14.82 16.43,14.93C17.55,15.3 18.75,15.5 20,15.5A1,1 0 0,1 21,16.5V20A1,1 0 0,1 20,21A17,17 0 0,1 3,4A1,1 0 0,1 4,3H7.5A1,1 0 0,1 8.5,4C8.5,5.25 8.7,6.45 9.07,7.57C9.18,7.92 9.1,8.31 8.82,8.58L6.62,10.79Z" />
                    </svg>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase tracking-widest font-bold text-steel-gray">Talk to us</span>
                    <span className="text-matte-black font-bold">+971 4 123 4567</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-aluminum-light p-10 rounded-sm">
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-matte-black">Full Name</label>
                    <input type="text" placeholder="John Doe" className="w-full bg-white px-6 py-4 text-sm border-none focus:ring-2 focus:ring-brushed-bronze outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-matte-black">Email Address</label>
                    <input type="email" placeholder="john@example.com" className="w-full bg-white px-6 py-4 text-sm border-none focus:ring-2 focus:ring-brushed-bronze outline-none" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-matte-black">Project Type</label>
                  <select className="w-full bg-white px-6 py-4 text-sm border-none focus:ring-2 focus:ring-brushed-bronze outline-none appearance-none">
                    <option>Residential Villa</option>
                    <option>Commercial Development</option>
                    <option>Renovation</option>
                    <option>Other</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-matte-black">Message</label>
                  <textarea rows={4} placeholder="Tell us about your project..." className="w-full bg-white px-6 py-4 text-sm border-none focus:ring-2 focus:ring-brushed-bronze outline-none resize-none"></textarea>
                </div>
                <button className="w-full py-5 bg-matte-black text-white text-[12px] uppercase tracking-[0.2em] font-bold hover:bg-architectural-blue transition-all">
                  Send Inquiry
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactCTA;
