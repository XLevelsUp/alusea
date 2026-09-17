"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import LineItemsEditor, { type EditorLine, type ProductOption } from "./LineItemsEditor";

export type PartyOption = {
  id: string;
  name: string;
  stateCode: string;
  stateName: string;
  gstin: string;
};

type Props = {
  kind: "quote" | "invoice";
  documentId?: string;
  quoteId?: string;
  parties: PartyOption[];
  products: ProductOption[];
  companyStateCode: string;
  initial: {
    partyId: string;
    issueDate: string;
    secondDate: string;
    isGstApplicable: boolean;
    gstRate: number;
    notes: string;
    lines: EditorLine[];
  };
  save: (formData: FormData) => Promise<void>;
  cancelUrl: string;
};

export default function DocumentForm({
  kind,
  documentId,
  quoteId,
  parties,
  products,
  companyStateCode,
  initial,
  save,
  cancelUrl,
}: Props) {
  const [partyId, setPartyId] = useState(initial.partyId);
  const [isGst, setIsGst] = useState(initial.isGstApplicable);
  const [gstRate, setGstRate] = useState(initial.gstRate);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const party = parties.find((p) => p.id === partyId);
  const secondDateLabel = kind === "quote" ? "Valid until" : "Due date";
  const secondDateName = kind === "quote" ? "valid_until" : "due_date";

  function onSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        await save(formData);
      } catch (e) {
        // A redirect from a server action surfaces here as an error, so it is re-thrown rather than shown.
        if (e && typeof e === "object" && "digest" in e && String(e.digest).startsWith("NEXT_REDIRECT")) {
          throw e;
        }
        setError(e instanceof Error ? e.message : "Could not save");
      }
    });
  }

  return (
    <form action={onSubmit} className="space-y-6">
      {documentId && <input type="hidden" name="id" value={documentId} />}
      {quoteId && <input type="hidden" name="quote_id" value={quoteId} />}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="party_id">
              Client <span className="text-red-500">*</span>
            </label>
            <select
              id="party_id"
              name="party_id"
              required
              value={partyId}
              onChange={(e) => setPartyId(e.target.value)}
              className="rounded-md px-4 py-2 bg-gray-50 border border-gray-200 w-full text-black"
            >
              <option value="">Select a client…</option>
              {parties.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                  {option.stateName ? ` — ${option.stateName}` : ""}
                </option>
              ))}
            </select>
            {party && !party.stateCode && (
              <p className="text-xs text-amber-600 mt-1">
                This client has no state set, so the tax will be treated as same-state. Add one on their record.
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="issue_date">
              Date
            </label>
            <input
              id="issue_date"
              name="issue_date"
              type="date"
              defaultValue={initial.issueDate}
              className="rounded-md px-4 py-2 bg-gray-50 border border-gray-200 w-full text-black"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor={secondDateName}>
              {secondDateLabel}
            </label>
            <input
              id={secondDateName}
              name={secondDateName}
              type="date"
              defaultValue={initial.secondDate}
              className="rounded-md px-4 py-2 bg-gray-50 border border-gray-200 w-full text-black"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-6 mt-5 pt-5 border-t border-gray-100">
          {/* A controlled checkbox sets the DOM property but not the HTML attribute, so the browser omits it from the submitted form. The hidden field carries the real value. */}
          <input type="hidden" name="is_gst_applicable" value={isGst ? "on" : "off"} />
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={isGst}
              onChange={(e) => setIsGst(e.target.checked)}
              className="w-4 h-4 accent-[#A67C52]"
            />
            Apply GST
          </label>

          {isGst && (
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-700" htmlFor="gst_rate">
                Rate
              </label>
              <select
                id="gst_rate"
                name="gst_rate"
                value={gstRate}
                onChange={(e) => setGstRate(Number(e.target.value))}
                className="rounded-md px-3 py-1.5 bg-gray-50 border border-gray-200 text-black text-sm"
              >
                {[5, 12, 18, 28].map((rate) => (
                  <option key={rate} value={rate}>
                    {rate}%
                  </option>
                ))}
              </select>
            </div>
          )}

          {!isGst && <p className="text-xs text-gray-400">No tax will be charged on this document.</p>}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-sm font-bold uppercase tracking-wider text-matte-black mb-1">Line items</h2>
        <p className="text-xs text-gray-400 mb-4">
          Enter width and height to price by square foot, or leave them blank and type a quantity.
        </p>

        <LineItemsEditor
          initialLines={initial.lines}
          products={products}
          companyStateCode={companyStateCode}
          partyStateCode={party?.stateCode ?? ""}
          isGstApplicable={isGst}
          gstRate={gstRate}
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="notes">
          Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          defaultValue={initial.notes}
          placeholder="Anything the client should see on this document"
          className="rounded-md px-4 py-2 bg-gray-50 border border-gray-200 w-full text-black"
        />
      </div>

      {error && <p className="p-4 bg-red-50 text-red-600 text-sm rounded-md border border-red-100">{error}</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="px-6 py-3 bg-[#A67C52] text-white text-xs font-bold uppercase tracking-wider rounded-sm hover:bg-[#8e6944] transition-colors shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? "Saving…" : documentId ? "Save Changes" : `Create ${kind === "quote" ? "Quotation" : "Invoice"}`}
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
