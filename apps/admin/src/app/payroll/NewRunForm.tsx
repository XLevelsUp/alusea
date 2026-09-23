"use client";

import { TextField } from "@/components/form-fields";
import { Button } from "@/components/ui/button";
import { useAction } from "@/hooks/use-action";
import type { Action } from "@/lib/actions";

export default function NewRunForm({ defaultMonth, create }: { defaultMonth: string; create: Action }) {
  // Success redirects to the new run from the server, so only a failure needs handling here.
  const { run, isPending, error } = useAction(create);

  function onSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    run(new FormData(e.currentTarget));
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-wrap items-end gap-3">
      <TextField label="Month" name="period_month" type="month" defaultValue={defaultMonth} required className="w-auto" />
      <Button type="submit" size="lg" variant="brand" disabled={isPending}>
        {isPending ? "Starting…" : "Start Payroll Run"}
      </Button>
      {error && <p role="alert" className="w-full text-sm text-destructive">{error}</p>}
    </form>
  );
}
