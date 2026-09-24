"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { ImageIcon, Loader2Icon } from "lucide-react";
import { addPageMedia, deletePageMedia } from "../mediaActions";
import { createClient } from '@/lib/supabase/client';
import { FormError, SelectField, TextareaField, TextField } from "@/components/form-fields";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { NativeSelectOption } from "@/components/ui/native-select";
import { useConfirm } from "@/components/ConfirmProvider";
import { useAction } from "@/hooks/use-action";

type MediaItem = {
  id: string;
  page: string;
  section: string;
  title: string | null;
  description: string | null;
  action_text: string | null;
  image_url: string;
  sort_order: number;
  created_at: string;
};

const PAGES = [
  {
    key: "experience_center",
    label: "Experience Center",
    sections: [
      { value: "zone_1", label: "Zone 1 — The Grand Entrance" },
      { value: "zone_2", label: "Zone 2 — Sliding Doors" },
      { value: "zone_3", label: "Zone 3 — Material Library" },
      { value: "zone_4", label: "Zone 4 — Consultation Lounge" },
    ],
  },
];

export default function MediaManagerClient({ initialMedia }: { initialMedia: MediaItem[] }) {
  const [activePage, setActivePage] = useState("experience_center");
  // The image uploads from the browser before the action runs, so that step has its own pending and error state.
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const addAction = useAction(addPageMedia);
  const deleteAction = useAction(deletePageMedia);
  const [success, setSuccess] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const confirm = useConfirm();

  const pageConfig = PAGES.find((p) => p.key === activePage)!;
  const filteredMedia = initialMedia.filter((m) => m.page === activePage);
  const isSaving = isUploading || addAction.isPending;
  const formError = uploadError ?? addAction.error;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPreview(url);
    } else {
      setPreview(null);
    }
  };

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setUploadError(null);
    setSuccess(null);

    // Captured now: React clears currentTarget once the handler returns, before the upload finishes.
    const form = e.currentTarget;
    const formData = new FormData(form);
    const file = formData.get('image_file') as File;
    formData.delete('image_file');

    if (file && file.size > 0) {
      setIsUploading(true);
      try {
        const supabase = createClient();
        const fileExt = file.name.split('.').pop() || 'webp';
        const fileName = `page-media/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: storageError } = await supabase.storage
          .from('alusea-assets')
          .upload(fileName, file, { cacheControl: '3600', upsert: false });

        if (storageError) {
          setUploadError(storageError.message || "Upload failed");
          return;
        }

        const { data } = supabase.storage.from('alusea-assets').getPublicUrl(fileName);
        formData.set('new_uploaded_url', data.publicUrl);
      } finally {
        setIsUploading(false);
      }
    }

    const result = await addAction.run(formData);
    if (!result.ok) return;

    setSuccess("Image uploaded successfully!");
    form.reset();
    setPreview(null);
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleDelete = async (item: MediaItem) => {
    const sectionLabel = pageConfig.sections.find((s) => s.value === item.section)?.label ?? item.section;
    const ok = await confirm({
      title: `Delete ${item.title ? `“${item.title}”` : "this image"}?`,
      description: `It will disappear from ${sectionLabel} on the website straight away. This cannot be undone.`,
      confirmLabel: "Delete",
    });
    if (!ok) return;
    setDeletingId(item.id);
    await deleteAction.run(item.id, item.image_url);
    setDeletingId(null);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto w-full">
      <div className="mb-10">
        <h1 className="text-3xl font-bold uppercase tracking-tight text-matte-black">
          Page Media Manager
        </h1>
        <p className="text-gray-500 mt-2">
          Upload and manage images displayed across different sections of the website.
        </p>
      </div>

      <nav aria-label="Website pages" className="flex gap-2 mb-8 border-b border-gray-200">
        {PAGES.map((p) => (
          <Button
            key={p.key}
            type="button"
            variant="ghost"
            aria-current={activePage === p.key ? "page" : undefined}
            onClick={() => setActivePage(p.key)}
            className={`rounded-none border-b-2 -mb-px px-6 hover:bg-transparent ${
              activePage === p.key
                ? "border-[#A67C52] text-[#A67C52] hover:text-[#A67C52]"
                : "border-transparent text-gray-400 hover:text-gray-700"
            }`}
          >
            {p.label}
          </Button>
        ))}
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <Card className="sticky top-8">
            <CardHeader className="border-b">
              <CardTitle className="text-base font-bold uppercase tracking-wider text-matte-black">Upload Image</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit}>
                <FieldGroup className="gap-4">
                  <input type="hidden" name="page" value={activePage} />

                  <SelectField label="Section" name="section" required defaultValue="">
                    <NativeSelectOption value="">Select a section…</NativeSelectOption>
                    {pageConfig.sections.map((s) => (
                      <NativeSelectOption key={s.value} value={s.value}>
                        {s.label}
                      </NativeSelectOption>
                    ))}
                  </SelectField>

                  <TextField label="Title" name="title" placeholder="e.g. The Grand Entrance" />
                  <TextareaField label="Description" name="description" rows={3} placeholder="Short description for this zone…" className="[&_textarea]:resize-none" />
                  <TextField label="Button / Action Text" name="action_text" placeholder="e.g. Enter Showroom" />
                  <TextField label="Sort Order" name="sort_order" type="number" defaultValue={0} min={0} />

                  <Field>
                    <FieldLabel htmlFor="image_file">
                      Image <span className="text-destructive">*</span>
                    </FieldLabel>
                    {preview && (
                      <div className="relative w-full h-36 rounded-lg overflow-hidden border border-gray-200">
                        <Image src={preview} alt="Preview" fill className="object-cover" />
                      </div>
                    )}
                    {/* A real button, so the picker is reachable and operable from the keyboard too. */}
                    <button
                      type="button"
                      className="border-2 border-dashed border-gray-200 hover:border-[#A67C52] rounded-lg p-4 text-center cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <ImageIcon className="size-7 mx-auto text-gray-300 mb-1" aria-hidden="true" />
                      <span className="block text-xs text-gray-400">Click to select image</span>
                      <span className="block text-[10px] text-gray-300 mt-0.5">JPG, PNG, WebP recommended</span>
                    </button>
                    <input
                      id="image_file"
                      ref={fileInputRef}
                      name="image_file"
                      type="file"
                      accept="image/*"
                      required
                      className="sr-only"
                      onChange={handleFileChange}
                    />
                  </Field>

                  <FormError error={formError} />
                  {success && (
                    <Alert role="status" className="border-green-200 bg-green-50">
                      <AlertDescription className="text-xs text-green-600">{success}</AlertDescription>
                    </Alert>
                  )}

                  <Button type="submit" variant="brand" disabled={isSaving} className="w-full">
                    {isSaving ? (
                      <>
                        <Loader2Icon className="animate-spin" aria-hidden="true" />
                        Uploading…
                      </>
                    ) : (
                      "Upload Image"
                    )}
                  </Button>
                </FieldGroup>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="border-b">
              <CardTitle className="text-base font-bold uppercase tracking-wider text-matte-black">
                {pageConfig.label} — Uploaded Images
                <span className="ml-2 text-xs font-normal text-gray-400 normal-case">
                  ({filteredMedia.length} image{filteredMedia.length !== 1 ? "s" : ""})
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FormError error={deleteAction.error} className="mb-4" />

              {filteredMedia.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <ImageIcon className="size-12 text-gray-200 mb-3" strokeWidth={1} aria-hidden="true" />
                  <p className="text-sm text-gray-400">No images uploaded yet for this page.</p>
                  <p className="text-xs text-gray-300 mt-1">Use the form to upload your first image.</p>
                </div>
              ) : (
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {filteredMedia
                    .sort((a, b) => a.sort_order - b.sort_order)
                    .map((item) => {
                      const sectionLabel =
                        pageConfig.sections.find((s) => s.value === item.section)?.label ?? item.section;
                      return (
                        <li
                          key={item.id}
                          className="group relative border border-gray-100 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                        >
                          <div className="relative w-full h-48 bg-gray-100">
                            <Image
                              src={item.image_url}
                              alt={item.title || item.section}
                              fill
                              className="object-cover"
                              sizes="(max-width: 640px) 100vw, 50vw"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity flex items-center justify-center">
                              <Button
                                type="button"
                                variant="danger"
                                size="lg"
                                onClick={() => handleDelete(item)}
                                disabled={deletingId === item.id}
                              >
                                {deletingId === item.id ? "Deleting…" : "Delete"}
                              </Button>
                            </div>
                          </div>

                          <div className="p-4">
                            <span className="text-[10px] font-bold text-[#A67C52] uppercase tracking-widest">
                              {sectionLabel}
                            </span>
                            {item.title && (
                              <p className="text-sm font-semibold text-gray-800 mt-0.5 truncate">{item.title}</p>
                            )}
                            {item.description && (
                              <p className="text-xs text-gray-400 mt-1 line-clamp-2">{item.description}</p>
                            )}
                            {item.action_text && (
                              <span className="inline-block mt-2 text-[10px] bg-gray-100 text-gray-500 px-2 py-1 rounded font-medium">
                                Button: {item.action_text}
                              </span>
                            )}
                          </div>
                        </li>
                      );
                    })}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
