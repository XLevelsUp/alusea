"use client";

import { useState } from "react";
import ConfirmPanel from "@/components/ConfirmPanel";
import { FormError } from "@/components/form-fields";
import { Button } from "@/components/ui/button";
import { useActionRunner } from "@/hooks/use-action";
import type { Action } from "@/lib/actions";
import type { ExpenseStatus } from "@/lib/supabase/types";

export default function ExpenseActions({
  expenseId,
  status,
  canApprove,
  canEdit,
  approve,
  reject,
  resubmit,
  remove,
}: {
  expenseId: string;
  status: ExpenseStatus;
  canApprove: boolean;
  canEdit: boolean;
  approve: Action;
  reject: Action;
  resubmit: Action;
  remove: Action;
}) {
  const { run: runAction, isPending, error } = useActionRunner();
  const [confirming, setConfirming] = useState<"reject" | "delete" | null>(null);
  const [reason, setReason] = useState("");

  function run(action: Action, extra?: Record<string, string>) {
    const formData = new FormData();
    formData.set("id", expenseId);
    for (const [key, value] of Object.entries(extra ?? {})) formData.set(key, value);

    runAction(action, formData).then((result) => {
      if (result.ok) {
        setConfirming(null);
        setReason("");
      }
    });
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {canApprove && status === "submitted" && (
          <>
            <Button type="button" size="lg" variant="brand" disabled={isPending} onClick={() => run(approve)}>
              {isPending ? "Working…" : "Approve"}
            </Button>
            <Button type="button" size="lg" variant="destructive" disabled={isPending} onClick={() => setConfirming("reject")}>
              Reject
            </Button>
          </>
        )}

        {canApprove && status === "approved" && (
          <Button type="button" size="lg" variant="destructive" disabled={isPending} onClick={() => setConfirming("reject")}>
            Unapprove
          </Button>
        )}

        {canEdit && status === "rejected" && (
          <Button type="button" size="lg" disabled={isPending} onClick={() => run(resubmit)}>
            {isPending ? "Working…" : "Resubmit"}
          </Button>
        )}

        {canEdit && status !== "approved" && (
          <Button type="button" size="lg" variant="destructive" disabled={isPending} onClick={() => setConfirming("delete")}>
            Delete
          </Button>
        )}
      </div>

      <FormError error={error} className="mt-3" />

      {confirming === "reject" && (
        <ConfirmPanel
          title={status === "approved" ? "Unapprove this expense?" : "Reject this expense?"}
          description="The reason is shown to whoever filed it."
          reason={{ value: reason, onChange: setReason, placeholder: "What needs fixing?", label: "Reason" }}
          confirmLabel="Confirm"
          cancelLabel="Cancel"
          isPending={isPending}
          onConfirm={() => run(reject, { reason })}
          onCancel={() => setConfirming(null)}
        />
      )}

      {confirming === "delete" && (
        <ConfirmPanel
          title="Delete this expense and its receipts?"
          confirmLabel="Delete"
          pendingLabel="Deleting…"
          isPending={isPending}
          onConfirm={() => run(remove)}
          onCancel={() => setConfirming(null)}
        />
      )}
    </div>
  );
}
