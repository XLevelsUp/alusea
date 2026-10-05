"use client";

import { toast } from "sonner";
import { useConfirm } from "@/components/ConfirmProvider";
import { FormError } from "@/components/form-fields";
import { Button } from "@/components/ui/button";
import { useActionRunner } from "@/hooks/use-action";
import type { Action } from "@/lib/actions";
import type { Settlement } from "@/lib/erp/expenses";
import type { ExpenseStatus } from "@/lib/supabase/types";

export default function ExpenseActions({
  expenseId,
  status,
  canApprove,
  canEdit,
  settlement,
  payeeName,
  approve,
  reject,
  resubmit,
  remove,
  markPaid,
  markReimbursed,
  undoSettlement,
}: {
  expenseId: string;
  status: ExpenseStatus;
  canApprove: boolean;
  canEdit: boolean;
  // Null until approved; then which payment step is next or already done.
  settlement: Settlement | null;
  payeeName: string;
  approve: Action;
  reject: Action;
  resubmit: Action;
  remove: Action;
  markPaid: Action;
  markReimbursed: Action;
  undoSettlement: Action;
}) {
  const { run: runAction, isPending, error } = useActionRunner();
  const confirm = useConfirm();

  function run(action: Action, done: string, extra?: Record<string, string>) {
    const formData = new FormData();
    formData.set("id", expenseId);
    for (const [key, value] of Object.entries(extra ?? {})) formData.set(key, value);
    runAction(action, formData).then((result) => {
      if (result.ok) toast.success(done);
    });
  }

  async function onReject() {
    const answer = await confirm({
      title: status === "approved" ? "Unapprove this expense?" : "Reject this expense?",
      description: "The reason is shown to whoever filed it.",
      reason: { label: "Reason", placeholder: "What needs fixing?" },
      confirmLabel: status === "approved" ? "Unapprove" : "Reject",
    });
    if (answer) run(reject, status === "approved" ? "Expense unapproved" : "Expense rejected", { reason: answer.reason });
  }

  async function onReimburse() {
    const ok = await confirm({
      tone: "neutral",
      title: `Mark as paid back to ${payeeName}?`,
      description: "Record this only once they have actually been paid back.",
      confirmLabel: "Mark paid back",
    });
    if (ok) run(markReimbursed, "Marked as paid back");
  }

  async function onUndo() {
    const ok = await confirm({
      title: settlement === "reimbursed" ? "Undo the pay back?" : "Undo the payment?",
      description: "The expense goes back to waiting, as if it had not been recorded.",
      confirmLabel: "Undo",
    });
    if (ok) run(undoSettlement, "Undone");
  }

  async function onDelete() {
    const ok = await confirm({
      title: "Delete this expense and its receipts?",
      description: "The expense and every receipt attached to it are removed permanently.",
      confirmLabel: "Delete",
    });
    if (ok) run(remove, "Expense deleted");
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {canApprove && status === "submitted" && (
          <>
            <Button type="button" size="lg" variant="brand" disabled={isPending} onClick={() => run(approve, "Expense approved")}>
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

        {canApprove && settlement === "to_pay" && (
          <Button type="button" size="lg" variant="brand" disabled={isPending} onClick={() => run(markPaid, "Marked as paid")}>
            {isPending ? "Working…" : "Mark as Paid"}
          </Button>
        )}

        {canApprove && settlement === "to_reimburse" && (
          <Button type="button" size="lg" variant="brand" disabled={isPending} onClick={onReimburse}>
            {isPending ? "Working…" : "Mark as Paid Back"}
          </Button>
        )}

        {canApprove && (settlement === "paid" || settlement === "reimbursed") && (
          <Button type="button" size="lg" variant="outline" disabled={isPending} onClick={onUndo}>
            {settlement === "reimbursed" ? "Undo Pay Back" : "Undo Payment"}
          </Button>
        )}

        {canEdit && status === "rejected" && (
          <Button type="button" size="lg" disabled={isPending} onClick={() => run(resubmit, "Expense resubmitted")}>
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
