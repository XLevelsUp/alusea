"use client";

import React, { useState } from 'react';
import Image from "next/image";

const GOOGLE_SCRIPT_URL = process.env.NEXT_PUBLIC_GOOGLE_SCRIPT_URL || "";

type FormData = {
  firstName: string;
  email: string;
  phone: string;
  message: string;
};

type FormErrors = {
  firstName?: string;
  email?: string;
  phone?: string;
  message?: string;
};

const initialForm: FormData = {
  firstName: "",
  email: "",
  phone: "",
  message: "",
};

const validateField = (name: keyof FormData, value: string): string => {
  switch (name) {
    case "firstName":
      if (!value.trim()) return "Name is required.";
      if (value.trim().length < 2) return "Name must be at least 2 characters.";
      if (!/^[a-zA-Z\s'-]+$/.test(value.trim())) return "Name can only contain letters.";
      return "";
    case "email":
      if (!value.trim()) return "Email is required.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) return "Please enter a valid email address.";
      return "";
    case "phone":
      if (!value.trim()) return "Phone number is required.";
      if (!/^[6-9]\d{9}$/.test(value.replace(/\s/g, ""))) return "Enter a valid 10-digit mobile number.";
      return "";
    case "message":
      if (value.trim() && value.trim().length < 10) return "Message must be at least 10 characters.";
      return "";
    default:
      return "";
  }
};

const ContactCTA = () => {
  const [form, setForm] = useState<FormData>(initialForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof FormData, boolean>>>({});
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // Clear error as user types if field was already touched
    if (touched[name as keyof FormData]) {
      const err = validateField(name as keyof FormData, value);
      setErrors((prev) => ({ ...prev, [name]: err }));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const err = validateField(name as keyof FormData, value);
    setErrors((prev) => ({ ...prev, [name]: err }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all required fields before submitting
    const requiredFields: (keyof FormData)[] = ["firstName", "email", "phone"];
    const newErrors: FormErrors = {};
    let hasError = false;

    (["firstName", "email", "phone", "message"] as (keyof FormData)[]).forEach((field) => {
      const err = validateField(field, form[field]);
      if (err) {
        newErrors[field] = err;
        if (requiredFields.includes(field) || err) hasError = true;
      }
    });

    setErrors(newErrors);
    setTouched({ firstName: true, email: true, phone: true, message: true });

    if (hasError) return;

    setStatus("loading");

    try {
      const payload = {
        ...form,
        submittedAt: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
        status: "Draft",
      };

      // 1. Send data to Google Sheets
      if (GOOGLE_SCRIPT_URL) {
        await fetch(GOOGLE_SCRIPT_URL, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      // 2. Trigger WhatsApp notification via our API route
      await fetch('/api/contact', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.firstName,
          email: form.email,
          phone: form.phone,
          message: form.message
        }),
      });

      if (typeof window !== "undefined" && (window as any).dataLayer) {
        (window as any).dataLayer.push({
          event: "generate_lead",
          lead_type: "quote_request",
          form_name: "Contact CTA"
        });
      }

      setStatus("success");
      setForm(initialForm);
      setErrors({});
      setTouched({});
    } catch (error) {
      console.error("Submission error:", error);
      setStatus("error");
    }
  };

  return (
    <section id="contact" className="relative py-28 overflow-hidden bg-matte-black group">
      {/* Top Golden Bar */}
      {/* FIX: bar color darkened to #7A5418 */}
      <div className="absolute top-0 left-0 w-full h-[8px] bg-[#7A5418] z-20" />

      {/* Background image with dark overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src="https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&q=80&w=2000"
          alt="Modern Interior"
          fill
          quality={75}
          sizes="100vw"
          className="object-cover transition-transform duration-[10000ms] group-hover:scale-110"
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
                {/* FIX: success icon ring uses darker gold */}
                <div className="w-16 h-16 rounded-full bg-[#7A5418]/20 border-2 border-[#7A5418] flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-8 h-8 text-[#D4A84B] fill-none stroke-current" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="text-white text-xl font-bold mb-1">We&apos;ve got your request!</p>
                  {/* FIX: white/55 → white/80 for readable subtext */}
                  <p className="text-white/80 text-base">
                    Our team will contact you within <span className="text-white font-semibold">24 hours</span>.
                  </p>
                </div>
                <button
                  onClick={() => setStatus("idle")}
                  className="text-white text-sm font-semibold underline underline-offset-4 hover:text-white/70 transition-colors"
                >
                  Submit another request
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="space-y-6">
                <div className="space-y-4">
                  {/* First Name */}
                  <div>
                    <input
                      type="text"
                      name="firstName"
                      value={form.firstName}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder="First Name"
                      aria-describedby={errors.firstName ? "firstName-error" : undefined}
                      className={`w-full bg-white rounded-full px-8 py-5 text-[#111111] outline-none focus:ring-2 transition-all font-medium placeholder:text-gray-400 border-2 ${
                        errors.firstName && touched.firstName
                          ? "border-red-400 focus:ring-red-300"
                          : "border-transparent focus:ring-[#7A5418]/50"
                      }`}
                    />
                    {errors.firstName && touched.firstName && (
                      <p id="firstName-error" className="mt-2 ml-4 text-sm text-red-300 flex items-center gap-1">
                        <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                        {errors.firstName}
                      </p>
                    )}
                  </div>

                  {/* Email & Phone */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <input
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        placeholder="Your Email"
                        aria-describedby={errors.email ? "email-error" : undefined}
                        className={`w-full bg-white rounded-full px-8 py-5 text-[#111111] outline-none focus:ring-2 transition-all font-medium placeholder:text-gray-400 border-2 ${
                          errors.email && touched.email
                            ? "border-red-400 focus:ring-red-300"
                            : "border-transparent focus:ring-[#7A5418]/50"
                        }`}
                      />
                      {errors.email && touched.email && (
                        <p id="email-error" className="mt-2 ml-4 text-sm text-red-300 flex items-center gap-1">
                          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                          {errors.email}
                        </p>
                      )}
                    </div>
                    <div>
                      <input
                        type="tel"
                        name="phone"
                        value={form.phone}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        placeholder="Phone Number"
                        maxLength={10}
                        aria-describedby={errors.phone ? "phone-error" : undefined}
                        className={`w-full bg-white rounded-full px-8 py-5 text-[#111111] outline-none focus:ring-2 transition-all font-medium placeholder:text-gray-400 border-2 ${
                          errors.phone && touched.phone
                            ? "border-red-400 focus:ring-red-300"
                            : "border-transparent focus:ring-[#7A5418]/50"
                        }`}
                      />
                      {errors.phone && touched.phone && (
                        <p id="phone-error" className="mt-2 ml-4 text-sm text-red-300 flex items-center gap-1">
                          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                          {errors.phone}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Message */}
                  <div>
                    <textarea
                      name="message"
                      value={form.message}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder="Your Message (optional)"
                      rows={4}
                      aria-describedby={errors.message ? "message-error" : undefined}
                      className={`w-full bg-white rounded-[2.5rem] px-8 py-6 text-[#111111] outline-none focus:ring-2 transition-all font-medium placeholder:text-gray-400 resize-none border-2 ${
                        errors.message && touched.message
                          ? "border-red-400 focus:ring-red-300"
                          : "border-transparent focus:ring-[#7A5418]/50"
                      }`}
                    />
                    {errors.message && touched.message && (
                      <p id="message-error" className="mt-2 ml-4 text-sm text-red-300 flex items-center gap-1">
                        <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                        {errors.message}
                      </p>
                    )}
                  </div>
                </div>

                {status === "error" && (
                  <p className="text-red-400 text-sm">Something went wrong. Please try again.</p>
                )}

                {/* FIX: button bg darkened to #7A5418 for white text contrast */}
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="inline-flex items-center gap-3 bg-[#7A5418] hover:bg-[#5C3D0E] text-white px-16 py-4 rounded-xl font-bold text-lg transition-all shadow-xl active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
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
                  url: 'https://www.youtube.com/@ALU_SEA'
                },
                {
                  icon: (
                    <svg className="w-8 h-8 md:w-12 md:h-12 fill-current" viewBox="0 0 24 24">
                      <path d="M12 2.04c-5.5 0-10 4.49-10 10.02 0 5 3.66 9.15 8.44 9.9v-7h-2.54V12.02h2.54V9.41c0-2.51 1.49-3.89 3.77-3.89 1.09 0 2.23.19 2.23.19v2.47h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.45 2.89h-2.33v7a10 10 0 008.44-9.9c0-5.53-4.5-10.02-10-10.02z" />
                    </svg>
                  ),
                  url: 'https://www.facebook.com/profile.php?id=61575357051060'
                },
                {
                  icon: (
                    <svg className="w-8 h-8 md:w-11 md:h-11 fill-current" viewBox="0 0 24 24">
                      <path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 01-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 017.8 2m-.2 2A3.6 3.6 0 004 7.6v8.8A3.6 3.6 0 007.6 20h8.8a3.6 3.6 0 003.6-3.6V7.6A3.6 3.6 0 0016.4 4H7.6m9.65 1.5a1.25 1.25 0 011.25 1.25A1.25 1.25 0 0117.25 8 1.25 1.25 0 0116 6.75a1.25 1.25 0 011.25-1.25M12 7a5 5 0 015 5 5 5 0 01-5 5 5 5 0 01-5-5 5 5 0 015-5m0 2a3 3 0 00-3 3 3 3 0 003 3 3 3 0 003-3 3 3 0 00-3-3z" />
                    </svg>
                  ),
                  url: 'https://www.instagram.com/alusea_aluminum/'
                },
              ].map((social, idx) => (
                <a
                  key={idx}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={["YouTube", "Facebook", "Instagram"][idx]}
                  /* FIX: text-[#5C3D0E] on white bg passes AA; hover inverts to white on dark */
                  className="w-20 h-20 md:w-28 md:h-28 bg-white rounded-full flex items-center justify-center text-[#5C3D0E] hover:bg-[#7A5418] hover:text-white transition-all duration-300 shadow-2xl hover:-translate-y-2"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Golden Bar */}
      <div className="absolute bottom-0 left-0 w-full h-[8px] bg-[#7A5418] z-20" />
    </section>
  );
};

export default ContactCTA;