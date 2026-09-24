"use client";

import { useConfirm } from "@/components/ConfirmProvider";
import { Button } from "@/components/ui/button";
import { useAction } from "@/hooks/use-action";
import type { Action } from "@/lib/actions";

type Props = {
  id: string;
  // Used in the confirmation, e.g. "product" or "blog post".
  itemLabel: string;
  // The record's own name, when it has one, so the question says exactly what goes.
  name?: string;
  deleteAction: Action<[string]>;
};

export default function DeleteButton({ id, itemLabel, name, deleteAction }: Props) {
  const { run, isPending, error } = useAction(deleteAction);
  const confirm = useConfirm();

  async function onDelete() {
    const ok = await confirm({
      title: name ? `Delete “${name}”?` : `Delete this ${itemLabel}?`,
      description: `This permanently removes the ${itemLabel}. It cannot be undone.`,
      confirmLabel: "Delete",
    });
    if (ok) run(id);
  }

  return (
    <span className="inline-flex flex-col items-end">
      <Button type="button" variant="destructive" size="sm" disabled={isPending} onClick={onDelete}>
        {isPending ? "Deleting…" : "Delete"}
      </Button>
      {error && <span role="alert" className="text-xs text-destructive mt-1 max-w-56 text-right">{error}</span>}
    </span>
  );
}
