"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { formatPaise, parseRupeesToPaise } from "@/lib/erp/money";
import type { Expense } from "@/lib/supabase/types";

export type CategoryOption = { id: string; name: string };
export type VendorOption = { id: string; name: string };

const METHODS = [
  { value: "cash", label: "Cash" },
  { value: "bank_transfer", label: "Bank transfer" },
  { value: "upi", label: "UPI" },
  { value: "cheque", label: "Cheque" },
  { value: "card", label: "Card" },
  { value: "other", label: "Other" },
];

function isRedirect(error: unknown): boolean {
  return !!error && typeof error === "object" && "digest" in error && String(error.digest).startsWith("NEXT_REDIRECT");
}

export default function ExpenseForm({
  initialData,
  categories,
  vendors,
  save,
  cancelUrl,
}: {
  initialData?: Expense;
  categories: CategoryOption[];
  vendors: VendorOption[];
  save: (formData: FormData) => Promise<void>;
  cancelUrl: string;
}) {
  const isEdit = !!initialData;
  const [amount, setAmount] = useState(initialData ? (initialData.amount_paise / 100).toFixed(2) : "");
  const [tax, setTax] = useState(initialData?.tax_paise ? (initialData.tax_paise / 100).toFixed(2) : "");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const amountPaise = parseRupeesToPaise(amount);
  const taxPaise = parseRupeesToPaise(tax);
  const netPaise = Math.max(0, amountPaise - taxPaise);

  function onSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        await save(formData);
      } catch (e) {
        if (isRedirect(e)) throw e;
        setError(e instanceof Error ? e.message : "Could not save");
      }
    });
  }

  return (
    <form action={onSubmit} className="space-y-6">
      {isEdit && <input type="hidden" name="id" value={initialData.id} />}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="description">
              What was it for <span className="text-red-500">*</span>
            </label>
            <input
              id="description"
              name="description"
              required
              defaultValue={initialData?.description}
              placeholder="Aluminium sections for the Sharma job"
              className="rounded-md px-4 py-2 bg-gray-50 border border-gray-200 w-full text-black"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="category_id">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              id="category_id"
              name="category_id"
              required
              defaultValue={initialData?.category_id ?? ""}
              className="rounded-md px-4 py-2 bg-gray-50 border border-gray-200 w-full text-black"
            >
              <option value="">Select a category…</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="spent_on">
              Date
            </label>
            <input
              id="spent_on"
              name="spent_on"
              type="date"
              defaultValue={initialData?.spent_on ?? new Date().toISOString().slice(0, 10)}
              className="rounded-md px-4 py-2 bg-gray-50 border border-gray-200 w-full text-black"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="amount">
              Amount paid <span className="text-red-500">*</span>
            </label>
            <input
              id="amount"
              name="amount"
              required
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="rounded-md px-4 py-2 bg-gray-50 border border-gray-200 w-full text-black"
            />
            <p className="text-xs text-gray-400 mt-1">The total including any GST</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="tax">
              GST portion
            </label>
            <input
              id="tax"
              name="tax"
              inputMode="decimal"
              value={tax}
              onChange={(e) => setTax(e.target.value)}
              placeholder="0.00"
              className="rounded-md px-4 py-2 bg-gray-50 border border-gray-200 w-full text-black"
            />
            <p className="text-xs text-gray-400 mt-1">
              {taxPaise > 0 ? `Net of GST: ${formatPaise(netPaise)}` : "The GST already inside the amount, if any"}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="payment_method">
              Paid by
            </label>
            <select
              id="payment_method"
              name="payment_method"
              defaultValue={initialData?.payment_method ?? "cash"}
              className="rounded-md px-4 py-2 bg-gray-50 border border-gray-200 w-full text-black"
            >
              {METHODS.map((method) => (
                <option key={method.value} value={method.value}>
                  {method.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="party_id">
              Vendor
            </label>
            <select
              id="party_id"
              name="party_id"
              defaultValue={initialData?.party_id ?? ""}
              className="rounded-md px-4 py-2 bg-gray-50 border border-gray-200 w-full text-black"
            >
              <option value="">Not recorded</option>
              {vendors.map((vendor) => (
                <option key={vendor.id} value={vendor.id}>
                  {vendor.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="reference">
              Reference
            </label>
            <input
              id="reference"
              name="reference"
              defaultValue={initialData?.reference}
              placeholder="Bill number, UTR…"
              className="rounded-md px-4 py-2 bg-gray-50 border border-gray-200 w-full text-black"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="project_tag">
              Project
            </label>
            <input
              id="project_tag"
              name="project_tag"
              defaultValue={initialData?.project_tag}
              placeholder="Optional, to group by job"
              className="rounded-md px-4 py-2 bg-gray-50 border border-gray-200 w-full text-black"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="notes">
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={2}
              defaultValue={initialData?.notes}
              className="rounded-md px-4 py-2 bg-gray-50 border border-gray-200 w-full text-black"
            />
          </div>
        </div>
      </div>

      {error && <p className="p-4 bg-red-50 text-red-600 text-sm rounded-md border border-red-100">{error}</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="px-6 py-3 bg-[#A67C52] text-white text-xs font-bold uppercase tracking-wider rounded-sm hover:bg-[#8e6944] transition-colors shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? "Saving…" : isEdit ? "Save Changes" : "Save Expense"}
        </button>
        <Link
          href={cancelUrl}
          className="px-5 py-3 border border-gray-200 text-gray-600 rounded-md uppercase tracking-widest text-xs font-bold hover:bg-gray-50 transition-colors"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
