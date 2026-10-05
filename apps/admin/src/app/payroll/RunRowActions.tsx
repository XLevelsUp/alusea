"use client";

import Link from "next/link";
import { toast } from "sonner";
import { useConfirm } from "@/components/ConfirmProvider";
import { Button } from "@/components/ui/button";
import { useAction } from "@/hooks/use-action";
import type { PayrollRunStatus } from "@/lib/supabase/types";
import { markPayrollPaid } from "./actions";

// The next step for a run, from the list: a draft still needs its figures reviewed, an approved run only needs marking paid.
export default function RunRowActions({ runId, status, period }: { runId: string; status: PayrollRunStatus; period: string }) {
  const { run, isPending, error } = useAction(markPayrollPaid);
  const confirm = useConfirm();

  async function onMarkPaid() {
    const ok = await confirm({
      tone: "neutral",
      title: `Mark ${period} as paid?`,
      description: "Record this only once the salaries have actually been transferred. It cannot be undone.",
      confirmLabel: "Mark as paid",
    });
    if (!ok) return;

    const formData = new FormData();
    formData.set("run_id", runId);
    const result = await run(formData);
    if (result.ok) toast.success(`${period} payroll marked as paid`);
  }

  if (status === "draft") {
    return (
      <Button asChild size="sm" variant="outline">
        <Link href={`/payroll/${runId}`}>Review &amp; approve</Link>
      </Button>
    );
  }
  if (status !== "approved") return null;

  return (
    <span className="inline-flex flex-col items-end">
      <Button type="button" size="sm" disabled={isPending} onClick={onMarkPaid}>
        {isPending ? "Working…" : "Mark as Paid"}
      </Button>
      {error && <span role="alert" className="text-xs text-destructive mt-1 max-w-56 text-right">{error}</span>}
    </span>
  );
}
