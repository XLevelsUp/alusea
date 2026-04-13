"use client";

import { useState, useRef, useEffect } from "react";
import { addProduct, updateProduct } from "../actions";
import Image from "next/image";

type Product = {
  id: string;
  name: string;
  category: string;
  description: string;
  specs: Record<string, string>;
  image_url: string;
  image_urls?: string[];
};

export default function ProductForm({ initialData, onCancel }: { initialData?: Product, onCancel?: () => void }) {
  const [specs, setSpecs] = useState<{key: string, value: string}[]>([{ key: "", value: "" }]);
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingUrls, setExistingUrls] = useState<string[]>(() => {
    const raw = initialData?.image_urls;
    if (Array.isArray(raw) && raw.length > 0) return raw;
    if (typeof raw === 'string') { try { return JSON.parse(raw); } catch {} }
    if (initialData?.image_url) return [initialData.image_url];
    return [];
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleRemoveExistingUrl = (index: number) => {
    setExistingUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (existingUrls.length === 0 && files.length === 0) {
      alert('Please keep or upload at least one image.');
      return;
    }
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    // Override existing_urls with the current (possibly pruned) state
    formData.set('existing_urls', JSON.stringify(existingUrls));
    // Append only the new files (file input may contain stale values)
    formData.delete('image_files');
    files.forEach((file) => formData.append('image_files', file));
    try {
      if (initialData) {
        await updateProduct(formData);
        alert('Product updated successfully!');
      } else {
        await addProduct(formData);
        alert('Product added successfully!');
        e.currentTarget.reset();
        setFiles([]);
        setSpecs([{ key: "", value: "" }]);
      }
    } catch (error: any) {
      alert(`Error: ${error.message || 'Something went wrong.'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (initialData) {
      if (initialData.specs) {
         const entries = Object.entries(initialData.specs);
         setSpecs(entries.length > 0 ? entries.map(([k, v]) => ({ key: k, value: v })) : [{ key: "", value: "" }]);
      }
      // Defensively parse image_urls — may be null, array, or a JSON string
      let urls: string[] = [];
      const raw = initialData.image_urls;
      if (Array.isArray(raw) && raw.length > 0) {
        urls = raw;
      } else if (typeof raw === 'string') {
        try { urls = JSON.parse(raw); } catch {}
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

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
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
    <form onSubmit={handleSubmit} className="space-y-4">
      {initialData && <input type="hidden" name="id" value={initialData.id} />}
      <input type="hidden" name="existing_urls" value={existingUrlsString} />

      <div>
        <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Product Name</label>
        <input required name="name" defaultValue={initialData?.name} type="text" className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-sm text-gray-900" placeholder="e.g. MasterLine Door" />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Category</label>
        <select required name="category" defaultValue={initialData?.category || "Doors"} className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-sm text-gray-900">
          <option value="Doors">Doors</option>
          <option value="Windows">Windows</option>
          <option value="Windows & Sliding">Windows & Sliding</option>
          <option value="Specialty">Specialty</option>
        </select>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Product Images</label>
        <div 
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`w-full p-6 border-2 border-dashed rounded-xl text-center cursor-pointer transition-colors ${isDragging ? "border-[#A67C52] bg-[#A67C52]/5" : "border-gray-300 bg-gray-50 hover:bg-gray-100"}`}
        >
          <svg className="mx-auto h-8 w-8 text-gray-400 mb-2" stroke="currentColor" fill="none" viewBox="0 0 48 48">
            <path d="M24 8v32M8 24h32" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <p className="text-sm text-gray-500 font-medium">Click or drag images here</p>
          <p className="text-[10px] text-gray-400 mt-1">Upload multiple files for your product gallery.</p>
        </div>
        <input 
          required={!initialData && files.length === 0} 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          name="image_files" 
          type="file" 
          accept="image/*" 
          multiple 
          className="hidden" 
        />

        {/* Existing Previews */}
        {initialData && existingUrls.length > 0 && (
          <div className="mt-3">
            <p className="text-xs font-semibold text-gray-500 mb-2 uppercase">Existing Gallery</p>
            <div className="flex flex-wrap gap-2">
              {existingUrls.map((url, i) => (
                <div key={i} className="relative w-16 h-16 rounded overflow-hidden border border-gray-200 group">
                  <Image src={url} alt="Existing" fill className="object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemoveExistingUrl(i)}
                    className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold"
                    title="Remove image"
                  >✕</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* New Previews */}
        {files.length > 0 && (
          <div className="mt-3">
            <p className="text-xs font-semibold text-[#A67C52] mb-2 uppercase">New Uploads Queued ({files.length})</p>
            <div className="flex flex-wrap gap-2">
              {files.map((file, i) => (
                <div key={i} className="relative w-16 h-16 rounded overflow-hidden border border-[#A67C52]/30 group">
                  <Image src={URL.createObjectURL(file)} alt="Preview" fill className="object-cover" />
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setFiles((prev) => prev.filter((_, fi) => fi !== i)); }}
                    className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold"
                    title="Remove image"
                  >✕</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Description</label>
        <textarea required name="description" defaultValue={initialData?.description} rows={3} className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-sm text-gray-900" placeholder="Short product description..." />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Specifications</label>
        {specs.map((spec, index) => (
           <div key={index} className="flex gap-2 mb-2 items-center">
            <input
              type="text"
              placeholder="Key (e.g. Material)"
              value={spec.key}
              onChange={(e) => handleSpecChange(index, "key", e.target.value)}
              className="w-1/2 px-3 py-2 text-xs border border-gray-200 rounded-md bg-gray-50 text-gray-900"
            />
            <input
              type="text"
              placeholder="Value (e.g. Premium)"
              value={spec.value}
              onChange={(e) => handleSpecChange(index, "value", e.target.value)}
              className="w-1/2 px-3 py-2 text-xs border border-gray-200 rounded-md bg-gray-50 text-gray-900"
            />
            <button
              type="button"
              onClick={() => handleRemoveSpec(index)}
              className="text-red-400 hover:text-red-600 p-1 flex-shrink-0 flex items-center justify-center transition-colors"
            >
              ✕
            </button>
          </div>
        ))}
        <button type="button" onClick={handleAddSpec} className="text-xs text-[#A67C52] font-semibold uppercase hover:underline flex items-center gap-1 mt-1 transition-all">
          + Add Specification
        </button>
        <input type="hidden" name="specs" value={specsString} />
      </div>

      <div className="flex gap-3 mt-6">
        {onCancel && (
          <button type="button" onClick={onCancel} className="w-1/3 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 rounded-md uppercase tracking-widest text-xs font-bold transition-colors shadow-sm">
            Cancel
          </button>
        )}
        <button type="submit" disabled={isSubmitting} className="flex-1 bg-[#A67C52] hover:bg-[#8e6944] text-white py-3 rounded-md uppercase tracking-widest text-xs font-bold transition-colors shadow-md disabled:opacity-50">
          {isSubmitting ? "Saving..." : (initialData ? "Update Product" : "Add Product")}
        </button>
      </div>
    </form>
  );
}
