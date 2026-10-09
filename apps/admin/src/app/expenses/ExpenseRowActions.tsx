"use client";

import { CheckIcon } from "lucide-react";
import { toast } from "sonner";
import { useConfirm } from "@/components/ConfirmProvider";
import { Button } from "@/components/ui/button";
import { useActionRunner } from "@/hooks/use-action";
import type { Action } from "@/lib/actions";
import type { Settlement } from "@/lib/erp/expenses";
import { formatPaise } from "@/lib/erp/money";
import type { ExpenseStatus } from "@/lib/supabase/types";
import { approveExpense, approveExpenses, markExpensePaid, markExpenseReimbursed, rejectExpense } from "./actions";

// The next step for one expense, done from the list so nobody has to open the expense just to approve or settle it.
export function ExpenseRowActions({
  expenseId,
  status,
  settlement,
  payeeName,
}: {
  expenseId: string;
  status: ExpenseStatus;
  // Null until approved; then which payment step is next or already done.
  settlement: Settlement | null;
  payeeName: string;
}) {
  const { run: runAction, isPending, error } = useActionRunner();
  const confirm = useConfirm();

  async function run(action: Action, done: string, extra?: Record<string, string>) {
    const formData = new FormData();
    formData.set("id", expenseId);
    for (const [key, value] of Object.entries(extra ?? {})) formData.set(key, value);
    const result = await runAction(action, formData);
    if (result.ok) toast.success(done);
  }

  async function onReject() {
    const answer = await confirm({
      title: "Reject this expense?",
      description: "The reason is shown to whoever filed it.",
      reason: { label: "Reason", placeholder: "What needs fixing?" },
      confirmLabel: "Reject",
    });
    if (answer) run(rejectExpense, "Expense rejected", { reason: answer.reason });
  }

  async function onReimburse() {
    const ok = await confirm({
      tone: "neutral",
      title: `Mark as paid back to ${payeeName}?`,
      description: "Record this only once they have actually been paid back.",
      confirmLabel: "Mark paid back",
    });
    if (ok) run(markExpenseReimbursed, "Marked as paid back");
  }

  const nothingToDo = status !== "submitted" && settlement !== "to_pay" && settlement !== "to_reimburse";
  if (nothingToDo) return null;

  return (
    <div className="inline-flex flex-col items-end">
      <div className="flex justify-end gap-2">
        {status === "submitted" && (
          <>
            <Button type="button" size="sm" disabled={isPending} onClick={() => run(approveExpense, "Expense approved")}>
              <CheckIcon aria-hidden="true" />
              Approve
            </Button>
            <Button type="button" size="sm" variant="destructive" disabled={isPending} onClick={onReject}>
              Reject
            </Button>
          </>
        )}
        {settlement === "to_pay" && (
          <Button type="button" size="sm" variant="outline" disabled={isPending} onClick={() => run(markExpensePaid, "Marked as paid")}>
            Mark Paid
          </Button>
        )}
        {settlement === "to_reimburse" && (
          <Button type="button" size="sm" variant="outline" disabled={isPending} onClick={onReimburse}>
            Mark Paid Back
          </Button>
        )}
      </div>
      {error && <span role="alert" className="text-xs text-destructive mt-1 max-w-56 text-right">{error}</span>}
    </div>
  );
}

// Approves every expense still waiting in the list on screen, after one confirmation that states how many and how much.
export function ApproveAllButton({ ids, totalPaise }: { ids: string[]; totalPaise: number }) {
  const { run, isPending, error } = useActionRunner();
  const confirm = useConfirm();

  if (ids.length < 2) return null;

  async function onApproveAll() {
    const ok = await confirm({
      tone: "neutral",
      title: `Approve all ${ids.length} expenses?`,
      description: `${formatPaise(totalPaise)} in total will count as approved spend. Each one can still be unapproved from its own page.`,
      confirmLabel: `Approve ${ids.length}`,
    });
    if (!ok) return;

    const formData = new FormData();
    formData.set("ids", ids.join(","));
    const result = await run(approveExpenses, formData);
    if (result.ok) toast.success(`${ids.length} expenses approved`);
  }

  return (
    <span className="inline-flex flex-col items-end">
      <Button type="button" size="lg" disabled={isPending} onClick={onApproveAll}>
        <CheckIcon aria-hidden="true" />
        {isPending ? "Approving…" : `Approve all ${ids.length}`}
      </Button>
      {error && <span role="alert" className="text-xs text-destructive mt-1">{error}</span>}
    </span>
  );
}
