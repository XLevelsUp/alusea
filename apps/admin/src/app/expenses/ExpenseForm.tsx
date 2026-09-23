"use client";

import { useState } from "react";
import Link from "next/link";
import { FormError, SelectField, TextareaField, TextField } from "@/components/form-fields";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { NativeSelectOption } from "@/components/ui/native-select";
import { useAction } from "@/hooks/use-action";
import type { Action } from "@/lib/actions";
import { formatPaise, previewRupeesToPaise } from "@/lib/erp/money";
import type { Expense } from "@/lib/supabase/types";

export type CategoryOption = { id: string; name: string };
export type VendorOption = { id: string; name: string };

const METHODS = [
  { value: "cash", label: "Cash" },
  { value: "bank_transfer", label: "Bank transfer" },
  { value: "upi", label: "UPI" },
  { value: "cheque", label: "Cheque" },
  { value: "card", label: "Card" },
  { value: "other", label: "Other" },
];

export default function ExpenseForm({
  initialData,
  categories,
  vendors,
  save,
  cancelUrl,
}: {
  initialData?: Expense;
  categories: CategoryOption[];
  vendors: VendorOption[];
  save: Action;
  cancelUrl: string;
}) {
  const isEdit = !!initialData;
  const [amount, setAmount] = useState(initialData ? (initialData.amount_paise / 100).toFixed(2) : "");
  const [tax, setTax] = useState(initialData?.tax_paise ? (initialData.tax_paise / 100).toFixed(2) : "");
  const { run, isPending, error } = useAction(save);

  const taxPaise = previewRupeesToPaise(tax);
  const netPaise = Math.max(0, previewRupeesToPaise(amount) - taxPaise);

  function onSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    // A new expense redirects to its own page from the server; an edit returns to where it came from.
    run(new FormData(e.currentTarget)).then((result) => {
      if (result.ok) window.location.href = cancelUrl;
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {isEdit && <input type="hidden" name="id" value={initialData.id} />}

      <Card>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TextField
            label="What was it for"
            name="description"
            required
            defaultValue={initialData?.description}
            placeholder="Aluminium sections for the Sharma job"
            className="sm:col-span-2"
          />

          <SelectField label="Category" name="category_id" required defaultValue={initialData?.category_id ?? ""}>
            <NativeSelectOption value="">Select a category…</NativeSelectOption>
            {categories.map((category) => (
              <NativeSelectOption key={category.id} value={category.id}>
                {category.name}
              </NativeSelectOption>
            ))}
          </SelectField>

          <TextField
            label="Date"
            name="spent_on"
            type="date"
            defaultValue={initialData?.spent_on ?? new Date().toISOString().slice(0, 10)}
          />

          <TextField
            label="Amount paid"
            name="amount"
            required
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            hint="The total including any GST"
          />

          <TextField
            label="GST portion"
            name="tax"
            inputMode="decimal"
            value={tax}
            onChange={(e) => setTax(e.target.value)}
            placeholder="0.00"
            hint={taxPaise > 0 ? `Net of GST: ${formatPaise(netPaise)}` : "The GST already inside the amount, if any"}
          />

          <SelectField label="Paid by" name="payment_method" defaultValue={initialData?.payment_method ?? "cash"}>
            {METHODS.map((method) => (
              <NativeSelectOption key={method.value} value={method.value}>
                {method.label}
              </NativeSelectOption>
            ))}
          </SelectField>

          <SelectField label="Vendor" name="party_id" defaultValue={initialData?.party_id ?? ""}>
            <NativeSelectOption value="">Not recorded</NativeSelectOption>
            {vendors.map((vendor) => (
              <NativeSelectOption key={vendor.id} value={vendor.id}>
                {vendor.name}
              </NativeSelectOption>
            ))}
          </SelectField>

          <TextField label="Reference" name="reference" defaultValue={initialData?.reference} placeholder="Bill number, UTR…" />
          <TextField label="Project" name="project_tag" defaultValue={initialData?.project_tag} placeholder="Optional, to group by job" />

          <TextareaField label="Notes" name="notes" rows={2} defaultValue={initialData?.notes} className="sm:col-span-2" />
        </CardContent>
      </Card>

      <FormError error={error} />

      <div className="flex gap-3">
        <Button type="submit" variant="brand" disabled={isPending}>
          {isPending ? "Saving…" : isEdit ? "Save Changes" : "Save Expense"}
        </Button>
        <Button asChild variant="outline">
          <Link href={cancelUrl}>Cancel</Link>
        </Button>
      </div>
    </form>
  );
}
