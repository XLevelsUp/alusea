"use client";

import { Button } from "@/components/ui/button";
import { useAction } from "@/hooks/use-action";
import type { Action } from "@/lib/actions";

type Props = {
  id: string;
  // Used in the confirmation prompt, e.g. "product" or "blog post".
  itemLabel: string;
  deleteAction: Action<[string]>;
};

export default function DeleteButton({ id, itemLabel, deleteAction }: Props) {
  const { run, isPending, error } = useAction(deleteAction);

  return (
    <span className="inline-flex flex-col items-end">
      <Button
        type="button"
        variant="destructive"
        size="sm"
        disabled={isPending}
        onClick={() => {
          if (window.confirm(`Are you sure you want to delete this ${itemLabel}?`)) run(id);
        }}
      >
        {isPending ? "Deleting…" : "Delete"}
      </Button>
      {error && <span role="alert" className="text-xs text-destructive mt-1 max-w-56 text-right">{error}</span>}
    </span>
  );
}
