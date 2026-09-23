"use client";

import { useState, useRef, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { XIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { addBlogPost, updateBlogPost } from "./actions";
import type { BlogSection, BlogQA, BlogCta, ImageFit, BlogPostRow } from "@/lib/supabase/types";
import RichTextEditor from "./RichTextEditor";
import { FormError, SelectField, TextField } from "@/components/form-fields";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelectOption } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { useAction } from "@/hooks/use-action";

type BlogPost = BlogPostRow;

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

// One titled block of the post editor, optionally with an add button on the right of its heading.
function EditorSection({ title, action, children }: { title: ReactNode; action?: ReactNode; children: ReactNode }) {
  return (
    <FieldSet className="gap-4">
      <div className="flex items-center justify-between border-b border-gray-200 pb-2">
        <FieldLegend className="mb-0 text-sm font-bold uppercase tracking-wider text-[#A67C52]">{title}</FieldLegend>
        {action}
      </div>
      {children}
    </FieldSet>
  );
}

function AddButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <Button type="button" variant="link" onClick={onClick} className="h-auto p-0 text-[#A67C52]">
      {children}
    </Button>
  );
}

function RemoveButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <Button type="button" variant="ghost" size="icon" onClick={onClick} aria-label={label} className="shrink-0 text-red-400 hover:text-red-600">
      <XIcon />
    </Button>
  );
}

function ImageUploadField({
  id,
  label,
  url,
  onUploaded,
  fit,
  onFitChange,
  required,
}: {
  id: string;
  label: string;
  url: string;
  onUploaded: (url: string) => void;
  fit: ImageFit;
  onFitChange: (fit: ImageFit) => void;
  required?: boolean;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setIsUploading(true);
    setError(null);
    try {
      const publicUrl = await uploadImage(file);
      onUploaded(publicUrl);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Field>
      <FieldLabel htmlFor={id}>
        {label}
        {required && <span className="text-destructive">*</span>}
      </FieldLabel>
      <div className="flex items-center gap-3">
        {url && (
          <div className="relative w-20 h-20 rounded-md overflow-hidden border border-gray-200 shrink-0 bg-gray-100">
            <Image src={url} alt="" fill className={fit === "contain" ? "object-contain" : "object-cover"} />
          </div>
        )}
        <Button type="button" variant="outline" size="lg" onClick={() => inputRef.current?.click()} disabled={isUploading}>
          {isUploading ? "Uploading…" : url ? "Replace Image" : "Upload Image"}
        </Button>
        <input
          id={id}
          ref={inputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />

        {url && (
          <div role="group" aria-label="Image fit" className="flex items-center rounded-md border border-gray-300 p-0.5 shrink-0">
            {(["cover", "contain"] as const).map((option) => (
              <Button
                key={option}
                type="button"
                size="sm"
                variant={fit === option ? "brand" : "ghost"}
                aria-pressed={fit === option}
                onClick={() => onFitChange(option)}
                title={
                  option === "cover"
                    ? "Cover — crops the image to fill the frame"
                    : "Contain — shows the whole image, letterboxed"
                }
                className={fit === option ? "shadow-none" : "text-gray-500"}
              >
                {option}
              </Button>
            ))}
          </div>
        )}
      </div>
      <FieldError>{error}</FieldError>
    </Field>
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
  const { run, isPending, error: actionError, setError } = useAction(initialData ? updateBlogPost : addBlogPost);

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

  const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!featuredImageUrl) {
      setError("Please upload a featured image.");
      return;
    }

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

    run(formData).then((result) => {
      if (!result.ok) return;
      alert(initialData ? "Blog post updated successfully!" : "Blog post published successfully!");
      window.location.href = cancelUrl;
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <FieldGroup className="gap-10">
        {initialData && <input type="hidden" name="id" value={initialData.id} />}

        <EditorSection title="Post Details">
          <TextField
            label="Title (H1)"
            name="title"
            required
            defaultValue={initialData?.title}
            placeholder="e.g. Thermal Break Aluminium Windows: Why They Matter in Modern Buildings"
          />

          <TextField
            label="Slug"
            name="slug"
            defaultValue={initialData?.slug}
            placeholder="thermal-break-aluminium-windows"
            hint="Leave blank to auto-generate from the title"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SelectField label="Category" name="category" required defaultValue={initialData?.category || categories[0] || ""}>
              {categories.length === 0 && <NativeSelectOption value="" disabled>No categories yet</NativeSelectOption>}
              {categories.map((c) => (
                <NativeSelectOption key={c} value={c}>{c}</NativeSelectOption>
              ))}
            </SelectField>
            <TextField label="Author" name="author" defaultValue={initialData?.author || "Alusea Team"} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextField
              label="Tags"
              name="tags"
              defaultValue={initialData?.tags?.join(", ")}
              placeholder="Thermal Break Aluminium, Aluminium Windows"
              hint="Comma separated"
            />
            <TextField
              label="Reading Time (minutes)"
              name="reading_time_minutes"
              type="number"
              min={1}
              defaultValue={initialData?.reading_time_minutes || 5}
            />
          </div>

          <TextField
            label="Published Date"
            name="published_at"
            type="date"
            defaultValue={toDateInputValue(initialData?.published_at)}
            hint="Defaults to today — backdate to schedule or correct it"
            className="md:w-1/2"
          />
        </EditorSection>

        <EditorSection title="Featured Image">
          <ImageUploadField
            id="featured_image_file"
            label="Featured Image"
            url={featuredImageUrl}
            onUploaded={setFeaturedImageUrl}
            fit={featuredImageFit}
            onFitChange={setFeaturedImageFit}
            required
          />
          <TextField
            label="Image Alt Text"
            name="featured_image_alt"
            required
            defaultValue={initialData?.featured_image_alt}
            placeholder="Thermal break aluminium windows in a modern residential building"
          />
        </EditorSection>

        <EditorSection title={<>Introduction <span className="text-destructive">*</span></>}>
          <RichTextEditor name="intro_html" defaultValue={initialData?.intro_html} />
        </EditorSection>

        <EditorSection title="Sections" action={<AddButton onClick={addSection}>+ Add Section</AddButton>}>
          {sections.length === 0 && (
            <p className="text-sm text-gray-400 italic">No sections yet. Add one to build out the article body.</p>
          )}

          {sections.map((section, sIdx) => (
            <fieldset key={sIdx} className="border border-gray-200 rounded-lg p-4 space-y-3 bg-gray-50/50">
              <legend className="sr-only">Section {sIdx + 1}</legend>
              <div className="flex items-start gap-3">
                <Input
                  value={section.heading}
                  onChange={(e) => updateSectionHeading(sIdx, e.target.value)}
                  placeholder={`Section ${sIdx + 1} heading (e.g. WHAT IS A THERMAL BREAK ALUMINIUM WINDOW?)`}
                  aria-label={`Section ${sIdx + 1} heading`}
                  className="flex-1 bg-white font-bold"
                />
                <RemoveButton onClick={() => removeSection(sIdx)} label={`Remove section ${sIdx + 1}`} />
              </div>

              <RichTextEditor
                key={`section-${sIdx}`}
                name={`section_${sIdx}_body`}
                defaultValue={section.body_html}
              />

              <div className="pl-4 border-l-2 border-[#A67C52]/30 space-y-3">
                {section.subsections.map((sub, subIdx) => (
                  <div key={subIdx} className="space-y-2">
                    <div className="flex items-start gap-3">
                      <Input
                        value={sub.heading}
                        onChange={(e) => updateSubsectionHeading(sIdx, subIdx, e.target.value)}
                        placeholder={`Sub-heading ${sIdx + 1}.${subIdx + 1}`}
                        aria-label={`Sub-heading ${sIdx + 1}.${subIdx + 1}`}
                        className="flex-1 bg-white font-semibold"
                      />
                      <RemoveButton
                        onClick={() => removeSubsection(sIdx, subIdx)}
                        label={`Remove sub-section ${sIdx + 1}.${subIdx + 1}`}
                      />
                    </div>
                    <RichTextEditor
                      key={`section-${sIdx}-sub-${subIdx}`}
                      name={`section_${sIdx}_sub_${subIdx}_body`}
                      defaultValue={sub.body_html}
                    />
                  </div>
                ))}
                <AddButton onClick={() => addSubsection(sIdx)}>+ Add Sub-section</AddButton>
              </div>
            </fieldset>
          ))}
        </EditorSection>

        <EditorSection title={<>Second Image <span className="text-gray-400 normal-case font-normal">(optional)</span></>}>
          <ImageUploadField
            id="second_image_file"
            label="Second Image"
            url={secondImageUrl}
            onUploaded={setSecondImageUrl}
            fit={secondImageFit}
            onFitChange={setSecondImageFit}
          />
          <TextField label="Image Alt Text" name="second_image_alt" defaultValue={initialData?.second_image_alt} />
        </EditorSection>

        <EditorSection title="Q&A" action={<AddButton onClick={addQa}>+ Add Question</AddButton>}>
          {qa.map((item, index) => (
            <fieldset key={index} className="border border-gray-200 rounded-lg p-4 space-y-2 bg-gray-50/50">
              <legend className="sr-only">Question {index + 1}</legend>
              <div className="flex items-start gap-3">
                <Input
                  value={item.question}
                  onChange={(e) => updateQa(index, "question", e.target.value)}
                  placeholder="Question"
                  aria-label={`Question ${index + 1}`}
                  className="flex-1 bg-white font-semibold"
                />
                <RemoveButton onClick={() => removeQa(index)} label={`Remove question ${index + 1}`} />
              </div>
              <Textarea
                value={item.answer}
                onChange={(e) => updateQa(index, "answer", e.target.value)}
                placeholder="Answer"
                aria-label={`Answer ${index + 1}`}
                rows={2}
                className="bg-white"
              />
            </fieldset>
          ))}
        </EditorSection>

        <EditorSection title="Call to Action">
          <Field>
            <FieldLabel>CTA Intro Text</FieldLabel>
            <RichTextEditor name="cta_intro_body" defaultValue={cta.intro} />
          </Field>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {cta.buttons.map((button, index) => (
              <fieldset key={index} className="space-y-2 border border-gray-200 rounded-md p-3 bg-gray-50/50">
                <legend className="text-[10px] font-semibold text-gray-500 uppercase px-1">Button {index + 1}</legend>
                <Input
                  value={button.label}
                  onChange={(e) => updateCtaButton(index, "label", e.target.value)}
                  placeholder="Label"
                  aria-label={`Button ${index + 1} label`}
                  className="h-9 bg-white text-xs"
                />
                <Input
                  value={button.href}
                  onChange={(e) => updateCtaButton(index, "href", e.target.value)}
                  placeholder="/products"
                  aria-label={`Button ${index + 1} link`}
                  className="h-9 bg-white text-xs"
                />
              </fieldset>
            ))}
          </div>
        </EditorSection>

        <FormError error={actionError} />

        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <Button asChild variant="secondary" className="w-1/3">
            <Link href={cancelUrl}>Cancel</Link>
          </Button>
          <Button type="submit" variant="brand" disabled={isPending} className="flex-1">
            {isPending ? "Saving…" : initialData ? "Update Post" : "Publish Post"}
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
}
