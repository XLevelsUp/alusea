"use client";

import { useConfirm } from "@/components/ConfirmProvider";
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
  const confirm = useConfirm();

  function run(action: Action, extra?: Record<string, string>) {
    const formData = new FormData();
    formData.set("id", expenseId);
    for (const [key, value] of Object.entries(extra ?? {})) formData.set(key, value);
    runAction(action, formData);
  }

  async function onReject() {
    const answer = await confirm({
      title: status === "approved" ? "Unapprove this expense?" : "Reject this expense?",
      description: "The reason is shown to whoever filed it.",
      reason: { label: "Reason", placeholder: "What needs fixing?" },
      confirmLabel: status === "approved" ? "Unapprove" : "Reject",
    });
    if (answer) run(reject, { reason: answer.reason });
  }

  async function onDelete() {
    const ok = await confirm({
      title: "Delete this expense and its receipts?",
      description: "The expense and every receipt attached to it are removed permanently.",
      confirmLabel: "Delete",
    });
    if (ok) run(remove);
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {canApprove && status === "submitted" && (
          <>
            <Button type="button" size="lg" variant="brand" disabled={isPending} onClick={() => run(approve)}>
              {isPending ? "Working…" : "Approve"}
            </Button>
            <Button type="button" size="lg" variant="destructive" disabled={isPending} onClick={onReject}>
              Reject
            </Button>
          </>
        )}

        {canApprove && status === "approved" && (
          <Button type="button" size="lg" variant="destructive" disabled={isPending} onClick={onReject}>
            Unapprove
          </Button>
        )}

        {canEdit && status === "rejected" && (
          <Button type="button" size="lg" disabled={isPending} onClick={() => run(resubmit)}>
            {isPending ? "Working…" : "Resubmit"}
          </Button>
        )}

        {canEdit && status !== "approved" && (
          <Button type="button" size="lg" variant="destructive" disabled={isPending} onClick={onDelete}>
            Delete
          </Button>
        )}
      </div>

      <FormError error={error} className="mt-3" />
    </div>
  );
}
