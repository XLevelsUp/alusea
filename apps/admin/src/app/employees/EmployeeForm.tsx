"use client";

import { useState } from "react";
import { FormActions, FormError, FormSection, SelectField, TextareaField, TextField } from "@/components/form-fields";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { AADHAAR_ACCEPT, AADHAAR_HINT, aadhaarFileProblem } from "@/lib/erp/aadhaar";
import { NativeSelectOption } from "@/components/ui/native-select";
import { useFormDone } from "@/components/FormDialog";
import { useAction } from "@/hooks/use-action";
import type { Action } from "@/lib/actions";
import type { Employee } from "@/lib/supabase/types";

type Props = {
  initialData?: Employee;
  add: Action;
  update: Action;
  cancelUrl?: string;
};

// Checks the file the moment it is picked, so an oversized or wrong-type scan is caught before any upload starts.
function AadhaarField({ employeeId, currentFileName }: { employeeId?: string; currentFileName?: string | null }) {
  const [problem, setProblem] = useState<string | null>(null);
  const [chosen, setChosen] = useState<string | null>(null);

  return (
    <Field data-invalid={!!problem || undefined}>
      <FieldLabel htmlFor="aadhaar">
        {currentFileName ? "Replace Aadhaar card" : "Upload Aadhaar card"}
        {!currentFileName && <span className="text-destructive">*</span>}
      </FieldLabel>
      {currentFileName && employeeId && (
        <FieldDescription>
          On file: {currentFileName} ·{" "}
          <a href={`/employees/${employeeId}/aadhaar`} target="_blank" rel="noopener noreferrer" className="font-semibold text-[#A67C52]">
            View
          </a>
        </FieldDescription>
      )}
      <Input
        id="aadhaar"
        name="aadhaar"
        type="file"
        accept={AADHAAR_ACCEPT}
        // Every employee must have a card on file; once one exists, choosing a new file is only a replacement.
        required={!currentFileName}
        aria-invalid={!!problem || undefined}
        aria-describedby="aadhaar-hint"
        onChange={(e) => {
          const file = e.target.files?.[0];
          const issue = file ? aadhaarFileProblem(file) : null;
          setProblem(issue);
          setChosen(file && !issue ? file.name : null);
          // Clearing the input means a rejected file is never submitted with the form.
          if (issue) e.target.value = "";
        }}
      />
      <FieldDescription id="aadhaar-hint">
        {chosen
          ? `Selected: ${chosen}. It uploads when you save.`
          : currentFileName
            ? `Only choose a file to replace the current card. ${AADHAAR_HINT}`
            : `Required. ${AADHAAR_HINT}`}
      </FieldDescription>
      <FieldError>{problem}</FieldError>
    </Field>
  );
}

export default function EmployeeForm({ initialData, add, update, cancelUrl }: Props) {
  const isEdit = !!initialData;
  const [workerType, setWorkerType] = useState(initialData?.worker_type ?? "monthly");
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

        <FormSection title="Aadhaar card">
          <AadhaarField employeeId={initialData?.id} currentFileName={initialData?.aadhaar_path ? initialData.aadhaar_file_name || "Aadhaar card" : null} />
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
