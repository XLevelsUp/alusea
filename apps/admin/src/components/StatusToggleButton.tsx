"use client";

import { Button } from "@/components/ui/button";
import { useAction } from "@/hooks/use-action";
import type { Action } from "@/lib/actions";

type Props = {
  id: string;
  isActive: boolean;
  setActive: Action;
};

export default function StatusToggleButton({ id, isActive, setActive }: Props) {
  const { run, isPending, error } = useAction(setActive);

  return (
    <div className="inline-flex flex-col items-end">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={isPending}
        onClick={() => {
          const formData = new FormData();
          formData.set("id", id);
          formData.set("is_active", String(!isActive));
          run(formData);
        }}
      >
        {isPending ? "…" : isActive ? "Deactivate" : "Reactivate"}
      </Button>
      {error && <span role="alert" className="text-xs text-destructive mt-1">{error}</span>}
    </div>
  );
}
