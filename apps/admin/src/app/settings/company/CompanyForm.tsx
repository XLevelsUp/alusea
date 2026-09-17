"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { INDIAN_STATES } from "@/lib/erp/states";
import type { CompanyProfile } from "@/lib/supabase/types";

type Props = {
  profile: CompanyProfile;
  save: (formData: FormData) => Promise<void>;
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

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="mb-5">
        <h2 className="text-sm font-bold uppercase tracking-wider text-matte-black">{title}</h2>
        {description && <p className="text-xs text-gray-400 mt-1">{description}</p>}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>
    </div>
  );
}

export default function CompanyForm({ profile, save }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function onSubmit(formData: FormData) {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      try {
        await save(formData);
        setSaved(true);
        // This page has no list to return to, so it refreshes in place: the fields then show what is actually stored rather than what was typed.
        router.refresh();
        window.scrollTo({ top: 0, behavior: "smooth" });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not save");
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    });
  }

  return (
    <form action={onSubmit} className="space-y-6">
      <Section title="Identity" description="Printed as the supplier on every invoice and quotation.">
        <Field label="Legal name" name="legal_name" defaultValue={profile.legal_name} required placeholder="Alusea Aluminium Systems Pvt Ltd" />
        <Field label="Trade name" name="trade_name" defaultValue={profile.trade_name} placeholder="Alusea" hint="Shown if different from the legal name" />
      </Section>

      <Section title="Registered address" description="The state here decides whether an invoice charges IGST or CGST plus SGST.">
        <Field label="Address line 1" name="address_line1" defaultValue={profile.address_line1} />
        <Field label="Address line 2" name="address_line2" defaultValue={profile.address_line2} />
        <Field label="City" name="city" defaultValue={profile.city} />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="state_code">
            State
          </label>
          <select
            id="state_code"
            name="state_code"
            defaultValue={profile.state_code}
            className="rounded-md px-4 py-2 bg-gray-50 border border-gray-200 w-full text-black focus:outline-none focus:ring-2 focus:ring-[#A67C52]/40"
          >
            <option value="">Select a state</option>
            {INDIAN_STATES.map((state) => (
              <option key={state.code} value={state.code}>
                {state.code} — {state.name}
              </option>
            ))}
          </select>
        </div>
        <Field label="PIN code" name="pincode" defaultValue={profile.pincode} />
        <Field label="Phone" name="phone" defaultValue={profile.phone} />
        <Field label="Email" name="email" type="email" defaultValue={profile.email} />
        <Field label="Website" name="website" defaultValue={profile.website} />
      </Section>

      <Section title="Tax registration" description="Leave blank if not registered; invoices will then have GST switched off.">
        <Field label="GSTIN" name="gstin" defaultValue={profile.gstin} placeholder="33ABCDE1234F1Z5" hint="15 characters, starting with your state code" />
        <Field label="PAN" name="pan" defaultValue={profile.pan} placeholder="ABCDE1234F" />
        <Field
          label="Default GST rate (%)"
          name="default_gst_rate"
          type="number"
          defaultValue={profile.default_gst_rate}
          hint="Pre-selected on new invoices, still changeable per invoice"
        />
      </Section>

      <Section title="Bank details" description="Printed on invoices so clients know where to pay.">
        <Field label="Bank name" name="bank_name" defaultValue={profile.bank_name} />
        <Field label="Account name" name="bank_account_name" defaultValue={profile.bank_account_name} />
        <Field label="Account number" name="bank_account_number" defaultValue={profile.bank_account_number} />
        <Field label="IFSC" name="bank_ifsc" defaultValue={profile.bank_ifsc} />
        <Field label="Branch" name="bank_branch" defaultValue={profile.bank_branch} />
      </Section>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="mb-5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-matte-black">Invoice defaults</h2>
          <p className="text-xs text-gray-400 mt-1">Standard wording added to every invoice.</p>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="invoice_terms">
              Terms and conditions
            </label>
            <textarea
              id="invoice_terms"
              name="invoice_terms"
              rows={4}
              defaultValue={profile.invoice_terms}
              placeholder="Payment due within 30 days of invoice date."
              className="rounded-md px-4 py-2 bg-gray-50 border border-gray-200 w-full text-black focus:outline-none focus:ring-2 focus:ring-[#A67C52]/40"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="invoice_footer">
              Footer note
            </label>
            <textarea
              id="invoice_footer"
              name="invoice_footer"
              rows={2}
              defaultValue={profile.invoice_footer}
              placeholder="This is a computer-generated invoice."
              className="rounded-md px-4 py-2 bg-gray-50 border border-gray-200 w-full text-black focus:outline-none focus:ring-2 focus:ring-[#A67C52]/40"
            />
          </div>
        </div>
      </div>

      {error && (
        <p className="p-4 bg-red-50 text-red-600 text-sm rounded-md border border-red-100">{error}</p>
      )}
      {saved && !error && (
        <div className="p-4 bg-green-50 rounded-md border border-green-100">
          <p className="text-green-800 text-sm font-semibold">Company details saved.</p>
          <p className="text-green-700 text-xs mt-1">
            These now appear on every invoice, quotation and payslip.{" "}
            <Link href="/settings/documents" className="underline font-semibold">
              Check how they look on a PDF
            </Link>
            .
          </p>
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="px-6 py-3 bg-[#A67C52] text-white text-xs font-bold uppercase tracking-wider rounded-sm hover:bg-[#8e6944] transition-colors shadow-md disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
        >
          {isPending ? "Saving…" : "Save Company Details"}
        </button>
      </div>
    </form>
  );
}
