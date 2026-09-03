"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { addBlogPost, updateBlogPost, type BlogSection, type BlogQA, type BlogCta, type ImageFit } from "./actions";
import RichTextEditor from "./RichTextEditor";

type BlogPost = {
  id: string;
  slug: string;
  title: string;
  featured_image_url: string;
  featured_image_alt: string;
  featured_image_fit: ImageFit;
  category: string;
  tags: string[];
  author: string;
  reading_time_minutes: number;
  published_at: string;
  intro_html: string;
  second_image_url: string | null;
  second_image_alt: string | null;
  second_image_fit: ImageFit;
  sections: BlogSection[];
  qa: BlogQA[];
  cta: BlogCta;
};

const DEFAULT_CTA: BlogCta = {
  intro:
    "A good specification starts with understanding how the complete system needs to perform. Explore Alusea's range of aluminium windows, doors, sliding systems, and architectural solutions, or speak with the team about your project's requirements.",
  buttons: [
    { label: "Explore Products", href: "/products" },
    { label: "Contact Alusea", href: "/contact" },
    { label: "Request a Quote", href: "/contact" },
  ],
};

function toDateInputValue(isoString?: string): string {
  const date = isoString ? new Date(isoString) : new Date();
  if (isNaN(date.getTime())) return new Date().toISOString().slice(0, 10);
  return date.toISOString().slice(0, 10);
}

async function uploadImage(file: File): Promise<string> {
  const supabase = createClient();
  const fileExt = file.name.split(".").pop() || "webp";
  const fileName = `blog/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

  const { error } = await supabase.storage
    .from("alusea-assets")
    .upload(fileName, file, { cacheControl: "3600", upsert: false });

  if (error) throw new Error(`Failed to upload ${file.name}: ${error.message}`);

  const { data } = supabase.storage.from("alusea-assets").getPublicUrl(fileName);
  return data.publicUrl;
}

function ImageUploadField({
  label,
  url,
  onUploaded,
  fit,
  onFitChange,
  required,
}: {
  label: string;
  url: string;
  onUploaded: (url: string) => void;
  fit: ImageFit;
  onFitChange: (fit: ImageFit) => void;
  required?: boolean;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setIsUploading(true);
    try {
      const publicUrl = await uploadImage(file);
      onUploaded(publicUrl);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <div className="flex items-center gap-3">
        {url && (
          <div className="relative w-20 h-20 rounded-md overflow-hidden border border-gray-200 shrink-0 bg-gray-100">
            <Image src={url} alt="" fill className={fit === "contain" ? "object-contain" : "object-cover"} />
          </div>
        )}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors disabled:opacity-50"
        >
          {isUploading ? "Uploading..." : url ? "Replace Image" : "Upload Image"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />

        {url && (
          <div className="flex items-center rounded-md border border-gray-300 p-0.5 shrink-0">
            {(["cover", "contain"] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => onFitChange(option)}
                title={
                  option === "cover"
                    ? "Cover — crops the image to fill the frame"
                    : "Contain — shows the whole image, letterboxed"
                }
                className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider rounded transition-colors ${
                  fit === option ? "bg-[#A67C52] text-white" : "text-gray-500 hover:bg-gray-100"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function BlogPostForm({
  initialData,
  categories,
  cancelUrl,
}: {
  initialData?: BlogPost;
  categories: string[];
  cancelUrl: string;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [featuredImageUrl, setFeaturedImageUrl] = useState(initialData?.featured_image_url || "");
  const [featuredImageFit, setFeaturedImageFit] = useState<ImageFit>(initialData?.featured_image_fit || "cover");
  const [secondImageUrl, setSecondImageUrl] = useState(initialData?.second_image_url || "");
  const [secondImageFit, setSecondImageFit] = useState<ImageFit>(initialData?.second_image_fit || "cover");

  const [sections, setSections] = useState<BlogSection[]>(
    initialData?.sections?.length ? initialData.sections : []
  );
  const [qa, setQa] = useState<BlogQA[]>(initialData?.qa?.length ? initialData.qa : []);
  const [cta, setCta] = useState<BlogCta>(
    initialData?.cta?.buttons?.length ? initialData.cta : DEFAULT_CTA
  );

  const addSection = () => {
    setSections((prev) => [...prev, { heading: "", body_html: "", subsections: [] }]);
  };
  const removeSection = (index: number) => {
    setSections((prev) => prev.filter((_, i) => i !== index));
  };
  const updateSectionHeading = (index: number, heading: string) => {
    setSections((prev) => prev.map((s, i) => (i === index ? { ...s, heading } : s)));
  };
  const addSubsection = (sectionIndex: number) => {
    setSections((prev) =>
      prev.map((s, i) =>
        i === sectionIndex ? { ...s, subsections: [...s.subsections, { heading: "", body_html: "" }] } : s
      )
    );
  };
  const removeSubsection = (sectionIndex: number, subIndex: number) => {
    setSections((prev) =>
      prev.map((s, i) =>
        i === sectionIndex ? { ...s, subsections: s.subsections.filter((_, si) => si !== subIndex) } : s
      )
    );
  };
  const updateSubsectionHeading = (sectionIndex: number, subIndex: number, heading: string) => {
    setSections((prev) =>
      prev.map((s, i) =>
        i === sectionIndex
          ? { ...s, subsections: s.subsections.map((sub, si) => (si === subIndex ? { ...sub, heading } : sub)) }
          : s
      )
    );
  };
  const addQa = () => setQa((prev) => [...prev, { question: "", answer: "" }]);
  const removeQa = (index: number) => setQa((prev) => prev.filter((_, i) => i !== index));
  const updateQa = (index: number, field: "question" | "answer", value: string) => {
    setQa((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  const updateCtaButton = (index: number, field: "label" | "href", value: string) => {
    setCta((prev) => ({
      ...prev,
      buttons: prev.buttons.map((b, i) => (i === index ? { ...b, [field]: value } : b)),
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!featuredImageUrl) {
      alert("Please upload a featured image.");
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    formData.set("featured_image_url", featuredImageUrl);
    formData.set("featured_image_fit", featuredImageFit);
    formData.set("second_image_url", secondImageUrl);
    formData.set("second_image_fit", secondImageFit);

    // Pull each section/subsection's current rich-text HTML from the DOM
    // hidden inputs the RichTextEditor instances render, keyed by name.
    const form = e.currentTarget;
    const getFieldValue = (name: string) => (form.elements.namedItem(name) as HTMLInputElement | null)?.value || "";

    const resolvedSections: BlogSection[] = sections.map((section, sIdx) => ({
      heading: section.heading,
      body_html: getFieldValue(`section_${sIdx}_body`) || section.body_html,
      subsections: section.subsections.map((sub, subIdx) => ({
        heading: sub.heading,
        body_html: getFieldValue(`section_${sIdx}_sub_${subIdx}_body`) || sub.body_html,
      })),
    }));

    formData.set("sections_json", JSON.stringify(resolvedSections));
    formData.set("qa_json", JSON.stringify(qa.filter((item) => item.question.trim())));
    formData.set(
      "cta_json",
      JSON.stringify({ ...cta, intro: getFieldValue("cta_intro_body") || cta.intro })
    );
    formData.set("intro_html", getFieldValue("intro_html") || "");

    try {
      if (initialData) {
        await updateBlogPost(formData);
        alert("Blog post updated successfully!");
      } else {
        await addBlogPost(formData);
        alert("Blog post published successfully!");
      }
      window.location.href = cancelUrl;
    } catch (error) {
      alert(`Error: ${(error as Error).message || "Something went wrong."}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-10">
      {initialData && <input type="hidden" name="id" value={initialData.id} />}

      {/* CORE */}
      <section className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-[#A67C52] border-b border-gray-200 pb-2">
          Post Details
        </h3>

        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Title (H1) *</label>
          <input
            required
            name="title"
            defaultValue={initialData?.title}
            type="text"
            className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-sm text-gray-900"
            placeholder="e.g. Thermal Break Aluminium Windows: Why They Matter in Modern Buildings"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
            Slug <span className="text-gray-400 normal-case font-normal">(leave blank to auto-generate from title)</span>
          </label>
          <input
            name="slug"
            defaultValue={initialData?.slug}
            type="text"
            className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-sm text-gray-900"
            placeholder="thermal-break-aluminium-windows"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Category *</label>
            <select
              required
              name="category"
              defaultValue={initialData?.category || categories[0] || ""}
              className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-sm text-gray-900"
            >
              {categories.length === 0 && <option value="" disabled>No categories yet</option>}
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Author</label>
            <input
              name="author"
              defaultValue={initialData?.author || "Alusea Team"}
              type="text"
              className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-sm text-gray-900"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
              Tags <span className="text-gray-400 normal-case font-normal">(comma separated)</span>
            </label>
            <input
              name="tags"
              defaultValue={initialData?.tags?.join(", ")}
              type="text"
              className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-sm text-gray-900"
              placeholder="Thermal Break Aluminium, Aluminium Windows"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Reading Time (minutes)</label>
            <input
              name="reading_time_minutes"
              defaultValue={initialData?.reading_time_minutes || 5}
              type="number"
              min={1}
              className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-sm text-gray-900"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
            Published Date <span className="text-gray-400 normal-case font-normal">(defaults to today — backdate to schedule or correct it)</span>
          </label>
          <input
            name="published_at"
            defaultValue={toDateInputValue(initialData?.published_at)}
            type="date"
            className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-sm text-gray-900 md:w-1/2"
          />
        </div>
      </section>

      {/* FEATURED IMAGE */}
      <section className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-[#A67C52] border-b border-gray-200 pb-2">
          Featured Image
        </h3>
        <ImageUploadField
          label="Featured Image"
          url={featuredImageUrl}
          onUploaded={setFeaturedImageUrl}
          fit={featuredImageFit}
          onFitChange={setFeaturedImageFit}
          required
        />
        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Image Alt Text *</label>
          <input
            required
            name="featured_image_alt"
            defaultValue={initialData?.featured_image_alt}
            type="text"
            className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-sm text-gray-900"
            placeholder="Thermal break aluminium windows in a modern residential building"
          />
        </div>
      </section>

      {/* INTRODUCTION */}
      <section className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-[#A67C52] border-b border-gray-200 pb-2">
          Introduction *
        </h3>
        <RichTextEditor name="intro_html" defaultValue={initialData?.intro_html} />
      </section>

      {/* SECTIONS */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-gray-200 pb-2">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#A67C52]">Sections</h3>
          <button
            type="button"
            onClick={addSection}
            className="text-xs text-[#A67C52] font-semibold uppercase hover:underline"
          >
            + Add Section
          </button>
        </div>

        {sections.length === 0 && (
          <p className="text-sm text-gray-400 italic">No sections yet. Add one to build out the article body.</p>
        )}

        {sections.map((section, sIdx) => (
          <div key={sIdx} className="border border-gray-200 rounded-lg p-4 space-y-3 bg-gray-50/50">
            <div className="flex items-start gap-3">
              <input
                type="text"
                value={section.heading}
                onChange={(e) => updateSectionHeading(sIdx, e.target.value)}
                placeholder={`Section ${sIdx + 1} heading (e.g. WHAT IS A THERMAL BREAK ALUMINIUM WINDOW?)`}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-md bg-white text-sm font-bold text-gray-900"
              />
              <button
                type="button"
                onClick={() => removeSection(sIdx)}
                className="text-red-400 hover:text-red-600 p-2 shrink-0"
                title="Remove section"
              >
                ✕
              </button>
            </div>

            <RichTextEditor
              key={`section-${sIdx}`}
              name={`section_${sIdx}_body`}
              defaultValue={section.body_html}
            />

            {/* Subsections */}
            <div className="pl-4 border-l-2 border-[#A67C52]/30 space-y-3">
              {section.subsections.map((sub, subIdx) => (
                <div key={subIdx} className="space-y-2">
                  <div className="flex items-start gap-3">
                    <input
                      type="text"
                      value={sub.heading}
                      onChange={(e) => updateSubsectionHeading(sIdx, subIdx, e.target.value)}
                      placeholder={`Sub-heading ${sIdx + 1}.${subIdx + 1}`}
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-md bg-white text-sm font-semibold text-gray-900"
                    />
                    <button
                      type="button"
                      onClick={() => removeSubsection(sIdx, subIdx)}
                      className="text-red-400 hover:text-red-600 p-2 shrink-0"
                      title="Remove sub-section"
                    >
                      ✕
                    </button>
                  </div>
                  <RichTextEditor
                    key={`section-${sIdx}-sub-${subIdx}`}
                    name={`section_${sIdx}_sub_${subIdx}_body`}
                    defaultValue={sub.body_html}
                  />
                </div>
              ))}
              <button
                type="button"
                onClick={() => addSubsection(sIdx)}
                className="text-xs text-[#A67C52] font-semibold uppercase hover:underline"
              >
                + Add Sub-section
              </button>
            </div>
          </div>
        ))}
      </section>

      {/* SECOND IMAGE */}
      <section className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-[#A67C52] border-b border-gray-200 pb-2">
          Second Image <span className="text-gray-400 normal-case font-normal">(optional)</span>
        </h3>
        <ImageUploadField
          label="Second Image"
          url={secondImageUrl}
          onUploaded={setSecondImageUrl}
          fit={secondImageFit}
          onFitChange={setSecondImageFit}
        />
        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Image Alt Text</label>
          <input
            name="second_image_alt"
            defaultValue={initialData?.second_image_alt || ""}
            type="text"
            className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-sm text-gray-900"
          />
        </div>
      </section>

      {/* Q&A */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-gray-200 pb-2">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#A67C52]">Q&amp;A</h3>
          <button type="button" onClick={addQa} className="text-xs text-[#A67C52] font-semibold uppercase hover:underline">
            + Add Question
          </button>
        </div>
        {qa.map((item, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-2 bg-gray-50/50">
            <div className="flex items-start gap-3">
              <input
                type="text"
                value={item.question}
                onChange={(e) => updateQa(index, "question", e.target.value)}
                placeholder="Question"
                className="flex-1 px-3 py-2 border border-gray-200 rounded-md bg-white text-sm font-semibold text-gray-900"
              />
              <button type="button" onClick={() => removeQa(index)} className="text-red-400 hover:text-red-600 p-2 shrink-0">
                ✕
              </button>
            </div>
            <textarea
              value={item.answer}
              onChange={(e) => updateQa(index, "answer", e.target.value)}
              placeholder="Answer"
              rows={2}
              className="w-full px-3 py-2 border border-gray-200 rounded-md bg-white text-sm text-gray-900"
            />
          </div>
        ))}
      </section>

      {/* CTA */}
      <section className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-[#A67C52] border-b border-gray-200 pb-2">
          Call to Action
        </h3>
        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">CTA Intro Text</label>
          <RichTextEditor name="cta_intro_body" defaultValue={cta.intro} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {cta.buttons.map((button, index) => (
            <div key={index} className="space-y-2 border border-gray-200 rounded-md p-3 bg-gray-50/50">
              <label className="block text-[10px] font-semibold text-gray-500 uppercase">Button {index + 1}</label>
              <input
                type="text"
                value={button.label}
                onChange={(e) => updateCtaButton(index, "label", e.target.value)}
                placeholder="Label"
                className="w-full px-2 py-1.5 border border-gray-200 rounded bg-white text-xs text-gray-900"
              />
              <input
                type="text"
                value={button.href}
                onChange={(e) => updateCtaButton(index, "href", e.target.value)}
                placeholder="/products"
                className="w-full px-2 py-1.5 border border-gray-200 rounded bg-white text-xs text-gray-900"
              />
            </div>
          ))}
        </div>
      </section>

      <div className="flex gap-3 pt-4 border-t border-gray-200">
        <Link
          href={cancelUrl}
          className="w-1/3 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 rounded-md uppercase tracking-widest text-xs font-bold transition-colors shadow-sm flex items-center justify-center"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 bg-[#A67C52] hover:bg-[#8e6944] text-white py-3 rounded-md uppercase tracking-widest text-xs font-bold transition-colors shadow-md disabled:opacity-50"
        >
          {isSubmitting ? "Saving..." : initialData ? "Update Post" : "Publish Post"}
        </button>
      </div>
    </form>
  );
}
