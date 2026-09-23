"use client";

import { useState } from "react";
import ConfirmPanel from "@/components/ConfirmPanel";
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
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  function run(action: Action, extra?: Record<string, string>) {
    const formData = new FormData();
    formData.set("id", quoteId);
    for (const [key, value] of Object.entries(extra ?? {})) formData.set(key, value);
    runAction(action, formData);
  }

  const changeStatus = (next: QuoteStatus) => run(setStatus, { status: next });

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
            <Button type="button" size="lg" variant="outline" disabled={isPending} onClick={() => changeStatus("rejected")}>
              Mark Rejected
            </Button>
          </>
        )}

        {canConvert && !alreadyInvoiced && status !== "draft" && (
          <Button type="button" size="lg" disabled={isPending} onClick={() => run(convert)}>
            {isPending ? "Working…" : "Convert to Invoice"}
          </Button>
        )}

        {canEdit && status !== "draft" && (
          <Button type="button" size="lg" variant="outline" disabled={isPending} onClick={() => run(regenerate)}>
            {hasPdf ? "Regenerate PDF" : "Generate PDF"}
          </Button>
        )}

        {canEdit && status === "draft" && (
          <Button type="button" size="lg" variant="destructive" disabled={isPending} onClick={() => setConfirmingDelete(true)}>
            Delete
          </Button>
        )}
      </div>

      {alreadyInvoiced && (
        <p className="mt-3 text-xs text-muted-foreground">This quotation has already been turned into an invoice.</p>
      )}

      <FormError error={error} className="mt-3" />

      {confirmingDelete && (
        <ConfirmPanel
          title="Delete this draft quotation?"
          confirmLabel="Delete"
          pendingLabel="Deleting…"
          isPending={isPending}
          onConfirm={() => run(remove)}
          onCancel={() => setConfirmingDelete(false)}
        />
      )}
    </div>
  );
}
