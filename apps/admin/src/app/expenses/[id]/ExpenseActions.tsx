"use client";

import { useState, useTransition } from "react";
import type { ExpenseStatus } from "@/lib/supabase/types";

function isRedirect(error: unknown): boolean {
  return !!error && typeof error === "object" && "digest" in error && String(error.digest).startsWith("NEXT_REDIRECT");
}

export default function ExpenseActions({
  expenseId,
  status,
  canApprove,
  canEdit,
  approve,
  reject,
  resubmit,
  remove,
}: {
  expenseId: string;
  status: ExpenseStatus;
  canApprove: boolean;
  canEdit: boolean;
  approve: (formData: FormData) => Promise<void>;
  reject: (formData: FormData) => Promise<void>;
  resubmit: (formData: FormData) => Promise<void>;
  remove: (formData: FormData) => Promise<void>;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<"reject" | "delete" | null>(null);
  const [reason, setReason] = useState("");

  function run(action: (fd: FormData) => Promise<void>, extra?: Record<string, string>) {
    setError(null);
    const formData = new FormData();
    formData.set("id", expenseId);
    for (const [key, value] of Object.entries(extra ?? {})) formData.set(key, value);

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

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {canApprove && status === "submitted" && (
          <>
            <button
              type="button"
              disabled={isPending}
              onClick={() => run(approve)}
              className="px-5 py-2.5 bg-[#A67C52] text-white text-xs font-bold uppercase tracking-wider rounded-sm hover:bg-[#8e6944] transition-colors cursor-pointer disabled:opacity-50"
            >
              {isPending ? "Working…" : "Approve"}
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => setConfirming("reject")}
              className="px-4 py-2.5 border border-red-200 text-red-600 text-xs font-bold uppercase tracking-wider rounded hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-50"
            >
              Reject
            </button>
          </>
        )}

        {canApprove && status === "approved" && (
          <button
            type="button"
            disabled={isPending}
            onClick={() => setConfirming("reject")}
            className="px-4 py-2.5 border border-red-200 text-red-600 text-xs font-bold uppercase tracking-wider rounded hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-50"
          >
            Unapprove
          </button>
        )}

        {canEdit && status === "rejected" && (
          <button
            type="button"
            disabled={isPending}
            onClick={() => run(resubmit)}
            className="px-5 py-2.5 bg-matte-black text-white text-xs font-bold uppercase tracking-wider rounded-sm hover:bg-black transition-colors cursor-pointer disabled:opacity-50"
          >
            {isPending ? "Working…" : "Resubmit"}
          </button>
        )}

        {canEdit && status !== "approved" && (
          <button
            type="button"
            disabled={isPending}
            onClick={() => setConfirming("delete")}
            className="px-4 py-2.5 border border-red-200 text-red-600 text-xs font-bold uppercase tracking-wider rounded hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-50"
          >
            Delete
          </button>
        )}
      </div>

      {error && <p className="mt-3 p-3 bg-red-50 text-red-600 text-sm rounded border border-red-100">{error}</p>}

      {confirming === "reject" && (
        <div className="mt-4 p-4 border border-red-200 rounded-lg bg-red-50">
          <p className="text-sm font-semibold text-red-900 mb-1">
            {status === "approved" ? "Unapprove this expense?" : "Reject this expense?"}
          </p>
          <p className="text-xs text-red-800 mb-3">The reason is shown to whoever filed it.</p>
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="What needs fixing?"
            className="w-full rounded px-3 py-2 bg-white border border-red-200 text-sm text-black mb-3"
            aria-label="Reason"
          />
          <div className="flex gap-2">
            <button
              type="button"
              disabled={isPending || !reason.trim()}
              onClick={() => run(reject, { reason })}
              className="px-4 py-2 bg-red-600 text-white text-xs font-bold uppercase tracking-wider rounded cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? "Working…" : "Confirm"}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(null)}
              className="px-4 py-2 border border-gray-300 text-gray-600 text-xs font-bold uppercase tracking-wider rounded cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {confirming === "delete" && (
        <div className="mt-4 p-4 border border-red-200 rounded-lg bg-red-50">
          <p className="text-sm font-semibold text-red-900 mb-3">Delete this expense and its receipts?</p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={isPending}
              onClick={() => run(remove)}
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
