"use client";

import { useRef, useState, useTransition } from "react";

export type ReceiptRow = {
  id: string;
  fileName: string;
  sizeBytes: number;
};

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ReceiptPanel({
  expenseId,
  receipts,
  canEdit,
  upload,
  remove,
}: {
  expenseId: string;
  receipts: ReceiptRow[];
  canEdit: boolean;
  upload: (formData: FormData) => Promise<void>;
  remove: (formData: FormData) => Promise<void>;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  function onUpload(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        await upload(formData);
        formRef.current?.reset();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not upload");
      }
    });
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-5 border-b border-gray-100">
        <h2 className="text-sm font-bold uppercase tracking-wider text-matte-black">Receipts</h2>
        <p className="text-xs text-gray-400 mt-0.5">Stored privately, visible only to you and accounts.</p>
      </div>

      {canEdit && (
        <form ref={formRef} action={onUpload} className="p-5 bg-gray-50 border-b border-gray-100">
          <input type="hidden" name="expense_id" value={expenseId} />
          <div className="flex flex-wrap gap-3 items-center">
            <input
              type="file"
              name="receipt"
              required
              accept="image/*,application/pdf"
              aria-label="Receipt file"
              className="text-sm text-gray-600 file:mr-3 file:px-4 file:py-2 file:rounded file:border-0 file:bg-white file:border file:border-gray-200 file:text-xs file:font-bold file:uppercase file:tracking-wider file:text-gray-600 file:cursor-pointer"
            />
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-2 bg-matte-black text-white text-xs font-bold uppercase tracking-wider rounded cursor-pointer disabled:opacity-50"
            >
              {isPending ? "Uploading…" : "Upload"}
            </button>
          </div>
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        </form>
      )}

      {receipts.length > 0 ? (
        <table className="w-full text-left border-collapse">
          <tbody className="divide-y divide-gray-100">
            {receipts.map((receipt) => (
              <tr key={receipt.id}>
                <td className="p-4">
                  <a
                    href={`/expenses/${expenseId}/receipt/${receipt.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-[#A67C52] hover:underline"
                  >
                    {receipt.fileName || "Receipt"}
                  </a>
                  <span className="block text-xs text-gray-400">{formatSize(receipt.sizeBytes)}</span>
                </td>
                <td className="p-4 text-right w-10">
                  {canEdit && (
                    <button
                      type="button"
                      disabled={isPending}
                      aria-label={`Remove ${receipt.fileName}`}
                      onClick={() => {
                        setError(null);
                        const formData = new FormData();
                        formData.set("id", receipt.id);
                        formData.set("expense_id", expenseId);
                        startTransition(async () => {
                          try {
                            await remove(formData);
                          } catch (e) {
                            setError(e instanceof Error ? e.message : "Could not remove");
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
        <p className="p-5 text-sm text-gray-500">No receipt attached yet.</p>
      )}
    </div>
  );
}
