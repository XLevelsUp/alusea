"use client";

import { useState, useTransition } from "react";
import type { QuoteStatus } from "@/lib/supabase/types";

type Props = {
  quoteId: string;
  status: QuoteStatus;
  hasPdf: boolean;
  canEdit: boolean;
  canConvert: boolean;
  alreadyInvoiced: boolean;
  setStatus: (formData: FormData) => Promise<void>;
  convert: (formData: FormData) => Promise<void>;
  regenerate: (formData: FormData) => Promise<void>;
  remove: (formData: FormData) => Promise<void>;
};

function isRedirect(error: unknown): boolean {
  return !!error && typeof error === "object" && "digest" in error && String(error.digest).startsWith("NEXT_REDIRECT");
}

export default function QuoteActions({
  quoteId,
  status,
  hasPdf,
  canEdit,
  canConvert,
  alreadyInvoiced,
  setStatus,
  convert,
  regenerate,
  remove,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  function run(action: (fd: FormData) => Promise<void>, formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        await action(formData);
      } catch (e) {
        if (isRedirect(e)) throw e;
        setError(e instanceof Error ? e.message : "Something went wrong");
      }
    });
  }

  function changeStatus(next: QuoteStatus) {
    const fd = new FormData();
    fd.set("id", quoteId);
    fd.set("status", next);
    run(setStatus, fd);
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {canEdit && status === "draft" && (
          <button
            type="button"
            disabled={isPending}
            onClick={() => changeStatus("sent")}
            className="px-5 py-2.5 bg-[#A67C52] text-white text-xs font-bold uppercase tracking-wider rounded-sm hover:bg-[#8e6944] transition-colors cursor-pointer disabled:opacity-50"
          >
            {isPending ? "Working…" : "Mark as Sent"}
          </button>
        )}

        {canEdit && status === "sent" && (
          <>
            <button
              type="button"
              disabled={isPending}
              onClick={() => changeStatus("accepted")}
              className="px-4 py-2.5 border border-green-200 text-green-700 text-xs font-bold uppercase tracking-wider rounded hover:bg-green-50 transition-colors cursor-pointer disabled:opacity-50"
            >
              Mark Accepted
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => changeStatus("rejected")}
              className="px-4 py-2.5 border border-gray-200 text-gray-600 text-xs font-bold uppercase tracking-wider rounded hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50"
            >
              Mark Rejected
            </button>
          </>
        )}

        {canConvert && !alreadyInvoiced && status !== "draft" && (
          <button
            type="button"
            disabled={isPending}
            onClick={() => {
              const fd = new FormData();
              fd.set("id", quoteId);
              run(convert, fd);
            }}
            className="px-5 py-2.5 bg-matte-black text-white text-xs font-bold uppercase tracking-wider rounded-sm hover:bg-black transition-colors cursor-pointer disabled:opacity-50"
          >
            {isPending ? "Working…" : "Convert to Invoice"}
          </button>
        )}

        {canEdit && status !== "draft" && (
          <button
            type="button"
            disabled={isPending}
            onClick={() => {
              const fd = new FormData();
              fd.set("id", quoteId);
              run(regenerate, fd);
            }}
            className="px-4 py-2.5 border border-gray-200 text-gray-600 text-xs font-bold uppercase tracking-wider rounded hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50"
          >
            {hasPdf ? "Regenerate PDF" : "Generate PDF"}
          </button>
        )}

        {canEdit && status === "draft" && (
          <button
            type="button"
            disabled={isPending}
            onClick={() => setConfirmingDelete(true)}
            className="px-4 py-2.5 border border-red-200 text-red-600 text-xs font-bold uppercase tracking-wider rounded hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-50"
          >
            Delete
          </button>
        )}
      </div>

      {alreadyInvoiced && (
        <p className="mt-3 text-xs text-gray-500">This quotation has already been turned into an invoice.</p>
      )}

      {error && <p className="mt-3 p-3 bg-red-50 text-red-600 text-sm rounded border border-red-100">{error}</p>}

      {confirmingDelete && (
        <div className="mt-4 p-4 border border-red-200 rounded-lg bg-red-50">
          <p className="text-sm font-semibold text-red-900 mb-3">Delete this draft quotation?</p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={isPending}
              onClick={() => {
                const fd = new FormData();
                fd.set("id", quoteId);
                run(remove, fd);
              }}
              className="px-4 py-2 bg-red-600 text-white text-xs font-bold uppercase tracking-wider rounded cursor-pointer disabled:opacity-50"
            >
              {isPending ? "Deleting…" : "Delete"}
            </button>
            <button
              type="button"
              onClick={() => setConfirmingDelete(false)}
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
