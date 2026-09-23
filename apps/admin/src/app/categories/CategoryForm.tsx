"use client";

import Link from "next/link";
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

  const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Captured now: React clears currentTarget once the handler returns, before the action resolves.
    const form = e.currentTarget;

    run(new FormData(form)).then((result) => {
      if (!result.ok) return;
      alert(initialData ? "Category updated successfully!" : "Category added successfully!");
      if (cancelUrl) {
        window.location.href = cancelUrl;
      } else {
        form.reset();
      }
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <FieldGroup>
        {initialData && <input type="hidden" name="id" value={initialData.id} />}

        <TextField label="Category Name" name="name" required defaultValue={initialData?.name} placeholder="e.g. Windows" />

        <FormError error={error} />

        <div className="flex gap-3">
          {cancelUrl && (
            <Button asChild variant="secondary" className="w-1/3">
              <Link href={cancelUrl}>Cancel</Link>
            </Button>
          )}
          <Button type="submit" variant="brand" disabled={isPending} className="flex-1">
            {isPending ? "Saving…" : initialData ? "Update Category" : "Add Category"}
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
}
