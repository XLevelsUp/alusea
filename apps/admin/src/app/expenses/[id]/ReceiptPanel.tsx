"use client";

import { useState } from "react";
import { XIcon } from "lucide-react";
import ReceiptPicker from "@/components/ReceiptPicker";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useConfirm } from "@/components/ConfirmProvider";
import { useActionRunner } from "@/hooks/use-action";
import type { Action } from "@/lib/actions";

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
  upload: Action;
  remove: Action;
}) {
  const { run, isPending, error } = useActionRunner();
  const confirm = useConfirm();
  const [file, setFile] = useState<File | null>(null);

  function onUpload(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!file) return;
    const formData = new FormData();
    formData.set("expense_id", expenseId);
    formData.set("receipt", file);
    run(upload, formData).then((result) => {
      if (result.ok) setFile(null);
    });
  }

  return (
    <Card className="gap-0 py-0">
      <CardHeader className="p-5 border-b">
        <CardTitle className="text-sm font-bold uppercase tracking-wider text-matte-black">Receipts</CardTitle>
        <CardDescription className="text-xs">Stored privately, visible only to you and accounts.</CardDescription>
      </CardHeader>

      {canEdit && (
        <form onSubmit={onUpload} className="p-5 bg-muted border-b">
          <ReceiptPicker file={file} onChange={setFile} disabled={isPending} />
          {file && (
            <Button type="submit" size="lg" disabled={isPending} className="mt-3">
              {isPending ? "Uploading…" : "Upload"}
            </Button>
          )}
          {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
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
                  <span className="block text-xs text-gray-500">{formatSize(receipt.sizeBytes)}</span>
                </td>
                <td className="p-4 text-right w-10">
                  {canEdit && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      disabled={isPending}
                      aria-label={`Remove ${receipt.fileName}`}
                      onClick={async () => {
                        const ok = await confirm({
                          title: `Remove ${receipt.fileName || "this receipt"}?`,
                          description: "The file is deleted from storage. This cannot be undone.",
                          confirmLabel: "Remove",
                        });
                        if (!ok) return;
                        const formData = new FormData();
                        formData.set("id", receipt.id);
                        formData.set("expense_id", expenseId);
                        run(remove, formData);
                      }}
                      className="text-gray-500 hover:text-destructive"
                    >
                      <XIcon />
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="p-5 text-sm text-gray-500">No receipt attached yet.</p>
      )}
    </Card>
  );
}
