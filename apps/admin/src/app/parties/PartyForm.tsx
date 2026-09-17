"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { INDIAN_STATES } from "@/lib/erp/states";
import type { Party } from "@/lib/supabase/types";

type Props = {
  initialData?: Party;
  add: (formData: FormData) => Promise<void>;
  update: (formData: FormData) => Promise<void>;
  cancelUrl: string;
};

function Field({
  label,
  name,
  defaultValue,
  required,
  placeholder,
  hint,
  type = "text",
}: {
  label: string;
  name: string;
  defaultValue?: string | number;
  required?: boolean;
  placeholder?: string;
  hint?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor={name}>
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        defaultValue={defaultValue ?? ""}
        className="rounded-md px-4 py-2 bg-gray-50 border border-gray-200 w-full text-black focus:outline-none focus:ring-2 focus:ring-[#A67C52]/40"
      />
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

export default function PartyForm({ initialData, add, update, cancelUrl }: Props) {
  const isEdit = !!initialData;
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        await (isEdit ? update(formData) : add(formData));
        window.location.href = cancelUrl;
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not save");
      }
    });
  }

  return (
    <form action={onSubmit} className="space-y-5">
      {isEdit && <input type="hidden" name="id" value={initialData.id} />}

      <Field label="Name" name="name" defaultValue={initialData?.name} required placeholder="Sharma Constructions Pvt Ltd" />

      <div className="flex gap-6">
        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input type="checkbox" name="is_client" defaultChecked={initialData?.is_client ?? true} className="w-4 h-4 accent-[#A67C52]" />
          Client
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input type="checkbox" name="is_vendor" defaultChecked={initialData?.is_vendor ?? false} className="w-4 h-4 accent-[#A67C52]" />
          Vendor
        </label>
      </div>
      <p className="text-xs text-gray-400 -mt-3">A party can be both, for example a supplier you also sell to.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Contact person" name="contact_person" defaultValue={initialData?.contact_person} />
        <Field label="Phone" name="phone" defaultValue={initialData?.phone} />
        <Field label="Email" name="email" type="email" defaultValue={initialData?.email} />
        <Field
          label="Payment terms (days)"
          name="payment_terms_days"
          type="number"
          defaultValue={initialData?.payment_terms_days ?? 0}
          hint="Used to work out an invoice due date"
        />
      </div>

      <div className="pt-2 border-t border-gray-100">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3 mt-4">Billing address</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Address line 1" name="billing_address_line1" defaultValue={initialData?.billing_address_line1} />
          <Field label="Address line 2" name="billing_address_line2" defaultValue={initialData?.billing_address_line2} />
          <Field label="City" name="billing_city" defaultValue={initialData?.billing_city} />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="billing_state_code">
              State
            </label>
            <select
              id="billing_state_code"
              name="billing_state_code"
              defaultValue={initialData?.billing_state_code ?? ""}
              className="rounded-md px-4 py-2 bg-gray-50 border border-gray-200 w-full text-black focus:outline-none focus:ring-2 focus:ring-[#A67C52]/40"
            >
              <option value="">Select a state</option>
              {INDIAN_STATES.map((state) => (
                <option key={state.code} value={state.code}>
                  {state.code} — {state.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-1">Decides IGST or CGST plus SGST on their invoices</p>
          </div>
          <Field label="PIN code" name="billing_pincode" defaultValue={initialData?.billing_pincode} />
        </div>
      </div>

      <div className="pt-2 border-t border-gray-100">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3 mt-4">Tax details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="GSTIN" name="gstin" defaultValue={initialData?.gstin} placeholder="33ABCDE1234F1Z5" hint="Leave blank if unregistered" />
          <Field label="PAN" name="pan" defaultValue={initialData?.pan} placeholder="ABCDE1234F" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="notes">
          Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          defaultValue={initialData?.notes ?? ""}
          className="rounded-md px-4 py-2 bg-gray-50 border border-gray-200 w-full text-black focus:outline-none focus:ring-2 focus:ring-[#A67C52]/40"
        />
      </div>

      {error && <p className="p-4 bg-red-50 text-red-600 text-sm rounded-md border border-red-100">{error}</p>}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 bg-matte-black hover:bg-black text-white px-4 py-3 rounded-md uppercase tracking-widest text-xs font-bold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? "Saving…" : isEdit ? "Save Changes" : "Add Party"}
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
