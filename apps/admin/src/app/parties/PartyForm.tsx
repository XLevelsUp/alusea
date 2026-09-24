"use client";

import { FormActions, FormError, FormSection, SelectField, TextareaField, TextField } from "@/components/form-fields";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { NativeSelectOption } from "@/components/ui/native-select";
import { useFormDone } from "@/components/FormDialog";
import { useAction } from "@/hooks/use-action";
import type { Action } from "@/lib/actions";
import { INDIAN_STATES } from "@/lib/erp/states";
import type { Party } from "@/lib/supabase/types";

type Props = {
  initialData?: Party;
  add: Action;
  update: Action;
  cancelUrl?: string;
};

export default function PartyForm({ initialData, add, update, cancelUrl }: Props) {
  const isEdit = !!initialData;
  const { run, isPending, error } = useAction(isEdit ? update : add);
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
        {isEdit && <input type="hidden" name="id" value={initialData.id} />}

        <TextField label="Name" name="name" defaultValue={initialData?.name} required placeholder="Sharma Constructions Pvt Ltd" />

        <FieldSet>
          <FieldLegend variant="label">Type</FieldLegend>
          <div className="flex gap-6">
            <Field orientation="horizontal" className="w-auto">
              <Checkbox id="is_client" name="is_client" defaultChecked={initialData?.is_client ?? true} />
              <FieldLabel htmlFor="is_client" className="font-normal">Client</FieldLabel>
            </Field>
            <Field orientation="horizontal" className="w-auto">
              <Checkbox id="is_vendor" name="is_vendor" defaultChecked={initialData?.is_vendor ?? false} />
              <FieldLabel htmlFor="is_vendor" className="font-normal">Vendor</FieldLabel>
            </Field>
          </div>
          <FieldDescription>A party can be both, for example a supplier you also sell to.</FieldDescription>
        </FieldSet>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TextField label="Contact person" name="contact_person" defaultValue={initialData?.contact_person} />
          <TextField label="Phone" name="phone" defaultValue={initialData?.phone} />
          <TextField label="Email" name="email" type="email" defaultValue={initialData?.email} />
          <TextField
            label="Payment terms (days)"
            name="payment_terms_days"
            type="number"
            defaultValue={initialData?.payment_terms_days ?? 0}
            hint="Used to work out an invoice due date"
          />
        </div>

        <FormSection title="Billing address">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextField label="Address line 1" name="billing_address_line1" defaultValue={initialData?.billing_address_line1} />
            <TextField label="Address line 2" name="billing_address_line2" defaultValue={initialData?.billing_address_line2} />
            <TextField label="City" name="billing_city" defaultValue={initialData?.billing_city} />
            <SelectField
              label="State"
              name="billing_state_code"
              defaultValue={initialData?.billing_state_code ?? ""}
              hint="Decides IGST or CGST plus SGST on their invoices"
            >
              <NativeSelectOption value="">Select a state</NativeSelectOption>
              {INDIAN_STATES.map((state) => (
                <NativeSelectOption key={state.code} value={state.code}>
                  {state.code} — {state.name}
                </NativeSelectOption>
              ))}
            </SelectField>
            <TextField label="PIN code" name="billing_pincode" defaultValue={initialData?.billing_pincode} />
          </div>
        </FormSection>

        <FormSection title="Tax details">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextField label="GSTIN" name="gstin" defaultValue={initialData?.gstin} placeholder="33ABCDE1234F1Z5" hint="Leave blank if unregistered" />
            <TextField label="PAN" name="pan" defaultValue={initialData?.pan} placeholder="ABCDE1234F" />
          </div>
        </FormSection>

        <TextareaField label="Notes" name="notes" rows={3} defaultValue={initialData?.notes} />

        <FormError error={error} />
        <FormActions isPending={isPending} submitLabel={isEdit ? "Save Changes" : "Add Party"} cancelUrl={cancelUrl} />
      </FieldGroup>
    </form>
  );
}
