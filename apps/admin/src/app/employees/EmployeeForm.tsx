"use client";

import { useState } from "react";
import { FormActions, FormError, FormSection, SelectField, TextareaField, TextField } from "@/components/form-fields";
import { FieldGroup } from "@/components/ui/field";
import { NativeSelectOption } from "@/components/ui/native-select";
import { useAction } from "@/hooks/use-action";
import type { Action } from "@/lib/actions";
import type { Employee } from "@/lib/supabase/types";

type Props = {
  initialData?: Employee;
  add: Action;
  update: Action;
  cancelUrl: string;
};

export default function EmployeeForm({ initialData, add, update, cancelUrl }: Props) {
  const isEdit = !!initialData;
  const [workerType, setWorkerType] = useState(initialData?.worker_type ?? "monthly");
  const { run, isPending, error } = useAction(isEdit ? update : add);

  function onSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    run(new FormData(e.currentTarget)).then((result) => {
      if (result.ok) window.location.href = cancelUrl;
    });
  }

  return (
    <form onSubmit={onSubmit}>
      <FieldGroup>
        {isEdit && <input type="hidden" name="id" value={initialData.id} />}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TextField label="Employee code" name="employee_code" defaultValue={initialData?.employee_code} required placeholder="EMP-001" />
          <TextField label="Full name" name="full_name" defaultValue={initialData?.full_name} required />
          <TextField label="Designation" name="designation" defaultValue={initialData?.designation} placeholder="Site Supervisor" />
          <TextField label="Joining date" name="joining_date" type="date" defaultValue={initialData?.joining_date} />
        </div>

        <FormSection title="Pay">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SelectField
              label="How they are paid"
              name="worker_type"
              required
              value={workerType}
              onChange={(e) => setWorkerType(e.target.value as "monthly" | "daily")}
              hint={
                workerType === "monthly"
                  ? "Prorated over a fixed 30-day month by days worked."
                  : "Paid per day worked, with no proration."
              }
            >
              <NativeSelectOption value="monthly">Monthly salary</NativeSelectOption>
              <NativeSelectOption value="daily">Daily rate</NativeSelectOption>
            </SelectField>

            <TextField
              label={workerType === "monthly" ? "Monthly salary" : "Daily rate"}
              name="default_amount"
              defaultValue={initialData ? (initialData.default_amount_paise / 100).toFixed(2) : ""}
              placeholder="0.00"
              hint="Pre-fills payroll each month, and stays editable there"
            />
          </div>
        </FormSection>

        <FormSection title="Contact">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextField label="Phone" name="phone" defaultValue={initialData?.phone} />
            <TextField label="Address" name="address" defaultValue={initialData?.address} />
          </div>
        </FormSection>

        <FormSection title="Bank details">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextField label="Account name" name="bank_account_name" defaultValue={initialData?.bank_account_name} />
            <TextField label="Account number" name="bank_account_number" defaultValue={initialData?.bank_account_number} />
            <TextField label="IFSC" name="bank_ifsc" defaultValue={initialData?.bank_ifsc} />
          </div>
        </FormSection>

        <TextareaField label="Notes" name="notes" rows={2} defaultValue={initialData?.notes} />

        <FormError error={error} />
        <FormActions isPending={isPending} submitLabel={isEdit ? "Save Changes" : "Add Employee"} cancelUrl={cancelUrl} />
      </FieldGroup>
    </form>
  );
}
