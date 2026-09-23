"use client";

import { useState, useRef, useEffect } from "react";
import { PlusIcon, XIcon } from "lucide-react";
import { addProduct, updateProduct } from "../actions";
import Image from "next/image";
import Link from "next/link";
import { createClient } from '@/lib/supabase/client';
import { FormError, SelectField, TextareaField, TextField } from "@/components/form-fields";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelectOption } from "@/components/ui/native-select";
import { useAction } from "@/hooks/use-action";

type Product = {
  id: string;
  name: string;
  category: string;
  description: string;
  specs: Record<string, string>;
  image_url: string;
  image_urls?: string[];
  price_per_sqft?: number;
};

export default function ProductForm({ initialData, cancelUrl, categories = [] }: { initialData?: Product, cancelUrl?: string, categories?: string[] }) {
  const [specs, setSpecs] = useState<{ key: string, value: string }[]>([{ key: "", value: "" }]);
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  // Images upload from the browser before the action runs, so that step has its own pending and error state.
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const { run, isPending, error: actionError } = useAction(initialData ? updateProduct : addProduct);
  const [existingUrls, setExistingUrls] = useState<string[]>(() => {
    const raw = initialData?.image_urls;
    if (Array.isArray(raw) && raw.length > 0) return raw;
    if (typeof raw === 'string') { try { return JSON.parse(raw); } catch { } }
    if (initialData?.image_url) return [initialData.image_url];
    return [];
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    // Captured now: React clears currentTarget once the handler returns, before the uploads finish.
    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.set('existing_urls', JSON.stringify(existingUrls));
    formData.delete('image_files'); // We handle files client-side now

    const newUploadedUrls: string[] = [];
    if (files.length > 0) {
      setIsUploading(true);
      const supabase = createClient();
      try {
        for (const file of files) {
          const fileExt = file.name.split('.').pop() || 'webp';
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

          const { error: storageError } = await supabase.storage
            .from('alusea-assets')
            .upload(fileName, file, { cacheControl: '3600', upsert: false });

          if (storageError) {
            console.error('Upload error:', storageError);
            setUploadError(`Failed to upload ${file.name}`);
            return;
          }

          const { data } = supabase.storage.from('alusea-assets').getPublicUrl(fileName);
          newUploadedUrls.push(data.publicUrl);
        }
      } finally {
        setIsUploading(false);
      }
    }

    formData.set('new_uploaded_urls', JSON.stringify(newUploadedUrls));

    const result = await run(formData);
    if (!result.ok) return;

    alert(initialData ? 'Product updated successfully!' : 'Product added successfully!');
    if (cancelUrl) {
      window.location.href = cancelUrl;
    } else if (!initialData) {
      form.reset();
      setFiles([]);
      setSpecs([{ key: "", value: "" }]);
    }
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
    } else {
      setSpecs([{ key: "", value: "" }]);
      setExistingUrls([]);
    }
    setFiles([]);
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
            <PlusIcon className="mx-auto size-8 text-gray-400 mb-2" aria-hidden="true" />
            <span className="block text-sm text-gray-500 font-medium">Click or drag images here</span>
            <span className="block text-[10px] text-gray-400 mt-1">Upload multiple files for your product gallery.</span>
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
          {cancelUrl && (
            <Button asChild variant="secondary" className="w-1/3">
              <Link href={cancelUrl}>Cancel</Link>
            </Button>
          )}
          <Button type="submit" variant="brand" disabled={isSubmitting} className="flex-1">
            {isUploading ? "Uploading…" : isPending ? "Saving…" : initialData ? "Update Product" : "Add Product"}
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
}
