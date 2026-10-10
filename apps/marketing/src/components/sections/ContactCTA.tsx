"use client";

import React, { useEffect, useRef, useState } from 'react';
import Image from "next/image";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import * as fbq from '@/lib/fpixel';
import { SPACES } from "@/lib/spaces";

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

// The first question: what the visitor is planning, answered by tapping a picture.
const NEEDS = [
  { name: "Windows", image: "/images/spaces/study-room/double-side-open-window.webp" },
  { name: "Doors", image: "/images/spaces/bathroom/slim-profile-door.webp" },
  { name: "Sliding Systems", image: "/images/spaces/living-room/sliding-doors-to-terrace.webp" },
  { name: "Help me choose", image: "/images/about/villa-sliding-doors.webp" },
];

const STEPS = ["What are you planning?", "Which spaces is it for?", "Where can we reach you?"];
const LAST_STEP = STEPS.length - 1;

const ContactCTA = () => {
  const [form, setForm] = useState<FormData>(initialForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof FormData, boolean>>>({});
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [step, setStep] = useState(0);
  const [need, setNeed] = useState<string | null>(null);
  const [rooms, setRooms] = useState<string[]>([]);
  const questionRef = useRef<HTMLHeadingElement>(null);
  const hasMoved = useRef(false);

  // After Continue or Back, focus moves to the new question so keyboard and screen-reader users follow along.
  useEffect(() => {
    if (hasMoved.current) questionRef.current?.focus();
  }, [step]);

  const goTo = (next: number) => {
    hasMoved.current = true;
    setStep(next);
  };

  const toggleRoom = (name: string) => setRooms((current) => (current.includes(name) ? current.filter((item) => item !== name) : [...current, name]));

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

    // The first two questions only move on; the form is sent from the last one.
    if (step < LAST_STEP) {
      if (step === 0 && !need) return;
      goTo(step + 1);
      return;
    }

    const newErrors: FormErrors = {};
    let hasError = false;

    (["firstName", "email", "phone", "message"] as (keyof FormData)[]).forEach((field) => {
      const err = validateField(field, form[field]);
      if (err) {
        newErrors[field] = err;
        hasError = true;
      }
    });

    setErrors(newErrors);
    setTouched({ firstName: true, email: true, phone: true, message: true });

    if (hasError) return;

    setStatus("loading");

    // The answers to the first two questions travel at the head of the message.
    const answers = [need ? `Interested in: ${need}.` : "", rooms.length > 0 ? `Spaces: ${rooms.join(", ")}.` : ""].filter(Boolean).join(" ");
    const message = [answers, form.message.trim()].filter(Boolean).join(" ");

    try {
      const payload = {
        ...form,
        message,
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
          phone: form.phone,
          email: form.email,
          message
        }),
      });

      if (typeof window !== "undefined" && window.dataLayer) {
        window.dataLayer.push({
          event: "generate_lead",
          lead_type: "quote_request",
          form_name: "Contact CTA"
        });
      }

      fbq.event("Lead", {
        content_name: "Quote Request",
        content_category: "Contact Form",
        value: 0,
        currency: "INR"
      });

      setStatus("success");
      setForm(initialForm);
      setErrors({});
      setTouched({});
      setNeed(null);
      setRooms([]);
      setStep(0);
    } catch (error) {
      console.error("Submission error:", error);
      setStatus("error");
    }
  };

  const inputs: { name: keyof FormData; type: string; label: string; autoComplete: string; maxLength?: number; wide?: boolean }[] = [
    { name: "firstName", type: "text", label: "First Name", autoComplete: "given-name" },
    { name: "phone", type: "tel", label: "Phone Number", autoComplete: "tel-national", maxLength: 10 },
    { name: "email", type: "email", label: "Your Email", autoComplete: "email", wide: true },
  ];
  const fieldError = (name: keyof FormData) => (errors[name] && touched[name] ? errors[name] : undefined);

  return (
    <section id="contact" className="section bg-plate-white py-0">
      <div className="shell">
        <div className="reveal swatch-shadow grid overflow-hidden rounded-card bg-white lg:grid-cols-12">
          {/* The dark column keeps the heading and shows where the visitor is. */}
          <div className="window-grid flex flex-col justify-between gap-12 bg-blueberry p-8 text-white md:p-12 lg:col-span-4">
            <div>
              <p className="eyebrow on-dark">Free Consultation</p>
              <h2 className="h-section mt-5 text-white">Get A Free Quote</h2>
            </div>
            <ol className="space-y-5">
              {STEPS.map((title, index) => {
                const done = status === "success" || index < step;
                return (
                  <li key={title} aria-current={index === step && status !== "success" ? "step" : undefined} className={`flex items-center gap-4 transition-opacity duration-300 ${index === step || status === "success" ? "opacity-100" : "opacity-50"}`}>
                    <span className={`flex size-9 shrink-0 items-center justify-center rounded-full border text-sm tabular-nums transition-colors duration-300 ${done ? "border-white bg-white text-blueberry" : "border-white/60 text-white"}`}>
                      {done ? <Check aria-hidden="true" className="size-4" strokeWidth={2.5} /> : index + 1}
                    </span>
                    <span className="text-[15px] font-medium">{title}</span>
                  </li>
                );
              })}
            </ol>
          </div>

          <div className="flex min-h-[34rem] flex-col p-7 sm:p-10 lg:col-span-8 lg:p-12">
            {status === "success" ? (
              <div role="status" className="flex flex-grow flex-col items-start justify-center gap-5">
                <span className="flex size-14 items-center justify-center rounded-full bg-blueberry text-white">
                  <Check aria-hidden="true" className="size-6" strokeWidth={2} />
                </span>
                <div>
                  <p className="font-display text-2xl text-blueberry">We&apos;ve got your request!</p>
                  <p className="mt-2 text-berry-bloom">
                    Our team will contact you within <span className="font-semibold text-blueberry">24 hours</span>.
                  </p>
                </div>
                <button type="button" onClick={() => setStatus("idle")} className="link-arrow text-blueberry">
                  Submit another request
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="flex flex-grow flex-col">
                <p className="font-display text-sm tabular-nums text-berry-bloom">{String(step + 1).padStart(2, "0")} / {String(STEPS.length).padStart(2, "0")}</p>
                <h3 ref={questionRef} tabIndex={-1} className="font-display mt-3 text-3xl font-normal text-blueberry outline-none md:text-[2.25rem]">{STEPS[step]}</h3>

                <div key={step} className="sheet-in mt-8 flex-grow">
                  {step === 0 && (
                    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                      {NEEDS.map((item) => {
                        const chosen = need === item.name;
                        return (
                          <button
                            key={item.name}
                            type="button"
                            aria-pressed={chosen}
                            onClick={() => setNeed(item.name)}
                            className={`group relative aspect-[3/4] overflow-hidden rounded-2xl text-left outline-offset-4 transition-shadow duration-300 ${chosen ? "ring-2 ring-blueberry ring-offset-4 ring-offset-white" : ""}`}
                          >
                            <Image src={item.image} alt="" fill sizes="(max-width: 1024px) 44vw, 15vw" className="object-cover transition-transform duration-700 ease-out group-hover:scale-105" />
                            <span aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_45%,rgb(47_58_85/0.9))]" />
                            <span className="absolute inset-x-4 bottom-4 flex items-center justify-between gap-2 font-display text-lg text-white">
                              {item.name}
                              {chosen && (
                                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-white text-blueberry">
                                  <Check aria-hidden="true" className="size-3.5" strokeWidth={2.5} />
                                </span>
                              )}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {step === 1 && (
                    <>
                      <p className="-mt-3 mb-6 text-[15px] text-berry-bloom">Choose as many as you like, or skip this step.</p>
                      <ul className="flex flex-wrap gap-3">
                        {SPACES.map((space) => {
                          const chosen = rooms.includes(space.name);
                          return (
                            <li key={space.slug}>
                              <button
                                type="button"
                                aria-pressed={chosen}
                                onClick={() => toggleRoom(space.name)}
                                className={`flex items-center gap-3 rounded-full border py-1.5 pl-1.5 pr-5 text-[15px] font-medium transition-colors duration-300 ${chosen ? "border-blueberry bg-blueberry text-white" : "border-stem-grey/70 text-blueberry hover:border-blueberry"}`}
                              >
                                <span className="relative size-11 shrink-0 overflow-hidden rounded-full bg-stem-grey/30">
                                  {space.image && <Image src={space.image} alt="" fill sizes="44px" className="object-cover" />}
                                </span>
                                {space.name}
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </>
                  )}

                  {step === LAST_STEP && (
                    <div className="grid gap-6 sm:grid-cols-2">
                      {inputs.map((input) => (
                        <div key={input.name} className={input.wide ? "sm:col-span-2" : ""}>
                          <label htmlFor={`quote-${input.name}`} className="field-label text-berry-bloom">{input.label}</label>
                          <input
                            id={`quote-${input.name}`}
                            type={input.type}
                            name={input.name}
                            value={form[input.name]}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            autoComplete={input.autoComplete}
                            maxLength={input.maxLength}
                            aria-invalid={!!fieldError(input.name)}
                            aria-describedby={fieldError(input.name) ? `${input.name}-error` : undefined}
                            className="field"
                          />
                          {fieldError(input.name) && (
                            <p id={`${input.name}-error`} role="alert" className="mt-2 text-sm text-red-700">{fieldError(input.name)}</p>
                          )}
                        </div>
                      ))}

                      <div className="sm:col-span-2">
                        <label htmlFor="quote-message" className="field-label text-berry-bloom">Your Message (optional)</label>
                        <textarea
                          id="quote-message"
                          name="message"
                          value={form.message}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          rows={3}
                          aria-invalid={!!fieldError("message")}
                          aria-describedby={fieldError("message") ? "message-error" : undefined}
                          className="field resize-none"
                        />
                        {fieldError("message") && (
                          <p id="message-error" role="alert" className="mt-2 text-sm text-red-700">{fieldError("message")}</p>
                        )}
                      </div>

                      {status === "error" && (
                        <p role="alert" className="text-sm text-red-700 sm:col-span-2">Something went wrong. Please try again.</p>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-10 flex items-center justify-between gap-4 border-t border-stem-grey/50 pt-6">
                  <button type="button" onClick={() => goTo(step - 1)} disabled={step === 0} className="link-arrow text-blueberry disabled:invisible">
                    <ArrowLeft aria-hidden="true" className="size-4" /> Back
                  </button>
                  {/* Three segments fill as the questions are answered. */}
                  <div aria-hidden="true" className="hidden flex-grow items-center gap-2 px-8 sm:flex">
                    {STEPS.map((title, index) => (
                      <span key={title} className={`h-0.5 flex-1 rounded-full transition-colors duration-500 ${index <= step ? "bg-blueberry" : "bg-stem-grey/40"}`} />
                    ))}
                  </div>
                  <button type="submit" disabled={status === "loading" || (step === 0 && !need)} className="btn btn-primary disabled:cursor-not-allowed disabled:opacity-50">
                    {status === "loading" ? (
                      <>
                        <svg className="size-5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Sending…
                      </>
                    ) : (
                      <>
                        {step === LAST_STEP ? "Send" : "Continue"} <ArrowRight aria-hidden="true" className="size-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactCTA;
