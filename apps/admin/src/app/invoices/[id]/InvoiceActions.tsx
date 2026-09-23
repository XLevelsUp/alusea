"use client";

import { useState } from "react";
import ConfirmPanel from "@/components/ConfirmPanel";
import { FormError } from "@/components/form-fields";
import { Button } from "@/components/ui/button";
import { useActionRunner } from "@/hooks/use-action";
import type { Action } from "@/lib/actions";

type Props = {
  invoiceId: string;
  status: "draft" | "issued" | "cancelled";
  hasPdf: boolean;
  canWrite: boolean;
  issue: Action;
  cancel: Action;
  regenerate: Action;
  deleteDraft: Action;
};

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
  const { run: runAction, isPending, error } = useActionRunner();
  const [confirming, setConfirming] = useState<"issue" | "cancel" | "delete" | null>(null);
  const [reason, setReason] = useState("");

  function run(action: Action, extra?: Record<string, string>) {
    const formData = new FormData();
    formData.set("id", invoiceId);
    for (const [key, value] of Object.entries(extra ?? {})) formData.set(key, value);

    runAction(action, formData).then((result) => {
      if (result.ok) {
        setConfirming(null);
        setReason("");
      }
    });
  }

  if (!canWrite) return null;

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {status === "draft" && (
          <Button type="button" size="lg" variant="brand" disabled={isPending} onClick={() => setConfirming("issue")}>
            Issue Invoice
          </Button>
        )}

        {status === "issued" && (
          <>
            <Button type="button" size="lg" variant="outline" disabled={isPending} onClick={() => run(regenerate)}>
              {isPending ? "Working…" : hasPdf ? "Regenerate PDF" : "Generate PDF"}
            </Button>
            <Button type="button" size="lg" variant="destructive" disabled={isPending} onClick={() => setConfirming("cancel")}>
              Cancel Invoice
            </Button>
          </>
        )}

        {status === "draft" && (
          <Button type="button" size="lg" variant="destructive" disabled={isPending} onClick={() => setConfirming("delete")}>
            Delete Draft
          </Button>
        )}
      </div>

      <FormError error={error} className="mt-3" />

      {confirming === "issue" && (
        <ConfirmPanel
          tone="neutral"
          title="Issue this invoice?"
          description="It will be given the next number in the series and frozen. After that it can only be cancelled, not edited."
          confirmLabel="Yes, issue it"
          pendingLabel="Issuing…"
          cancelLabel="Not yet"
          isPending={isPending}
          onConfirm={() => run(issue)}
          onCancel={() => setConfirming(null)}
        />
      )}

      {confirming === "cancel" && (
        <ConfirmPanel
          title="Cancel this invoice?"
          description="It keeps its number and stays on record, marked cancelled. This cannot be undone."
          reason={{ value: reason, onChange: setReason, placeholder: "Reason for cancelling", label: "Reason for cancelling" }}
          confirmLabel="Yes, cancel it"
          pendingLabel="Cancelling…"
          isPending={isPending}
          onConfirm={() => run(cancel, { reason })}
          onCancel={() => setConfirming(null)}
        />
      )}

      {confirming === "delete" && (
        <ConfirmPanel
          title="Delete this draft? It has no number, so nothing is lost from the series."
          confirmLabel="Delete"
          pendingLabel="Deleting…"
          isPending={isPending}
          onConfirm={() => run(deleteDraft)}
          onCancel={() => setConfirming(null)}
        />
      )}
    </div>
  );
}
