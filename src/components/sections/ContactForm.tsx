"use client";
import React, { useState } from 'react';

type FormData = { name: string; email: string; phone: string; message: string };

const validateField = (name: keyof FormData, value: string): string => {
  switch (name) {
    case 'name':
      if (!value.trim()) return 'Name is required.';
      if (value.trim().length < 2) return 'Name must be at least 2 characters.';
      if (!/^[a-zA-Z\s'-]+$/.test(value.trim())) return 'Name can only contain letters.';
      return '';
    case 'email':
      if (!value.trim()) return 'Email is required.';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) return 'Please enter a valid email address.';
      return '';
    case 'phone':
      if (!value.trim()) return 'Phone number is required.';
      if (!/^[6-9]\d{9}$/.test(value.replace(/\s/g, ''))) return 'Enter a valid 10-digit mobile number.';
      return '';
    case 'message':
      if (!value.trim()) return 'Message cannot be empty.';
      if (value.trim().length < 10) return 'Message must be at least 10 characters.';
      return '';
    default:
      return '';
  }
};

export default function ContactForm() {
  const [formData, setFormData] = useState<FormData>({ name: '', email: '', phone: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validate = (): boolean => {
    const tempErrors: Record<string, string> = {};
    (Object.keys(formData) as (keyof FormData)[]).forEach((field) => {
      const err = validateField(field, formData[field]);
      if (err) tempErrors[field] = err;
    });
    setErrors(tempErrors);
    setTouched({ name: true, email: true, phone: true, message: true });
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      setStatus('submitting');
      try {
        const response = await fetch('/api/contact', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });

        if (!response.ok) {
          throw new Error('Failed to send message');
        }

        if (typeof window !== "undefined" && (window as any).dataLayer) {
          (window as any).dataLayer.push({
            event: "generate_lead",
            lead_type: "general_inquiry",
            form_name: "Contact Page Form"
          });
        }
        setStatus('success');
        setFormData({ name: '', email: '', phone: '', message: '' });
      } catch (error) {
        console.error('Error submitting form:', error);
        setStatus('error');
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Re-validate live only if the field has already been touched
    if (touched[name]) {
      const err = validateField(name as keyof FormData, value);
      setErrors(prev => ({ ...prev, [name]: err }));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    const err = validateField(name as keyof FormData, value);
    setErrors(prev => ({ ...prev, [name]: err }));
  };

  if (status === 'success') {
    return (
      <div className="bg-green-50/50 border border-green-100 p-8 rounded-xl text-center">
        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-matte-black mb-2">Message Received</h3>
        <p className="text-steel-gray">Thank you for reaching out to Alusea. Our team will contact you within 24 hours.</p>
        {/* FIX: text-brushed-bronze → text-[#7A5418] for AA contrast on white bg */}
        <button
          onClick={() => setStatus('idle')}
          className="mt-6 text-[#7A5418] font-bold hover:underline"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-[#111111] mb-1">Full Name *</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            onBlur={handleBlur}
            className={`w-full p-4 bg-gray-50 border text-[#111111] ${errors.name && touched.name ? 'border-red-500 focus:ring-red-300' : 'border-gray-200 focus:ring-[#7A5418]'} rounded-lg focus:outline-none focus:ring-2 transition-colors`}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "name-error" : undefined}
          />
          {errors.name && touched.name && (
            <p id="name-error" className="mt-1 text-sm text-red-500 flex items-center gap-1">
              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
              {errors.name}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-[#111111] mb-1">Email Address *</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            onBlur={handleBlur}
            className={`w-full p-4 bg-gray-50 border text-[#111111] ${errors.email && touched.email ? 'border-red-500 focus:ring-red-300' : 'border-gray-200 focus:ring-[#7A5418]'} rounded-lg focus:outline-none focus:ring-2 transition-colors`}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "email-error" : undefined}
          />
          {errors.email && touched.email && (
            <p id="email-error" className="mt-1 text-sm text-red-500 flex items-center gap-1">
              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
              {errors.email}
            </p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-[#111111] mb-1">Phone Number *</label>
        <input
          type="tel"
          id="phone"
          name="phone"
          value={formData.phone}
          maxLength={10}
          onChange={handleChange}
          onBlur={handleBlur}
          className={`w-full p-4 bg-gray-50 border text-[#111111] ${errors.phone && touched.phone ? 'border-red-500 focus:ring-red-300' : 'border-gray-200 focus:ring-[#7A5418]'} rounded-lg focus:outline-none focus:ring-2 transition-colors`}
          aria-invalid={!!errors.phone}
          aria-describedby={errors.phone ? "phone-error" : undefined}
        />
        {errors.phone && touched.phone && (
          <p id="phone-error" className="mt-1 text-sm text-red-500 flex items-center gap-1">
            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
            {errors.phone}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-medium text-[#111111] mb-1">Message *</label>
        <textarea
          id="message"
          name="message"
          rows={5}
          value={formData.message}
          onChange={handleChange}
          onBlur={handleBlur}
          className={`w-full p-4 bg-gray-50 border text-[#111111] ${errors.message && touched.message ? 'border-red-500 focus:ring-red-300' : 'border-gray-200 focus:ring-[#7A5418]'} rounded-lg focus:outline-none focus:ring-2 transition-colors`}
          aria-invalid={!!errors.message}
          aria-describedby={errors.message ? "message-error" : undefined}
        />
        {errors.message && touched.message && (
          <p id="message-error" className="mt-1 text-sm text-red-500 flex items-center gap-1">
            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
            {errors.message}
          </p>
        )}
      </div>

      {/* bg-matte-black + text-white passes contrast — no change needed */}
      {status === 'error' && (
        <div className="p-4 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm">
          Failed to send message. Please try again or contact us directly.
        </div>
      )}
      <button
        type="submit"
        disabled={status === 'submitting'}
        className="w-full bg-matte-black hover:bg-architectural-blue text-white font-bold py-4 px-8 rounded-lg transition-colors flex justify-center items-center"
      >
        {status === 'submitting' ? (
          <span className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
        ) : (
          "Send Message"
        )}
      </button>
    </form>
  );
}