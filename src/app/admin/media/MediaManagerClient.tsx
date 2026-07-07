"use client";

import { useState, useRef, useTransition } from "react";
import Image from "next/image";
import { addPageMedia, deletePageMedia } from "../mediaActions";
import { createClient } from '@/utils/supabase/client';

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
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const pageConfig = PAGES.find((p) => p.key === activePage)!;
  const filteredMedia = initialMedia.filter((m) => m.page === activePage);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPreview(url);
    } else {
      setPreview(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const formData = new FormData(e.currentTarget);
    const file = formData.get('image_file') as File;
    formData.delete('image_file');

    startTransition(async () => {
      try {
        if (file && file.size > 0) {
          const supabase = createClient();
          const fileExt = file.name.split('.').pop() || 'webp';
          const fileName = `page-media/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
          
          const { error: uploadError } = await supabase.storage
            .from('alusea-assets')
            .upload(fileName, file, { cacheControl: '3600', upsert: false });

          if (uploadError) throw new Error(uploadError.message);
          
          const { data } = supabase.storage.from('alusea-assets').getPublicUrl(fileName);
          formData.set('new_uploaded_url', data.publicUrl);
        }

        await addPageMedia(formData);
        setSuccess("Image uploaded successfully!");
        formRef.current?.reset();
        setPreview(null);
        setTimeout(() => setSuccess(null), 3000);
      } catch (err: unknown) {
        setError((err as Error).message || "Upload failed");
      }
    });
  };

  const handleDelete = async (item: MediaItem) => {
    if (!confirm(`Delete image for "${item.section}"?`)) return;
    setDeletingId(item.id);
    try {
      await deletePageMedia(item.id, item.image_url);
    } catch (err: unknown) {
      alert("Delete failed: " + (err as Error).message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold uppercase tracking-tight text-matte-black">
          Page Media Manager
        </h1>
        <p className="text-gray-500 mt-2">
          Upload and manage images displayed across different sections of the website.
        </p>
      </div>

      {/* Page Tabs */}
      <div className="flex gap-2 mb-8 border-b border-gray-200">
        {PAGES.map((p) => (
          <button
            key={p.key}
            onClick={() => setActivePage(p.key)}
            className={`px-6 py-3 text-sm font-semibold uppercase tracking-wider transition-all border-b-2 -mb-px ${
              activePage === p.key
                ? "border-[#A67C52] text-[#A67C52]"
                : "border-transparent text-gray-400 hover:text-gray-700"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upload Form */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 sticky top-8">
            <h2 className="text-base font-bold uppercase tracking-wider text-matte-black mb-5 border-b pb-3">
              Upload Image
            </h2>

            <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
              <input type="hidden" name="page" value={activePage} />

              {/* Section */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Section *
                </label>
                <select
                  name="section"
                  required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#A67C52]/40"
                >
                  <option value="">Select a section…</option>
                  {pageConfig.sections.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Title
                </label>
                <input
                  name="title"
                  type="text"
                  placeholder="e.g. The Grand Entrance"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#A67C52]/40"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  rows={3}
                  placeholder="Short description for this zone…"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 resize-none focus:outline-none focus:ring-2 focus:ring-[#A67C52]/40"
                />
              </div>

              {/* Action Text */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Button / Action Text
                </label>
                <input
                  name="action_text"
                  type="text"
                  placeholder="e.g. Enter Showroom"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#A67C52]/40"
                />
              </div>

              {/* Sort Order */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Sort Order
                </label>
                <input
                  name="sort_order"
                  type="number"
                  defaultValue={0}
                  min={0}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#A67C52]/40"
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Image *
                </label>
                {preview && (
                  <div className="relative w-full h-36 rounded-lg overflow-hidden mb-2 border border-gray-200">
                    <Image src={preview} alt="Preview" fill className="object-cover" />
                  </div>
                )}
                <div
                  className="border-2 border-dashed border-gray-200 hover:border-[#A67C52] rounded-lg p-4 text-center cursor-pointer transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <svg className="w-7 h-7 mx-auto text-gray-300 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-xs text-gray-400">Click to select image</p>
                  <p className="text-[10px] text-gray-300 mt-0.5">JPG, PNG, WebP recommended</p>
                </div>
                <input
                  ref={fileInputRef}
                  name="image_file"
                  type="file"
                  accept="image/*"
                  required
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>

              {/* Feedback */}
              {error && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-600">
                  {error}
                </div>
              )}
              {success && (
                <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-xs text-green-600">
                  {success}
                </div>
              )}

              <button
                type="submit"
                disabled={isPending}
                className="w-full py-3 bg-[#A67C52] hover:bg-[#8a6340] text-white text-xs font-bold uppercase tracking-widest rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isPending ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Uploading…
                  </>
                ) : (
                  "Upload Image"
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Media Grid */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-base font-bold uppercase tracking-wider text-matte-black mb-5 border-b pb-3">
              {pageConfig.label} — Uploaded Images
              <span className="ml-2 text-xs font-normal text-gray-400 normal-case">
                ({filteredMedia.length} image{filteredMedia.length !== 1 ? "s" : ""})
              </span>
            </h2>

            {filteredMedia.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <svg className="w-12 h-12 text-gray-200 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-sm text-gray-400">No images uploaded yet for this page.</p>
                <p className="text-xs text-gray-300 mt-1">Use the form to upload your first image.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {filteredMedia
                  .sort((a, b) => a.sort_order - b.sort_order)
                  .map((item) => {
                    const sectionLabel =
                      pageConfig.sections.find((s) => s.value === item.section)?.label ?? item.section;
                    return (
                      <div
                        key={item.id}
                        className="group relative border border-gray-100 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                      >
                        {/* Image */}
                        <div className="relative w-full h-48 bg-gray-100">
                          <Image
                            src={item.image_url}
                            alt={item.title || item.section}
                            fill
                            className="object-cover"
                            sizes="(max-width: 640px) 100vw, 50vw"
                          />
                          {/* Delete overlay */}
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button
                              onClick={() => handleDelete(item)}
                              disabled={deletingId === item.id}
                              className="bg-red-500 hover:bg-red-600 text-white text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-lg transition-colors disabled:opacity-60"
                            >
                              {deletingId === item.id ? "Deleting…" : "Delete"}
                            </button>
                          </div>
                        </div>

                        {/* Info */}
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
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
