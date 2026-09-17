"use client";

import { useState, useTransition } from "react";

type Props = {
  id: string;
  isActive: boolean;
  setActive: (formData: FormData) => Promise<void>;
};

export default function PartyStatusButton({ id, isActive, setActive }: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="inline-flex flex-col items-end">
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          setError(null);
          const formData = new FormData();
          formData.set("id", id);
          formData.set("is_active", String(!isActive));
          startTransition(async () => {
            try {
              await setActive(formData);
            } catch (e) {
              setError(e instanceof Error ? e.message : "Failed");
            }
          });
        }}
        className="text-xs font-semibold uppercase tracking-wider px-3 py-1 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {isPending ? "…" : isActive ? "Deactivate" : "Reactivate"}
      </button>
      {error && <span className="text-xs text-red-600 mt-1">{error}</span>}
    </div>
  );
}
