"use client";

import { useState } from "react";
import ConfirmPanel from "@/components/ConfirmPanel";
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
  const [confirming, setConfirming] = useState<"approve" | "delete" | null>(null);

  if (!canWrite) return null;

  function run(action: Action) {
    const formData = new FormData();
    formData.set("run_id", runId);
    runAction(action, formData).then((result) => {
      if (result.ok) setConfirming(null);
    });
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {status === "draft" && (
          <>
            <Button type="button" size="lg" disabled={isPending} onClick={() => setConfirming("approve")}>
              Approve Run
            </Button>
            <Button type="button" size="lg" variant="destructive" disabled={isPending} onClick={() => setConfirming("delete")}>
              Delete Run
            </Button>
          </>
        )}

        {status === "approved" && (
          <Button type="button" size="lg" variant="brand" disabled={isPending} onClick={() => run(markPaid)}>
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

      {confirming === "approve" && (
        <ConfirmPanel
          tone="neutral"
          title="Approve this payroll run?"
          description="The figures will be frozen and payslips generated. An approved run cannot be reopened or edited."
          confirmLabel="Yes, approve"
          pendingLabel="Approving…"
          cancelLabel="Not yet"
          isPending={isPending}
          onConfirm={() => run(approve)}
          onCancel={() => setConfirming(null)}
        />
      )}

      {confirming === "delete" && (
        <ConfirmPanel
          title="Delete this draft run and everything entered in it?"
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
