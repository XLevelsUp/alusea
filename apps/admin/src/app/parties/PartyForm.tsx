"use client";

import { useRef, useState } from "react";
import { FormActions, FormError, FormSection, SelectField, TextareaField, TextField } from "@/components/form-fields";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { NativeSelectOption } from "@/components/ui/native-select";
import { useFormDone } from "@/components/FormDialog";
import { useAction } from "@/hooks/use-action";
import type { Action } from "@/lib/actions";
import { VENDOR_TYPES, type AddedParty } from "@/lib/erp/parties";
import { INDIAN_STATES, isValidGstin, isValidPan } from "@/lib/erp/states";
import type { Party } from "@/lib/supabase/types";

type Props = {
  initialData?: Party;
  add: Action<[FormData], AddedParty | void>;
  update: Action<[FormData], AddedParty | void>;
  cancelUrl?: string;
  // Which box starts ticked on a new party, for when the form is opened from a client or a vendor picker.
  defaultKind?: "client" | "vendor";
  // Called with the new party once it is saved, so the form that opened this one can select it.
  onAdded?: (party: AddedParty) => void;
};

// The same checks the server makes on save, run while typing so a wrong number is caught at once.
function gstinProblem(gstin: string, stateCode: string): string | undefined {
  if (!gstin) return undefined;
  if (!isValidGstin(gstin)) return "GSTIN must be 15 characters in the standard format, for example 33ABCDE1234F1Z5";
  if (stateCode && gstin.slice(0, 2) !== stateCode) return `GSTIN starts with state code ${gstin.slice(0, 2)} but the selected state is ${stateCode}`;
  return undefined;
}

function panProblem(pan: string): string | undefined {
  if (pan && !isValidPan(pan)) return "PAN must be 10 characters in the standard format, for example ABCDE1234F";
  return undefined;
}

export default function PartyForm({ initialData, add, update, cancelUrl, defaultKind = "client", onAdded }: Props) {
  const isEdit = !!initialData;
  // Controlled so the vendor type selector appears only once Vendor is ticked.
  const [isVendor, setIsVendor] = useState(initialData?.is_vendor ?? defaultKind === "vendor");
  const { run, isPending, error } = useAction(isEdit ? update : add);
  const done = useFormDone(cancelUrl);
  const [gstin, setGstin] = useState(initialData?.gstin ?? "");
  const [pan, setPan] = useState(initialData?.pan ?? "");
  const [stateCode, setStateCode] = useState(initialData?.billing_state_code ?? "");
  // A field shows its error once the user has left it, and then updates on every key until it is right.
  const [checked, setChecked] = useState({ gstin: false, pan: false });
  const gstinRef = useRef<HTMLInputElement>(null);
  const panRef = useRef<HTMLInputElement>(null);
  const gstinError = checked.gstin ? gstinProblem(gstin, stateCode) : undefined;
  const panError = checked.pan ? panProblem(pan) : undefined;

  function onSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    // Opened from inside an invoice or expense form, this dialog is still that form's child in React, so the submit must not reach it.
    e.stopPropagation();
    // A wrong GSTIN or PAN stops the save right here and takes the user to it.
    const badGstin = gstinProblem(gstin, stateCode);
    const badPan = panProblem(pan);
    if (badGstin || badPan) {
      setChecked({ gstin: true, pan: true });
      (badGstin ? gstinRef : panRef).current?.focus();
      return;
    }
    run(new FormData(e.currentTarget)).then((result) => {
      if (!result.ok) return;
      if (result.data) onAdded?.(result.data);
      done(isEdit ? "Changes saved" : "Client or vendor added");
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
              <Checkbox id="is_client" name="is_client" defaultChecked={initialData?.is_client ?? defaultKind === "client"} />
              <FieldLabel htmlFor="is_client" className="font-normal">Client</FieldLabel>
            </Field>
            <Field orientation="horizontal" className="w-auto">
              <Checkbox id="is_vendor" name="is_vendor" checked={isVendor} onCheckedChange={(checked) => setIsVendor(checked === true)} />
              <FieldLabel htmlFor="is_vendor" className="font-normal">Vendor</FieldLabel>
            </Field>
          </div>
          <FieldDescription>A party can be both, for example a supplier you also sell to.</FieldDescription>
        </FieldSet>

        {isVendor && (
          <SelectField
            label="Vendor type"
            name="vendor_type"
            required
            defaultValue={initialData?.vendor_type ?? "local"}
            hint="Local suppliers, or ones you import from or export through"
          >
            {VENDOR_TYPES.map((type) => (
              <NativeSelectOption key={type.value} value={type.value}>
                {type.label}
              </NativeSelectOption>
            ))}
          </SelectField>
        )}

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
              onChange={(e) => setStateCode(e.target.value)}
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
            <TextField
              ref={gstinRef}
              label="GSTIN"
              name="gstin"
              value={gstin}
              onChange={(e) => setGstin(e.target.value.toUpperCase().trim())}
              onBlur={() => setChecked((current) => ({ ...current, gstin: true }))}
              maxLength={15}
              autoComplete="off"
              placeholder="33ABCDE1234F1Z5"
              hint="Leave blank if unregistered"
              error={gstinError}
            />
            <TextField
              ref={panRef}
              label="PAN"
              name="pan"
              value={pan}
              onChange={(e) => setPan(e.target.value.toUpperCase().trim())}
              onBlur={() => setChecked((current) => ({ ...current, pan: true }))}
              maxLength={10}
              autoComplete="off"
              placeholder="ABCDE1234F"
              error={panError}
            />
          </div>
        </FormSection>

        <TextareaField
          label="Services offered"
          name="services_offered"
          rows={2}
          defaultValue={initialData?.services_offered}
          placeholder="What you supply to them, or what they supply to you"
        />
        <TextareaField label="Notes" name="notes" rows={3} defaultValue={initialData?.notes} />

        <FormError error={error} />
        <FormActions isPending={isPending} submitLabel={isEdit ? "Save Changes" : "Save"} cancelUrl={cancelUrl} />
      </FieldGroup>
    </form>
  );
}
