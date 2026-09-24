"use client";

import { useConfirm } from "@/components/ConfirmProvider";
import { FormError } from "@/components/form-fields";
import { Button } from "@/components/ui/button";
import { useActionRunner } from "@/hooks/use-action";
import type { Action } from "@/lib/actions";
import type { PayrollRunStatus } from "@/lib/supabase/types";

export default function RunActions({
  runId,
  status,
  canWrite,
  approve,
  markPaid,
  regenerate,
  remove,
}: {
  runId: string;
  status: PayrollRunStatus;
  canWrite: boolean;
  approve: Action;
  markPaid: Action;
  regenerate: Action;
  remove: Action;
}) {
  const { run: runAction, isPending, error } = useActionRunner();
  const confirm = useConfirm();

  if (!canWrite) return null;

  function run(action: Action) {
    const formData = new FormData();
    formData.set("run_id", runId);
    runAction(action, formData);
  }

  async function onApprove() {
    const ok = await confirm({
      tone: "neutral",
      title: "Approve this payroll run?",
      description: "The figures will be frozen and payslips generated. An approved run cannot be reopened or edited.",
      confirmLabel: "Yes, approve",
      cancelLabel: "Not yet",
    });
    if (ok) run(approve);
  }

  async function onMarkPaid() {
    const ok = await confirm({
      tone: "neutral",
      title: "Mark this run as paid?",
      description: "Record this only once the salaries have actually been transferred. It cannot be undone.",
      confirmLabel: "Mark as paid",
    });
    if (ok) run(markPaid);
  }

  async function onDelete() {
    const ok = await confirm({
      title: "Delete this draft run?",
      description: "Everything entered in it is removed. This cannot be undone.",
      confirmLabel: "Delete run",
      cancelLabel: "Keep it",
    });
    if (ok) run(remove);
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {status === "draft" && (
          <>
            <Button type="button" size="lg" disabled={isPending} onClick={onApprove}>
              {isPending ? "Working…" : "Approve Run"}
            </Button>
            <Button type="button" size="lg" variant="destructive" disabled={isPending} onClick={onDelete}>
              Delete Run
            </Button>
          </>
        )}

        {status === "approved" && (
          <Button type="button" size="lg" variant="brand" disabled={isPending} onClick={onMarkPaid}>
            {isPending ? "Working…" : "Mark as Paid"}
          </Button>
        )}

        {status !== "draft" && (
          <Button type="button" size="lg" variant="outline" disabled={isPending} onClick={() => run(regenerate)}>
            {isPending ? "Working…" : "Regenerate Payslips"}
          </Button>
        )}
      </div>

      <FormError error={error} className="mt-3" />
    </div>
  );
}
