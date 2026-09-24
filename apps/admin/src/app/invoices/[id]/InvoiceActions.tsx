"use client";

import { useConfirm } from "@/components/ConfirmProvider";
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
  const confirm = useConfirm();

  function run(action: Action, extra?: Record<string, string>) {
    const formData = new FormData();
    formData.set("id", invoiceId);
    for (const [key, value] of Object.entries(extra ?? {})) formData.set(key, value);
    runAction(action, formData);
  }

  async function onIssue() {
    const ok = await confirm({
      tone: "neutral",
      title: "Issue this invoice?",
      description: "It will be given the next number in the series and frozen. After that it can only be cancelled, not edited.",
      confirmLabel: "Yes, issue it",
      cancelLabel: "Not yet",
    });
    if (ok) run(issue);
  }

  async function onCancel() {
    const answer = await confirm({
      title: "Cancel this invoice?",
      description: "It keeps its number and stays on record, marked cancelled. This cannot be undone.",
      reason: { label: "Reason for cancelling", placeholder: "e.g. Raised against the wrong client" },
      confirmLabel: "Yes, cancel it",
      cancelLabel: "Keep it",
    });
    if (answer) run(cancel, { reason: answer.reason });
  }

  async function onDelete() {
    const ok = await confirm({
      title: "Delete this draft?",
      description: "It has no number, so nothing is lost from the series. This cannot be undone.",
      confirmLabel: "Delete draft",
      cancelLabel: "Keep it",
    });
    if (ok) run(deleteDraft);
  }

  if (!canWrite) return null;

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {status === "draft" && (
          <Button type="button" size="lg" variant="brand" disabled={isPending} onClick={onIssue}>
            {isPending ? "Working…" : "Issue Invoice"}
          </Button>
        )}

        {status === "issued" && (
          <>
            <Button type="button" size="lg" variant="outline" disabled={isPending} onClick={() => run(regenerate)}>
              {isPending ? "Working…" : hasPdf ? "Regenerate PDF" : "Generate PDF"}
            </Button>
            <Button type="button" size="lg" variant="destructive" disabled={isPending} onClick={onCancel}>
              Cancel Invoice
            </Button>
          </>
        )}

        {status === "draft" && (
          <Button type="button" size="lg" variant="destructive" disabled={isPending} onClick={onDelete}>
            Delete Draft
          </Button>
        )}
      </div>

      <FormError error={error} className="mt-3" />
    </div>
  );
}
