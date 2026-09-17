"use client";

import { useState, useTransition } from "react";
import { formatPaise } from "@/lib/erp/money";

export type PaymentRow = {
  id: string;
  paidOn: string;
  amountPaise: number;
  method: string;
  reference: string;
};

const METHOD_LABELS: Record<string, string> = {
  cash: "Cash",
  bank_transfer: "Bank transfer",
  upi: "UPI",
  cheque: "Cheque",
  card: "Card",
  other: "Other",
};

export default function PaymentPanel({
  invoiceId,
  payments,
  balancePaise,
  canWrite,
  isIssued,
  record,
  remove,
}: {
  invoiceId: string;
  payments: PaymentRow[];
  balancePaise: number;
  canWrite: boolean;
  isIssued: boolean;
  record: (formData: FormData) => Promise<void>;
  remove: (formData: FormData) => Promise<void>;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  function submit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        await record(formData);
        setIsAdding(false);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not record payment");
      }
    });
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-5 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-matte-black">Payments</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {balancePaise > 0 ? `${formatPaise(balancePaise)} still outstanding` : "Fully paid"}
          </p>
        </div>
        {canWrite && isIssued && balancePaise > 0 && !isAdding && (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="px-4 py-2 border border-gray-200 text-gray-600 text-xs font-bold uppercase tracking-wider rounded hover:bg-gray-50 transition-colors cursor-pointer"
          >
            + Record Payment
          </button>
        )}
      </div>

      {isAdding && (
        <form action={submit} className="p-5 bg-gray-50 border-b border-gray-100 space-y-3">
          <input type="hidden" name="invoice_id" value={invoiceId} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1" htmlFor="amount">
                Amount
              </label>
              <input
                id="amount"
                name="amount"
                required
                inputMode="decimal"
                placeholder={(balancePaise / 100).toFixed(2)}
                className="rounded px-3 py-2 bg-white border border-gray-200 w-full text-black text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1" htmlFor="paid_on">
                Date
              </label>
              <input
                id="paid_on"
                name="paid_on"
                type="date"
                defaultValue={new Date().toISOString().slice(0, 10)}
                className="rounded px-3 py-2 bg-white border border-gray-200 w-full text-black text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1" htmlFor="method">
                Method
              </label>
              <select
                id="method"
                name="method"
                defaultValue="bank_transfer"
                className="rounded px-3 py-2 bg-white border border-gray-200 w-full text-black text-sm"
              >
                {Object.entries(METHOD_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1" htmlFor="reference">
                Reference
              </label>
              <input
                id="reference"
                name="reference"
                placeholder="UTR, cheque number…"
                className="rounded px-3 py-2 bg-white border border-gray-200 w-full text-black text-sm"
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-2 bg-matte-black text-white text-xs font-bold uppercase tracking-wider rounded cursor-pointer disabled:opacity-50"
            >
              {isPending ? "Saving…" : "Save Payment"}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsAdding(false);
                setError(null);
              }}
              className="px-4 py-2 border border-gray-200 text-gray-600 text-xs font-bold uppercase tracking-wider rounded cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {payments.length > 0 ? (
        <table className="w-full text-left border-collapse">
          <tbody className="divide-y divide-gray-100">
            {payments.map((payment) => (
              <tr key={payment.id}>
                <td className="p-4 text-sm text-gray-600">
                  {new Date(payment.paidOn).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </td>
                <td className="p-4 text-sm text-gray-600">
                  {METHOD_LABELS[payment.method] ?? payment.method}
                  {payment.reference && <span className="block text-xs text-gray-400">{payment.reference}</span>}
                </td>
                <td className="p-4 text-sm font-semibold text-right text-gray-900">{formatPaise(payment.amountPaise)}</td>
                <td className="p-4 text-right w-10">
                  {canWrite && (
                    <button
                      type="button"
                      disabled={isPending}
                      aria-label="Remove payment"
                      onClick={() => {
                        const fd = new FormData();
                        fd.set("id", payment.id);
                        fd.set("invoice_id", invoiceId);
                        setError(null);
                        startTransition(async () => {
                          try {
                            await remove(fd);
                          } catch (e) {
                            setError(e instanceof Error ? e.message : "Could not remove payment");
                          }
                        });
                      }}
                      className="text-gray-400 hover:text-red-600 transition-colors cursor-pointer disabled:opacity-40"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        !isAdding && <p className="p-5 text-sm text-gray-500">No payments recorded yet.</p>
      )}
    </div>
  );
}
