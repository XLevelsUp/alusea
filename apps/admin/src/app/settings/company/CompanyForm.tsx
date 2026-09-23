"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FormCard, FormError, SelectField, TextareaField, TextField } from "@/components/form-fields";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { NativeSelectOption } from "@/components/ui/native-select";
import { useAction } from "@/hooks/use-action";
import type { Action } from "@/lib/actions";
import { INDIAN_STATES } from "@/lib/erp/states";
import type { CompanyProfile } from "@/lib/supabase/types";

type Props = {
  profile: CompanyProfile;
  save: Action;
};

const grid = "grid grid-cols-1 sm:grid-cols-2 gap-4";

export default function CompanyForm({ profile, save }: Props) {
  const router = useRouter();
  const { run, isPending, error } = useAction(save);
  const [saved, setSaved] = useState(false);

  function onSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaved(false);
    run(new FormData(e.currentTarget)).then((result) => {
      if (result.ok) {
        setSaved(true);
        // This page has no list to return to, so it refreshes in place: the fields then show what is actually stored rather than what was typed.
        router.refresh();
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <FormCard title="Identity" description="Printed as the supplier on every invoice and quotation.">
        <div className={grid}>
          <TextField label="Legal name" name="legal_name" defaultValue={profile.legal_name} required placeholder="Alusea Aluminium Systems Pvt Ltd" />
          <TextField label="Trade name" name="trade_name" defaultValue={profile.trade_name} placeholder="Alusea" hint="Shown if different from the legal name" />
        </div>
      </FormCard>

      <FormCard title="Registered address" description="The state here decides whether an invoice charges IGST or CGST plus SGST.">
        <div className={grid}>
          <TextField label="Address line 1" name="address_line1" defaultValue={profile.address_line1} />
          <TextField label="Address line 2" name="address_line2" defaultValue={profile.address_line2} />
          <TextField label="City" name="city" defaultValue={profile.city} />
          <SelectField label="State" name="state_code" defaultValue={profile.state_code}>
            <NativeSelectOption value="">Select a state</NativeSelectOption>
            {INDIAN_STATES.map((state) => (
              <NativeSelectOption key={state.code} value={state.code}>
                {state.code} — {state.name}
              </NativeSelectOption>
            ))}
          </SelectField>
          <TextField label="PIN code" name="pincode" defaultValue={profile.pincode} />
          <TextField label="Phone" name="phone" defaultValue={profile.phone} />
          <TextField label="Email" name="email" type="email" defaultValue={profile.email} />
          <TextField label="Website" name="website" defaultValue={profile.website} />
        </div>
      </FormCard>

      <FormCard title="Tax registration" description="Leave blank if not registered; invoices will then have GST switched off.">
        <div className={grid}>
          <TextField label="GSTIN" name="gstin" defaultValue={profile.gstin} placeholder="33ABCDE1234F1Z5" hint="15 characters, starting with your state code" />
          <TextField label="PAN" name="pan" defaultValue={profile.pan} placeholder="ABCDE1234F" />
          <TextField
            label="Default GST rate (%)"
            name="default_gst_rate"
            type="number"
            defaultValue={profile.default_gst_rate}
            hint="Pre-selected on new invoices, still changeable per invoice"
          />
        </div>
      </FormCard>

      <FormCard title="Bank details" description="Printed on invoices so clients know where to pay.">
        <div className={grid}>
          <TextField label="Bank name" name="bank_name" defaultValue={profile.bank_name} />
          <TextField label="Account name" name="bank_account_name" defaultValue={profile.bank_account_name} />
          <TextField label="Account number" name="bank_account_number" defaultValue={profile.bank_account_number} />
          <TextField label="IFSC" name="bank_ifsc" defaultValue={profile.bank_ifsc} />
          <TextField label="Branch" name="bank_branch" defaultValue={profile.bank_branch} />
        </div>
      </FormCard>

      <FormCard title="Invoice defaults" description="Standard wording added to every invoice.">
        <FieldGroup>
          <TextareaField
            label="Terms and conditions"
            name="invoice_terms"
            rows={4}
            defaultValue={profile.invoice_terms}
            placeholder="Payment due within 30 days of invoice date."
          />
          <TextareaField
            label="Footer note"
            name="invoice_footer"
            rows={2}
            defaultValue={profile.invoice_footer}
            placeholder="This is a computer-generated invoice."
          />
        </FieldGroup>
      </FormCard>

      <FormError error={error} />
      {saved && !error && (
        <Alert className="border-green-100 bg-green-50 text-green-800">
          <AlertTitle className="font-semibold">Company details saved.</AlertTitle>
          <AlertDescription className="text-xs text-green-700">
            <p>
              These now appear on every invoice, quotation and payslip.{" "}
              <Link href="/settings/documents" className="font-semibold">
                Check how they look on a PDF
              </Link>
              .
            </p>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex justify-end">
        <Button type="submit" variant="brand" disabled={isPending}>
          {isPending ? "Saving…" : "Save Company Details"}
        </Button>
      </div>
    </form>
  );
}
