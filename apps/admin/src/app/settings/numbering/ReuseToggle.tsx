"use client";

import { useState } from "react";
import { toast } from "sonner";
import { FormError } from "@/components/form-fields";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldLabel } from "@/components/ui/field";
import { useActionRunner } from "@/hooks/use-action";
import { setReuseCancelledNumbers } from "./actions";

/** The on/off switch for giving cancelled invoice numbers to the next invoice. */
export default function ReuseToggle({ initial }: { initial: boolean }) {
  const [on, setOn] = useState(initial);
  const { run, isPending, error } = useActionRunner();

  function change(next: boolean) {
    setOn(next);
    const formData = new FormData();
    formData.set("reuse", String(next));
    run(setReuseCancelledNumbers, formData).then((result) => {
      if (result.ok) toast.success(next ? "Cancelled numbers will be reused" : "Cancelled numbers will not be reused");
      else setOn(!next);
    });
  }

  return (
    <div>
      <Field orientation="horizontal" className="w-auto">
        <Checkbox id="reuse_cancelled" checked={on} disabled={isPending} onCheckedChange={(checked) => change(checked === true)} />
        <FieldLabel htmlFor="reuse_cancelled" className="font-normal">
          Give a cancelled invoice&apos;s number to the next invoice issued
        </FieldLabel>
      </Field>
      <FormError error={error} className="mt-3" />
    </div>
  );
}
