"use client";

import { useState } from "react";
import { addCategory, updateCategory } from "../actions";
import Link from "next/link";

type Category = {
  id: string;
  name: string;
};

export default function CategoryForm({ initialData, cancelUrl }: { initialData?: Category, cancelUrl?: string }) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);

    try {
      if (initialData) {
        await updateCategory(formData);
        alert('Category updated successfully!');
      } else {
        await addCategory(formData);
        alert('Category added successfully!');
      }
      if (cancelUrl) {
        window.location.href = cancelUrl;
      } else {
        e.currentTarget.reset();
      }
    } catch (error: unknown) {
      alert(`Error: ${(error as Error).message || 'Something went wrong.'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {initialData && <input type="hidden" name="id" value={initialData.id} />}

      <div>
        <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Category Name</label>
        <input required name="name" defaultValue={initialData?.name} type="text" className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-sm text-gray-900" placeholder="e.g. Windows" />
      </div>

      <div className="flex gap-3 mt-6">
        {cancelUrl && (
          <Link href={cancelUrl} className="w-1/3 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 rounded-md uppercase tracking-widest text-xs font-bold transition-colors shadow-sm flex items-center justify-center">
            Cancel
          </Link>
        )}
        <button type="submit" disabled={isSubmitting} className="flex-1 bg-[#A67C52] hover:bg-[#8e6944] text-white py-3 rounded-md uppercase tracking-widest text-xs font-bold transition-colors shadow-md disabled:opacity-50">
          {isSubmitting ? "Saving..." : (initialData ? "Update Category" : "Add Category")}
        </button>
      </div>
    </form>
  );
}
