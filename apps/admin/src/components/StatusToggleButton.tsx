"use client";

import { useConfirm } from "@/components/ConfirmProvider";
import { Button } from "@/components/ui/button";
import { useAction } from "@/hooks/use-action";
import type { Action } from "@/lib/actions";

type Props = {
  id: string;
  isActive: boolean;
  setActive: Action;
  // Named in the confirmation, e.g. name "Sharma Constructions" and itemLabel "party".
  name: string;
  itemLabel: string;
  // What deactivating means for this kind of record, shown under the question.
  deactivateNote?: string;
};

export default function StatusToggleButton({ id, isActive, setActive, name, itemLabel, deactivateNote }: Props) {
  const { run, isPending, error } = useAction(setActive);
  const confirm = useConfirm();

  async function toggle() {
    // Reactivating restores access, so only the negative direction asks first.
    if (isActive) {
      const ok = await confirm({
        title: `Deactivate ${name}?`,
        description: deactivateNote ?? `This ${itemLabel} will be hidden from new work. You can reactivate them at any time.`,
        confirmLabel: "Deactivate",
      });
      if (!ok) return;
    }

    const formData = new FormData();
    formData.set("id", id);
    formData.set("is_active", String(!isActive));
    run(formData);
  }

  return (
    <div className="inline-flex flex-col items-end">
      <Button type="button" variant="outline" size="sm" disabled={isPending} onClick={toggle}>
        {isPending ? "…" : isActive ? "Deactivate" : "Reactivate"}
      </Button>
      {error && <span role="alert" className="text-xs text-destructive mt-1">{error}</span>}
    </div>
  );
}
