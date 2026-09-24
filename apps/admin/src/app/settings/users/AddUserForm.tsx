"use client";

import { FormActions, FormError, SelectField, TextField } from "@/components/form-fields";
import { FieldGroup } from "@/components/ui/field";
import { NativeSelectOption } from "@/components/ui/native-select";
import { useFormDone } from "@/components/FormDialog";
import { useAction } from "@/hooks/use-action";
import type { Action } from "@/lib/actions";
import { ROLES, ROLE_LABELS } from "@/lib/auth/roles";

type Props = {
  add: Action;
  cancelUrl?: string;
};

export default function AddUserForm({ add, cancelUrl }: Props) {
  const { run, isPending, error } = useAction(add);
  const done = useFormDone(cancelUrl);

  function onSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    run(new FormData(e.currentTarget)).then((result) => {
      if (result.ok) done();
    });
  }

  return (
    <form onSubmit={onSubmit}>
      <FieldGroup>
        <TextField label="Full name" name="full_name" required />
        <TextField label="Email" name="email" type="email" required />
        <TextField
          label="Temporary password"
          name="password"
          required
          minLength={8}
          hint="Share this with them directly, then ask them to change it after signing in."
        />
        <SelectField label="Role" name="role" required defaultValue="staff">
          {ROLES.map((role) => (
            <NativeSelectOption key={role} value={role}>
              {ROLE_LABELS[role]}
            </NativeSelectOption>
          ))}
        </SelectField>

        <FormError error={error} />
        <FormActions isPending={isPending} pendingLabel="Creating…" submitLabel="Create User" cancelUrl={cancelUrl} />
      </FieldGroup>
    </form>
  );
}
