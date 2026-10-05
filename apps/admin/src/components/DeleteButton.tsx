"use client";

import { toast } from "sonner";
import { useRouter } from "next/navigation";
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
  // Where to go once it is gone, for a delete button that sits on the record's own page.
  redirectTo?: string;
  size?: "sm" | "lg";
};

export default function DeleteButton({ id, itemLabel, name, deleteAction, redirectTo, size = "sm" }: Props) {
  const router = useRouter();
  const { run, isPending, error } = useAction(deleteAction);
  const confirm = useConfirm();

  async function onDelete() {
    const ok = await confirm({
      title: name ? `Delete “${name}”?` : `Delete this ${itemLabel}?`,
      description: `This permanently removes the ${itemLabel}. It cannot be undone.`,
      confirmLabel: "Delete",
    });
    if (!ok) return;
    const result = await run(id);
    if (!result.ok) return;
    toast.success(`${itemLabel.charAt(0).toUpperCase()}${itemLabel.slice(1)} deleted`);
    if (redirectTo) router.push(redirectTo);
  }

  return (
    <span className="inline-flex flex-col items-end">
      <Button type="button" variant="destructive" size={size} disabled={isPending} onClick={onDelete}>
        {isPending ? "Deleting…" : "Delete"}
      </Button>
      {error && <span role="alert" className="text-xs text-destructive mt-1 max-w-56 text-right">{error}</span>}
    </span>
  );
}
