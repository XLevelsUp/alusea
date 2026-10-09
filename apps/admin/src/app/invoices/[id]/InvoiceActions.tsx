"use client";

import { DownloadIcon, FileTextIcon } from "lucide-react";
import { toast } from "sonner";
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
  // Whether a cancelled invoice's number goes to the next invoice issued, which changes what cancelling means.
  reuseNumbers: boolean;
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
  reuseNumbers,
  issue,
  cancel,
  regenerate,
  deleteDraft,
}: Props) {
  const { run: runAction, isPending, error } = useActionRunner();
  const confirm = useConfirm();

  function run(action: Action, done: string, extra?: Record<string, string>) {
    const formData = new FormData();
    formData.set("id", invoiceId);
    for (const [key, value] of Object.entries(extra ?? {})) formData.set(key, value);
    runAction(action, formData).then((result) => {
      if (result.ok) toast.success(done);
    });
  }

  async function onIssue() {
    const ok = await confirm({
      tone: "neutral",
      title: "Issue this invoice?",
      description: "It will be given the next number in the series and frozen. After that it can only be cancelled, not edited.",
      confirmLabel: "Yes, issue it",
      cancelLabel: "Not yet",
    });
    if (ok) run(issue, "Invoice issued");
  }

  async function onCancel() {
    const answer = await confirm({
      title: "Cancel this invoice?",
      description: reuseNumbers
        ? "It stays on record, marked cancelled, and its number will be given to the next invoice you issue. This cannot be undone."
        : "It keeps its number and stays on record, marked cancelled. This cannot be undone.",
      reason: { label: "Reason for cancelling", placeholder: "e.g. Raised against the wrong client" },
      confirmLabel: "Yes, cancel it",
      cancelLabel: "Keep it",
    });
    if (answer) run(cancel, "Invoice cancelled", { reason: answer.reason });
  }

  async function onDelete() {
    const ok = await confirm({
      title: "Delete this draft?",
      description: "It has no number, so nothing is lost from the series. This cannot be undone.",
      confirmLabel: "Delete draft",
      cancelLabel: "Keep it",
    });
    if (ok) run(deleteDraft, "Draft deleted");
  }

  const pdfHref = `/invoices/${invoiceId}/pdf`;

  // Viewing and downloading the PDF is open to everyone who can see the invoice; the other buttons need write access.
  if (!canWrite && !hasPdf) return null;

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {hasPdf && (
          <>
            <Button asChild size="lg" variant="brand">
              <a href={pdfHref} target="_blank" rel="noopener noreferrer">
                <FileTextIcon aria-hidden="true" />
                Open PDF
              </a>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href={`${pdfHref}?download`}>
                <DownloadIcon aria-hidden="true" />
                Download Invoice
              </a>
            </Button>
          </>
        )}

        {canWrite && status === "draft" && (
          <Button type="button" size="lg" variant="brand" disabled={isPending} onClick={onIssue}>
            {isPending ? "Working…" : "Issue Invoice"}
          </Button>
        )}

        {canWrite && status === "issued" && (
          <>
            <Button type="button" size="lg" variant="outline" disabled={isPending} onClick={() => run(regenerate, "PDF regenerated")}>
              {isPending ? "Working…" : hasPdf ? "Regenerate PDF" : "Generate PDF"}
            </Button>
            {/* Set apart on the right, so it is not pressed by mistake next to the PDF buttons. */}
            <Button type="button" size="lg" variant="destructive" disabled={isPending} onClick={onCancel} className="sm:ml-auto">
              Cancel Invoice
            </Button>
          </>
        )}

        {canWrite && status === "draft" && (
          <Button type="button" size="lg" variant="destructive" disabled={isPending} onClick={onDelete} className="sm:ml-auto">
            Delete Draft
          </Button>
        )}
      </div>

      <FormError error={error} className="mt-3" />
    </div>
  );
}
