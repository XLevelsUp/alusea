"use client";

import { CancelButton, useFormDone } from "@/components/FormDialog";
import { FormError, TextField } from "@/components/form-fields";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { useAction } from "@/hooks/use-action";
import { addCategory, updateCategory } from "../actions";

type Category = {
  id: string;
  name: string;
};

export default function CategoryForm({ initialData, cancelUrl }: { initialData?: Category, cancelUrl?: string }) {
  const { run, isPending, error } = useAction(initialData ? updateCategory : addCategory);
  const done = useFormDone(cancelUrl);

  const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    run(new FormData(e.currentTarget)).then((result) => {
      if (!result.ok) return;
      alert(initialData ? "Category updated successfully!" : "Category added successfully!");
      done();
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <FieldGroup>
        {initialData && <input type="hidden" name="id" value={initialData.id} />}

        <TextField label="Category Name" name="name" required defaultValue={initialData?.name} placeholder="e.g. Windows" />

        <FormError error={error} />

        <div className="flex gap-3">
          <CancelButton cancelUrl={cancelUrl} className="w-1/3" />
          <Button type="submit" variant="brand" disabled={isPending} className="flex-1">
            {isPending ? "Saving…" : initialData ? "Update Category" : "Add Category"}
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
}
