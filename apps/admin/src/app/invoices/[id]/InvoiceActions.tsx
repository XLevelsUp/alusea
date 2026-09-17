"use client";

import { useState, useTransition } from "react";

type Props = {
  invoiceId: string;
  status: "draft" | "issued" | "cancelled";
  hasPdf: boolean;
  canWrite: boolean;
  issue: (formData: FormData) => Promise<void>;
  cancel: (formData: FormData) => Promise<void>;
  regenerate: (formData: FormData) => Promise<void>;
  deleteDraft: (formData: FormData) => Promise<void>;
};

function isRedirect(error: unknown): boolean {
  return !!error && typeof error === "object" && "digest" in error && String(error.digest).startsWith("NEXT_REDIRECT");
}

export default function InvoiceActions({
  invoiceId,
  status,
  hasPdf,
  canWrite,
  issue,
  cancel,
  regenerate,
  deleteDraft,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<"issue" | "cancel" | "delete" | null>(null);
  const [reason, setReason] = useState("");

  function run(action: (fd: FormData) => Promise<void>, formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        await action(formData);
        setConfirming(null);
        setReason("");
      } catch (e) {
        if (isRedirect(e)) throw e;
        setError(e instanceof Error ? e.message : "Something went wrong");
      }
    });
  }

  if (!canWrite) return null;

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {status === "draft" && (
          <button
            type="button"
            disabled={isPending}
            onClick={() => setConfirming("issue")}
            className="px-5 py-2.5 bg-[#A67C52] text-white text-xs font-bold uppercase tracking-wider rounded-sm hover:bg-[#8e6944] transition-colors cursor-pointer disabled:opacity-50"
          >
            Issue Invoice
          </button>
        )}

        {status === "issued" && (
          <>
            <button
              type="button"
              disabled={isPending}
              onClick={() => {
                const fd = new FormData();
                fd.set("id", invoiceId);
                run(regenerate, fd);
              }}
              className="px-4 py-2.5 border border-gray-200 text-gray-600 text-xs font-bold uppercase tracking-wider rounded hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50"
            >
              {isPending ? "Working…" : hasPdf ? "Regenerate PDF" : "Generate PDF"}
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => setConfirming("cancel")}
              className="px-4 py-2.5 border border-red-200 text-red-600 text-xs font-bold uppercase tracking-wider rounded hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel Invoice
            </button>
          </>
        )}

        {status === "draft" && (
          <button
            type="button"
            disabled={isPending}
            onClick={() => setConfirming("delete")}
            className="px-4 py-2.5 border border-red-200 text-red-600 text-xs font-bold uppercase tracking-wider rounded hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-50"
          >
            Delete Draft
          </button>
        )}
      </div>

      {error && <p className="mt-3 p-3 bg-red-50 text-red-600 text-sm rounded border border-red-100">{error}</p>}

      {confirming === "issue" && (
        <div className="mt-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
          <p className="text-sm font-semibold text-gray-900 mb-1">Issue this invoice?</p>
          <p className="text-xs text-gray-600 mb-3">
            It will be given the next number in the series and frozen. After that it can only be cancelled, not edited.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={isPending}
              onClick={() => {
                const fd = new FormData();
                fd.set("id", invoiceId);
                run(issue, fd);
              }}
              className="px-4 py-2 bg-matte-black text-white text-xs font-bold uppercase tracking-wider rounded cursor-pointer disabled:opacity-50"
            >
              {isPending ? "Issuing…" : "Yes, issue it"}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(null)}
              className="px-4 py-2 border border-gray-200 text-gray-600 text-xs font-bold uppercase tracking-wider rounded cursor-pointer"
            >
              Not yet
            </button>
          </div>
        </div>
      )}

      {confirming === "cancel" && (
        <div className="mt-4 p-4 border border-red-200 rounded-lg bg-red-50">
          <p className="text-sm font-semibold text-red-900 mb-1">Cancel this invoice?</p>
          <p className="text-xs text-red-800 mb-3">
            It keeps its number and stays on record, marked cancelled. This cannot be undone.
          </p>
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason for cancelling"
            className="w-full rounded px-3 py-2 bg-white border border-red-200 text-sm text-black mb-3"
            aria-label="Reason for cancelling"
          />
          <div className="flex gap-2">
            <button
              type="button"
              disabled={isPending || !reason.trim()}
              onClick={() => {
                const fd = new FormData();
                fd.set("id", invoiceId);
                fd.set("reason", reason);
                run(cancel, fd);
              }}
              className="px-4 py-2 bg-red-600 text-white text-xs font-bold uppercase tracking-wider rounded cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? "Cancelling…" : "Yes, cancel it"}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(null)}
              className="px-4 py-2 border border-gray-300 text-gray-600 text-xs font-bold uppercase tracking-wider rounded cursor-pointer"
            >
              Keep it
            </button>
          </div>
        </div>
      )}

      {confirming === "delete" && (
        <div className="mt-4 p-4 border border-red-200 rounded-lg bg-red-50">
          <p className="text-sm font-semibold text-red-900 mb-3">Delete this draft? It has no number, so nothing is lost from the series.</p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={isPending}
              onClick={() => {
                const fd = new FormData();
                fd.set("id", invoiceId);
                run(deleteDraft, fd);
              }}
              className="px-4 py-2 bg-red-600 text-white text-xs font-bold uppercase tracking-wider rounded cursor-pointer disabled:opacity-50"
            >
              {isPending ? "Deleting…" : "Delete"}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(null)}
              className="px-4 py-2 border border-gray-300 text-gray-600 text-xs font-bold uppercase tracking-wider rounded cursor-pointer"
            >
              Keep it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
