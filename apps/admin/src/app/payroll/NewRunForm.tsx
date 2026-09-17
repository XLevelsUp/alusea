"use client";

import { useState, useTransition } from "react";

function isRedirect(error: unknown): boolean {
  return !!error && typeof error === "object" && "digest" in error && String(error.digest).startsWith("NEXT_REDIRECT");
}

export default function NewRunForm({
  defaultMonth,
  create,
}: {
  defaultMonth: string;
  create: (formData: FormData) => Promise<void>;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        await create(formData);
      } catch (e) {
        if (isRedirect(e)) throw e;
        setError(e instanceof Error ? e.message : "Could not start the run");
      }
    });
  }

  return (
    <form action={onSubmit} className="flex flex-wrap items-end gap-3">
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1" htmlFor="period_month">
          Month
        </label>
        <input
          id="period_month"
          name="period_month"
          type="month"
          defaultValue={defaultMonth}
          required
          className="rounded-md px-4 py-2 bg-gray-50 border border-gray-200 text-black"
        />
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="px-5 py-2.5 bg-[#A67C52] text-white text-xs font-bold uppercase tracking-wider rounded-sm hover:bg-[#8e6944] transition-colors cursor-pointer disabled:opacity-50"
      >
        {isPending ? "Starting…" : "Start Payroll Run"}
      </button>
      {error && <p className="w-full text-sm text-red-600">{error}</p>}
    </form>
  );
}
