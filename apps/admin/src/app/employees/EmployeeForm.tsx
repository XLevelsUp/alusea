"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import type { Employee } from "@/lib/supabase/types";

type Props = {
  initialData?: Employee;
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
  defaultValue?: string | number | null;
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

export default function EmployeeForm({ initialData, add, update, cancelUrl }: Props) {
  const isEdit = !!initialData;
  const [workerType, setWorkerType] = useState(initialData?.worker_type ?? "monthly");
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Employee code" name="employee_code" defaultValue={initialData?.employee_code} required placeholder="EMP-001" />
        <Field label="Full name" name="full_name" defaultValue={initialData?.full_name} required />
        <Field label="Designation" name="designation" defaultValue={initialData?.designation} placeholder="Site Supervisor" />
        <Field label="Joining date" name="joining_date" type="date" defaultValue={initialData?.joining_date} />
      </div>

      <div className="pt-4 border-t border-gray-100">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">Pay</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="worker_type">
              How they are paid <span className="text-red-500">*</span>
            </label>
            <select
              id="worker_type"
              name="worker_type"
              value={workerType}
              onChange={(e) => setWorkerType(e.target.value as "monthly" | "daily")}
              className="rounded-md px-4 py-2 bg-gray-50 border border-gray-200 w-full text-black"
            >
              <option value="monthly">Monthly salary</option>
              <option value="daily">Daily rate</option>
            </select>
            <p className="text-xs text-gray-400 mt-1">
              {workerType === "monthly"
                ? "Prorated over a fixed 30-day month by days worked."
                : "Paid per day worked, with no proration."}
            </p>
          </div>

          <Field
            label={workerType === "monthly" ? "Monthly salary" : "Daily rate"}
            name="default_amount"
            defaultValue={initialData ? (initialData.default_amount_paise / 100).toFixed(2) : ""}
            placeholder="0.00"
            hint="Pre-fills payroll each month, and stays editable there"
          />
        </div>
      </div>

      <div className="pt-4 border-t border-gray-100">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">Contact</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Phone" name="phone" defaultValue={initialData?.phone} />
          <Field label="Address" name="address" defaultValue={initialData?.address} />
        </div>
      </div>

      <div className="pt-4 border-t border-gray-100">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">Bank details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Account name" name="bank_account_name" defaultValue={initialData?.bank_account_name} />
          <Field label="Account number" name="bank_account_number" defaultValue={initialData?.bank_account_number} />
          <Field label="IFSC" name="bank_ifsc" defaultValue={initialData?.bank_ifsc} />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="notes">
          Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={2}
          defaultValue={initialData?.notes ?? ""}
          className="rounded-md px-4 py-2 bg-gray-50 border border-gray-200 w-full text-black"
        />
      </div>

      {error && <p className="p-4 bg-red-50 text-red-600 text-sm rounded-md border border-red-100">{error}</p>}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 bg-matte-black hover:bg-black text-white px-4 py-3 rounded-md uppercase tracking-widest text-xs font-bold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? "Saving…" : isEdit ? "Save Changes" : "Add Employee"}
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
