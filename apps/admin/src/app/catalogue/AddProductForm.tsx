"use client";

import { useState, useRef, useEffect } from "react";
import { PlusIcon, VideoIcon, XIcon } from "lucide-react";
import { addProduct, updateProduct } from "../actions";
import Image from "next/image";
import { createClient } from '@/lib/supabase/client';
import { FormError, SelectField, TextareaField, TextField } from "@/components/form-fields";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelectOption } from "@/components/ui/native-select";
import { CancelButton, useFormDone } from "@/components/FormDialog";
import { useAction } from "@/hooks/use-action";

type Product = {
  id: string;
  name: string;
  category: string;
  description: string;
  specs: Record<string, string>;
  image_url: string;
  image_urls?: string[];
  video_urls?: string[];
  price_per_sqft?: number;
};

// Storage rejects larger files, and films this size already load slowly on phones.
const MAX_VIDEO_MB = 50;

export default function ProductForm({ initialData, cancelUrl, categories = [] }: { initialData?: Product, cancelUrl?: string, categories?: string[] }) {
  const [specs, setSpecs] = useState<{ key: string, value: string }[]>([{ key: "", value: "" }]);
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  // Images upload from the browser before the action runs, so that step has its own pending and error state.
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const { run, isPending, error: actionError } = useAction(initialData ? updateProduct : addProduct);
  const done = useFormDone(cancelUrl);
  const [existingUrls, setExistingUrls] = useState<string[]>(() => {
    const raw = initialData?.image_urls;
    if (Array.isArray(raw) && raw.length > 0) return raw;
    if (typeof raw === 'string') { try { return JSON.parse(raw); } catch { } }
    if (initialData?.image_url) return [initialData.image_url];
    return [];
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Films are optional and sit after the photos in the website gallery.
  const [videoFiles, setVideoFiles] = useState<File[]>([]);
  const [existingVideoUrls, setExistingVideoUrls] = useState<string[]>(() => initialData?.video_urls ?? []);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const isSubmitting = isUploading || isPending;
  const error = uploadError ?? actionError;

  const handleRemoveExistingUrl = (index: number) => {
    setExistingUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setUploadError(null);
    if (existingUrls.length === 0 && files.length === 0) {
      setUploadError('Please keep or upload at least one image.');
      return;
    }
    const formData = new FormData(e.currentTarget);
    formData.set('existing_urls', JSON.stringify(existingUrls));
    formData.delete('image_files'); // We handle files client-side now

    const newUploadedUrls: string[] = [];
    const newVideoUrls: string[] = [];
    // Photos go to the top of the bucket as before; films go into their own folder.
    const uploads = [
      ...files.map((file) => ({ file, folder: '', urls: newUploadedUrls })),
      ...videoFiles.map((file) => ({ file, folder: 'videos/', urls: newVideoUrls })),
    ];
    if (uploads.length > 0) {
      setIsUploading(true);
      const supabase = createClient();
      try {
        for (const { file, folder, urls } of uploads) {
          const fileExt = file.name.split('.').pop() || 'webp';
          const fileName = `${folder}${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

          const { error: storageError } = await supabase.storage
            .from('alusea-assets')
            .upload(fileName, file, { cacheControl: '3600', upsert: false });

          if (storageError) {
            console.error('Upload error:', storageError);
            setUploadError(`Failed to upload ${file.name}`);
            return;
          }

          const { data } = supabase.storage.from('alusea-assets').getPublicUrl(fileName);
          urls.push(data.publicUrl);
        }
      } finally {
        setIsUploading(false);
      }
    }

    formData.set('new_uploaded_urls', JSON.stringify(newUploadedUrls));
    formData.set('video_urls', JSON.stringify([...existingVideoUrls, ...newVideoUrls]));
    formData.delete('video_files'); // Uploaded above, straight from the browser

    const result = await run(formData);
    if (!result.ok) return;

    done(initialData ? 'Product updated on the website' : 'Product added to the website');
  };

  useEffect(() => {
    if (initialData) {
      if (initialData.specs) {
        const entries = Object.entries(initialData.specs);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSpecs(entries.length > 0 ? entries.map(([k, v]) => ({ key: k, value: v })) : [{ key: "", value: "" }]);
      }
      // Defensively parse image_urls — may be null, array, or a JSON string
      let urls: string[] = [];
      const raw = initialData.image_urls;
      if (Array.isArray(raw) && raw.length > 0) {
        urls = raw;
      } else if (typeof raw === 'string') {
        try { urls = JSON.parse(raw); } catch { }
      }
      if (urls.length === 0 && initialData.image_url) {
        urls = [initialData.image_url];
      }
      setExistingUrls(urls);
      setExistingVideoUrls(initialData.video_urls ?? []);
    } else {
      setSpecs([{ key: "", value: "" }]);
      setExistingUrls([]);
      setExistingVideoUrls([]);
    }
    setFiles([]);
    setVideoFiles([]);
  }, [initialData]);

  const handleAddSpec = () => setSpecs([...specs, { key: "", value: "" }]);
  const handleRemoveSpec = (index: number) => setSpecs(specs.filter((_, i) => i !== index));
  const handleSpecChange = (index: number, field: "key" | "value", value: string) => {
    const newSpecs = [...specs];
    newSpecs[index][field] = value;
    setSpecs(newSpecs);
  };

  const specsString = specs
    .filter((s) => s.key.trim() !== "")
    .map((s) => `${s.key}: ${s.value}`)
    .join("\n");

  const existingUrlsString = JSON.stringify(existingUrls);

  const handleDragOver = (e: React.DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFiles((prev) => [...prev, ...Array.from(e.dataTransfer.files)]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? []);
    // The same file can be picked again after it is removed.
    e.target.value = "";
    const tooBig = picked.find((file) => file.size > MAX_VIDEO_MB * 1024 * 1024);
    if (tooBig) {
      setUploadError(`${tooBig.name} is larger than ${MAX_VIDEO_MB} MB. Please compress it and try again.`);
      return;
    }
    setUploadError(null);
    setVideoFiles((prev) => [...prev, ...picked]);
  };

  // The stored name is all a saved film has to show for itself.
  const videoName = (url: string) => decodeURIComponent(url.split('/').pop() || url);

  return (
    <form onSubmit={handleSubmit}>
      <FieldGroup>
        {initialData && <input type="hidden" name="id" value={initialData.id} />}
        <input type="hidden" name="existing_urls" value={existingUrlsString} />

        <TextField label="Product Name" name="name" required defaultValue={initialData?.name} placeholder="e.g. MasterLine Door" />

        <SelectField
          label="Category"
          name="category"
          required
          defaultValue={(initialData?.category === "Windows & Sliding" ? "Sliding Systems" : initialData?.category) || categories[0] || ""}
        >
          {categories.length === 0 && <NativeSelectOption value="" disabled>No categories yet — add one first</NativeSelectOption>}
          {categories.map((category) => (
            <NativeSelectOption key={category} value={category}>{category}</NativeSelectOption>
          ))}
        </SelectField>

        <Field>
          <FieldLabel htmlFor="image_files">Product Images</FieldLabel>
          {/* A real button, so the drop zone is reachable and operable from the keyboard too. */}
          <button
            type="button"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`w-full p-6 border-2 border-dashed rounded-xl text-center cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 ${isDragging ? "border-[#A67C52] bg-[#A67C52]/5" : "border-gray-300 bg-gray-50 hover:bg-gray-100"}`}
          >
            <PlusIcon className="mx-auto size-8 text-gray-500 mb-2" aria-hidden="true" />
            <span className="block text-sm text-gray-500 font-medium">Click or drag images here</span>
            <span className="block text-[11px] text-gray-500 mt-1">Upload multiple files for your product gallery.</span>
          </button>
          <input
            id="image_files"
            required={!initialData && files.length === 0}
            ref={fileInputRef}
            onChange={handleFileChange}
            name="image_files"
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
          />

          {initialData && existingUrls.length > 0 && (
            <div>
              <FieldDescription className="text-xs font-semibold uppercase mb-2">Existing Gallery</FieldDescription>
              <ul className="flex flex-wrap gap-2">
                {existingUrls.map((url, i) => (
                  <li key={i} className="relative w-16 h-16 rounded overflow-hidden border border-gray-200 group">
                    <Image src={url} alt="Existing" fill className="object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveExistingUrl(i)}
                      className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
                      aria-label="Remove image"
                    >
                      <XIcon className="size-4" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {files.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-[#A67C52] mb-2 uppercase">New Uploads Queued ({files.length})</p>
              <ul className="flex flex-wrap gap-2">
                {files.map((file, i) => (
                  <li key={i} className="relative w-16 h-16 rounded overflow-hidden border border-[#A67C52]/30 group">
                    <Image src={URL.createObjectURL(file)} alt="Preview" fill className="object-cover" />
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setFiles((prev) => prev.filter((_, fi) => fi !== i)); }}
                      className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
                      aria-label={`Remove ${file.name}`}
                    >
                      <XIcon className="size-4" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Field>

        <Field>
          <FieldLabel htmlFor="video_files">Product Videos (optional)</FieldLabel>
          <Button type="button" variant="outline" onClick={() => videoInputRef.current?.click()} className="self-start">
            <VideoIcon aria-hidden="true" />
            Add videos
          </Button>
          <FieldDescription>MP4 or WebM, up to {MAX_VIDEO_MB} MB each. On the website they follow the photos in the product gallery and play without sound.</FieldDescription>
          <input
            id="video_files"
            ref={videoInputRef}
            onChange={handleVideoChange}
            name="video_files"
            type="file"
            accept="video/mp4,video/webm"
            multiple
            className="sr-only"
          />

          {(existingVideoUrls.length > 0 || videoFiles.length > 0) && (
            <ul className="flex flex-col gap-2">
              {existingVideoUrls.map((url, i) => (
                <li key={url} className="flex items-center gap-3 rounded-lg border border-gray-200 px-3 py-2 text-xs">
                  <VideoIcon aria-hidden="true" className="size-4 shrink-0 text-gray-500" />
                  <a href={url} target="_blank" rel="noopener noreferrer" className="min-w-0 flex-1 truncate text-gray-700 underline-offset-2 hover:underline">{videoName(url)}</a>
                  <Button type="button" variant="ghost" size="icon-sm" onClick={() => setExistingVideoUrls((prev) => prev.filter((_, vi) => vi !== i))} aria-label={`Remove video ${videoName(url)}`} className="text-red-400 hover:text-red-600">
                    <XIcon />
                  </Button>
                </li>
              ))}
              {videoFiles.map((file, i) => (
                <li key={`${file.name}-${i}`} className="flex items-center gap-3 rounded-lg border border-[#A67C52]/30 px-3 py-2 text-xs">
                  <VideoIcon aria-hidden="true" className="size-4 shrink-0 text-[#A67C52]" />
                  <span className="min-w-0 flex-1 truncate text-gray-700">{file.name}</span>
                  <span className="shrink-0 text-gray-500">{(file.size / 1048576).toFixed(1)} MB · new</span>
                  <Button type="button" variant="ghost" size="icon-sm" onClick={() => setVideoFiles((prev) => prev.filter((_, vi) => vi !== i))} aria-label={`Remove ${file.name}`} className="text-red-400 hover:text-red-600">
                    <XIcon />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </Field>

        <TextField
          label="Starting Price (₹ per sq ft)"
          name="price_per_sqft"
          type="number"
          min={0}
          step="1"
          defaultValue={initialData?.price_per_sqft ?? 1500}
          hint="Used for the WhatsApp product catalog"
        />

        <TextareaField label="Description" name="description" required rows={3} defaultValue={initialData?.description} placeholder="Short product description..." />

        <FieldSet>
          <FieldLegend variant="label">Specifications</FieldLegend>
          {specs.map((spec, index) => (
            <div key={index} className="flex gap-2 items-center">
              <Input
                placeholder="Key (e.g. Material)"
                aria-label={`Specification ${index + 1} name`}
                value={spec.key}
                onChange={(e) => handleSpecChange(index, "key", e.target.value)}
                className="w-1/2 h-9 text-xs"
              />
              <Input
                placeholder="Value (e.g. Premium)"
                aria-label={`Specification ${index + 1} value`}
                value={spec.value}
                onChange={(e) => handleSpecChange(index, "value", e.target.value)}
                className="w-1/2 h-9 text-xs"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => handleRemoveSpec(index)}
                aria-label={`Remove specification ${index + 1}`}
                className="text-red-400 hover:text-red-600"
              >
                <XIcon />
              </Button>
            </div>
          ))}
          <Button type="button" variant="link" onClick={handleAddSpec} className="self-start h-auto p-0 text-[#A67C52]">
            + Add Specification
          </Button>
          <input type="hidden" name="specs" value={specsString} />
        </FieldSet>

        <FormError error={error} />

        <div className="flex gap-3">
          <CancelButton cancelUrl={cancelUrl} className="w-1/3" />
          <Button type="submit" variant="brand" disabled={isSubmitting} className="flex-1">
            {isUploading ? "Uploading…" : isPending ? "Saving…" : initialData ? "Update Product" : "Add Product"}
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
}
