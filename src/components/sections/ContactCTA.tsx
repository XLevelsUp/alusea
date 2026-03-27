"use client";

import React, { useState } from 'react';

const GOOGLE_SCRIPT_URL =
  process.env.NEXT_PUBLIC_GOOGLE_SCRIPT_URL || "";

type FormData = {
  firstName: string;
  email: string;
  phone: string;
  message: string;
};

const initialForm: FormData = {
  firstName: "",
  email: "",
  phone: "",
  message: "",
};

const ContactCTA = () => {
  const [form, setForm] = useState<FormData>(initialForm);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");

    try {
      const payload = {
        ...form,
        submittedAt: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
        status: "Draft",
      };

      if (GOOGLE_SCRIPT_URL) {
        await fetch(GOOGLE_SCRIPT_URL, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      // Track B2B Intent: Request a Quote Lead Generation
      if (typeof window !== "undefined" && (window as any).dataLayer) {
        (window as any).dataLayer.push({
          event: "generate_lead",
          lead_type: "quote_request",
          form_name: "Contact CTA"
        });
      }

      setStatus("success");
      setForm(initialForm);
    } catch {
      setStatus("error");
    }
  };

  return (
    <section id="contact" className="relative py-28 overflow-hidden bg-matte-black group">
      {/* Top Golden Bar */}
      <div className="absolute top-0 left-0 w-full h-[8px] bg-alusea-gold z-20" />

      {/* Background image with dark overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&q=80&w=2000"
          alt="Modern Interior"
          className="w-full h-full object-cover transition-transform duration-[10000ms] group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-black/75" />
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-32 items-center">

          {/* Left: Form */}
          <div className="space-y-10">
            <h2 className="text-[42px] md:text-[52px] font-bold text-white tracking-tight leading-tight">
              Get A Free Quote
            </h2>

            {status === "success" ? (
              <div className="flex flex-col items-start gap-5">
                <div className="w-16 h-16 rounded-full bg-alusea-gold/20 border-2 border-alusea-gold flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-8 h-8 text-alusea-gold fill-none stroke-current" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="text-white text-xl font-bold mb-1">We&apos;ve got your request!</p>
                  <p className="text-white/55 text-base">
                    Our team will contact you within <span className="text-alusea-gold font-semibold">24 hours</span>.
                  </p>
                </div>
                <button
                  onClick={() => setStatus("idle")}
                  className="text-alusea-gold text-sm font-semibold underline underline-offset-4 hover:text-white transition-colors"
                >
                  Submit another request
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <input
                    type="text"
                    name="firstName"
                    value={form.firstName}
                    onChange={handleChange}
                    placeholder="First Name"
                    required
                    className="w-full bg-white rounded-full px-8 py-5 text-matte-black outline-none focus:ring-2 focus:ring-alusea-gold/50 transition-all font-medium placeholder:text-gray-400 border-none"
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="Your Email"
                      required
                      className="w-full bg-white rounded-full px-8 py-5 text-matte-black outline-none focus:ring-2 focus:ring-alusea-gold/50 transition-all font-medium placeholder:text-gray-400 border-none"
                    />
                    <input
                      type="tel"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="Phone Number"
                      required
                      className="w-full bg-white rounded-full px-8 py-5 text-matte-black outline-none focus:ring-2 focus:ring-alusea-gold/50 transition-all font-medium placeholder:text-gray-400 border-none"
                    />
                  </div>

                  <textarea
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    placeholder="Your Message"
                    rows={4}
                    className="w-full bg-white rounded-[2.5rem] px-8 py-6 text-matte-black outline-none focus:ring-2 focus:ring-alusea-gold/50 transition-all font-medium placeholder:text-gray-400 resize-none border-none"
                  />
                </div>

                {status === "error" && (
                  <p className="text-red-400 text-sm">Something went wrong. Please try again.</p>
                )}

                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="inline-flex items-center gap-3 bg-alusea-gold hover:bg-[#A67C52] text-white px-16 py-4 rounded-xl font-bold text-lg transition-all shadow-xl active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {status === "loading" ? (
                    <>
                      <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Sending…
                    </>
                  ) : (
                    "Send"
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Right: Social Media */}
          <div className="space-y-12 lg:pl-10 text-center lg:text-left">
            <h3 className="text-[32px] md:text-[42px] font-bold text-white tracking-tight leading-tight">
              Our Social Media Links
            </h3>

            <div className="flex flex-wrap justify-center lg:justify-start gap-6 md:gap-8">
              {[
                {
                  icon: (
                    <svg className="w-8 h-8 md:w-12 md:h-12 fill-current" viewBox="0 0 24 24">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                    </svg>
                  ),
                  url: '#'
                },
                {
                  icon: (
                    <svg className="w-8 h-8 md:w-12 md:h-12 fill-current" viewBox="0 0 24 24">
                      <path d="M12 2.04c-5.5 0-10 4.49-10 10.02 0 5 3.66 9.15 8.44 9.9v-7h-2.54V12.02h2.54V9.41c0-2.51 1.49-3.89 3.77-3.89 1.09 0 2.23.19 2.23.19v2.47h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.45 2.89h-2.33v7a10 10 0 008.44-9.9c0-5.53-4.5-10.02-10-10.02z" />
                    </svg>
                  ),
                  url: '#'
                },
                {
                  icon: (
                    <svg className="w-8 h-8 md:w-11 md:h-11 fill-current" viewBox="0 0 24 24">
                      <path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 01-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 017.8 2m-.2 2A3.6 3.6 0 004 7.6v8.8A3.6 3.6 0 007.6 20h8.8a3.6 3.6 0 003.6-3.6V7.6A3.6 3.6 0 0016.4 4H7.6m9.65 1.5a1.25 1.25 0 011.25 1.25A1.25 1.25 0 0117.25 8 1.25 1.25 0 0116 6.75a1.25 1.25 0 011.25-1.25M12 7a5 5 0 015 5 5 5 0 01-5 5 5 5 0 01-5-5 5 5 0 015-5m0 2a3 3 0 00-3 3 3 3 0 003 3 3 3 0 003-3 3 3 0 00-3-3z" />
                    </svg>
                  ),
                  url: 'https://www.instagram.com/alusea_aluminum/'
                },
                {
                  icon: (
                    <svg className="w-8 h-8 md:w-11 md:h-11 fill-current" viewBox="0 0 24 24">
                      <path d="M19 3a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h14m-.5 15.5v-5.3a3.26 3.26 0 00-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 011.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 001.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 00-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
                    </svg>
                  ),
                  url: '#'
                }
              ].map((social, idx) => (
                <a
                  key={idx}
                  href={social.url}
                  target={social.url !== "#" ? "_blank" : undefined}
                  rel={social.url !== "#" ? "noopener noreferrer" : undefined}
                  className="w-20 h-20 md:w-28 md:h-28 bg-white rounded-full flex items-center justify-center text-alusea-gold hover:bg-alusea-gold hover:text-white transition-all duration-300 shadow-2xl hover:-translate-y-2"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Golden Bar */}
      <div className="absolute bottom-0 left-0 w-full h-[8px] bg-alusea-gold z-20" />
    </section>
  );
};

export default ContactCTA;
