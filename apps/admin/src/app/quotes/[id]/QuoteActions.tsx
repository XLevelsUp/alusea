"use client";

import { useConfirm } from "@/components/ConfirmProvider";
import { FormError } from "@/components/form-fields";
import { Button } from "@/components/ui/button";
import { useActionRunner } from "@/hooks/use-action";
import type { Action } from "@/lib/actions";
import type { QuoteStatus } from "@/lib/supabase/types";

type Props = {
  quoteId: string;
  status: QuoteStatus;
  hasPdf: boolean;
  canEdit: boolean;
  canConvert: boolean;
  alreadyInvoiced: boolean;
  setStatus: Action;
  convert: Action;
  regenerate: Action;
  remove: Action;
};

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
  const { run: runAction, isPending, error } = useActionRunner();
  const confirm = useConfirm();

  function run(action: Action, extra?: Record<string, string>) {
    const formData = new FormData();
    formData.set("id", quoteId);
    for (const [key, value] of Object.entries(extra ?? {})) formData.set(key, value);
    runAction(action, formData);
  }

  const changeStatus = (next: QuoteStatus) => run(setStatus, { status: next });

  async function onReject() {
    const ok = await confirm({
      title: "Mark this quotation as rejected?",
      description: "It stays on record, marked as turned down by the client.",
      confirmLabel: "Mark rejected",
    });
    if (ok) changeStatus("rejected");
  }

  async function onConvert() {
    const ok = await confirm({
      tone: "neutral",
      title: "Convert this quotation to an invoice?",
      description: "A draft invoice is created with the same client and lines, and this quotation is marked accepted. You can review the invoice before issuing it.",
      confirmLabel: "Convert",
    });
    if (ok) run(convert);
  }

  async function onDelete() {
    const ok = await confirm({
      title: "Delete this draft quotation?",
      description: "This cannot be undone.",
      confirmLabel: "Delete",
      cancelLabel: "Keep it",
    });
    if (ok) run(remove);
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {canEdit && status === "draft" && (
          <Button type="button" size="lg" variant="brand" disabled={isPending} onClick={() => changeStatus("sent")}>
            {isPending ? "Working…" : "Mark as Sent"}
          </Button>
        )}

        {canEdit && status === "sent" && (
          <>
            <Button
              type="button"
              size="lg"
              variant="outline"
              disabled={isPending}
              onClick={() => changeStatus("accepted")}
              className="border-green-200 text-green-700 hover:bg-green-50 hover:text-green-700"
            >
              Mark Accepted
            </Button>
            <Button type="button" size="lg" variant="destructive" disabled={isPending} onClick={onReject}>
              Mark Rejected
            </Button>
          </>
        )}

        {canConvert && !alreadyInvoiced && status !== "draft" && (
          <Button type="button" size="lg" disabled={isPending} onClick={onConvert}>
            {isPending ? "Working…" : "Convert to Invoice"}
          </Button>
        )}

        {canEdit && status !== "draft" && (
          <Button type="button" size="lg" variant="outline" disabled={isPending} onClick={() => run(regenerate)}>
            {hasPdf ? "Regenerate PDF" : "Generate PDF"}
          </Button>
        )}

        {canEdit && status === "draft" && (
          <Button type="button" size="lg" variant="destructive" disabled={isPending} onClick={onDelete}>
            Delete
          </Button>
        )}
      </div>

      {alreadyInvoiced && (
        <p className="mt-3 text-xs text-muted-foreground">This quotation has already been turned into an invoice.</p>
      )}

      <FormError error={error} className="mt-3" />
    </div>
  );
}
