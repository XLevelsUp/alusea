"use client";

import { useState, useTransition } from "react";
import type { PayrollRunStatus } from "@/lib/supabase/types";

function isRedirect(error: unknown): boolean {
  return !!error && typeof error === "object" && "digest" in error && String(error.digest).startsWith("NEXT_REDIRECT");
}

export default function RunActions({
  runId,
  status,
  canWrite,
  approve,
  markPaid,
  regenerate,
  remove,
}: {
  runId: string;
  status: PayrollRunStatus;
  canWrite: boolean;
  approve: (formData: FormData) => Promise<void>;
  markPaid: (formData: FormData) => Promise<void>;
  regenerate: (formData: FormData) => Promise<void>;
  remove: (formData: FormData) => Promise<void>;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<"approve" | "delete" | null>(null);

  if (!canWrite) return null;

  function run(action: (fd: FormData) => Promise<void>) {
    setError(null);
    const formData = new FormData();
    formData.set("run_id", runId);
    startTransition(async () => {
      try {
        await action(formData);
        setConfirming(null);
      } catch (e) {
        if (isRedirect(e)) throw e;
        setError(e instanceof Error ? e.message : "Something went wrong");
      }
    });
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {status === "draft" && (
          <>
            <button
              type="button"
              disabled={isPending}
              onClick={() => setConfirming("approve")}
              className="px-5 py-2.5 bg-matte-black text-white text-xs font-bold uppercase tracking-wider rounded-sm hover:bg-black transition-colors cursor-pointer disabled:opacity-50"
            >
              Approve Run
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => setConfirming("delete")}
              className="px-4 py-2.5 border border-red-200 text-red-600 text-xs font-bold uppercase tracking-wider rounded hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-50"
            >
              Delete Run
            </button>
          </>
        )}

        {status === "approved" && (
          <button
            type="button"
            disabled={isPending}
            onClick={() => run(markPaid)}
            className="px-5 py-2.5 bg-[#A67C52] text-white text-xs font-bold uppercase tracking-wider rounded-sm hover:bg-[#8e6944] transition-colors cursor-pointer disabled:opacity-50"
          >
            {isPending ? "Working…" : "Mark as Paid"}
          </button>
        )}

        {status !== "draft" && (
          <button
            type="button"
            disabled={isPending}
            onClick={() => run(regenerate)}
            className="px-4 py-2.5 border border-gray-200 text-gray-600 text-xs font-bold uppercase tracking-wider rounded hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50"
          >
            {isPending ? "Working…" : "Regenerate Payslips"}
          </button>
        )}
      </div>

      {error && <p className="mt-3 p-3 bg-red-50 text-red-600 text-sm rounded border border-red-100">{error}</p>}

      {confirming === "approve" && (
        <div className="mt-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
          <p className="text-sm font-semibold text-gray-900 mb-1">Approve this payroll run?</p>
          <p className="text-xs text-gray-600 mb-3">
            The figures will be frozen and payslips generated. An approved run cannot be reopened or edited.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={isPending}
              onClick={() => run(approve)}
              className="px-4 py-2 bg-matte-black text-white text-xs font-bold uppercase tracking-wider rounded cursor-pointer disabled:opacity-50"
            >
              {isPending ? "Approving…" : "Yes, approve"}
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

      {confirming === "delete" && (
        <div className="mt-4 p-4 border border-red-200 rounded-lg bg-red-50">
          <p className="text-sm font-semibold text-red-900 mb-3">
            Delete this draft run and everything entered in it?
          </p>
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
