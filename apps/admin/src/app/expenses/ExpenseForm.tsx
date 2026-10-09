"use client";

import { todayInIndia } from "@/lib/erp/dates";
import { useState } from "react";
import { CancelButton, useFormDone } from "@/components/FormDialog";
import { FormError, SelectField, TextareaField, TextField } from "@/components/form-fields";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldDescription, FieldTitle } from "@/components/ui/field";
import ReceiptPicker from "@/components/ReceiptPicker";
import { SearchSelectField } from "@/components/SearchSelect";
import QuickAddParty from "@/components/erp/QuickAddParty";
import { NativeSelectOption } from "@/components/ui/native-select";
import { useAction } from "@/hooks/use-action";
import type { Action } from "@/lib/actions";
import { formatPaise, previewRupeesToPaise } from "@/lib/erp/money";
import { RECEIPT_HINT } from "@/lib/erp/receipts";
import type { PaidBy } from "@/lib/erp/expenses";
import type { Expense } from "@/lib/supabase/types";

export type CategoryOption = { id: string; name: string };
export type VendorOption = { id: string; name: string };
export type ClientOption = { id: string; name: string };

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
  clients,
  defaultClientId,
  save,
  cancelUrl,
  stayOn,
  canAddParty = false,
}: {
  initialData?: Expense;
  categories: CategoryOption[];
  vendors: VendorOption[];
  clients: ClientOption[];
  // Pre-selects the client when the form is opened from a client's page.
  defaultClientId?: string;
  save: Action;
  // Left out when the form is shown in a dialog, which simply closes.
  cancelUrl?: string;
  // Set when adding from another page's dialog, so saving stays there instead of opening the new expense.
  stayOn?: "finances";
  // Whether this person may create clients and vendors, which shows the add links under those two pickers.
  canAddParty?: boolean;
}) {
  const isEdit = !!initialData;
  const [amount, setAmount] = useState(initialData ? (initialData.amount_paise / 100).toFixed(2) : "");
  const [tax, setTax] = useState(initialData?.tax_paise ? (initialData.tax_paise / 100).toFixed(2) : "");
  const { run, isPending, error } = useAction(save);
  const done = useFormDone(cancelUrl);
  const [receipt, setReceipt] = useState<File | null>(null);
  // Controlled so the name box appears only when a person, not the company, paid.
  const [paidBy, setPaidBy] = useState<PaidBy>(initialData?.paid_by ?? "company");

  // Controlled so a vendor or client added from this form can be selected the moment it is saved.
  const [vendorId, setVendorId] = useState(initialData?.party_id ?? "");
  const [clientId, setClientId] = useState(initialData?.client_id ?? defaultClientId ?? "");
  const [addedVendors, setAddedVendors] = useState<VendorOption[]>([]);
  const [addedClients, setAddedClients] = useState<ClientOption[]>([]);
  const vendorOptions = [...vendors, ...addedVendors.filter((added) => !vendors.some((vendor) => vendor.id === added.id))];
  const clientOptions = [...clients, ...addedClients.filter((added) => !clients.some((client) => client.id === added.id))];

  const taxPaise = previewRupeesToPaise(tax);
  const netPaise = Math.max(0, previewRupeesToPaise(amount) - taxPaise);

  function onSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    // A new expense redirects to its own page from the server; an edit returns to where it came from.
    const formData = new FormData(e.currentTarget);
    // The receipt lives in state, since it can come from either the file picker or the camera.
    if (receipt) formData.set("receipt", receipt);
    run(formData).then((result) => {
      if (!result.ok) return;
      done("Expense added. It is waiting for approval.");
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {isEdit && <input type="hidden" name="id" value={initialData.id} />}
      {stayOn && <input type="hidden" name="stay" value={stayOn} />}

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
            defaultValue={initialData?.spent_on ?? todayInIndia()}
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

          <SelectField
            label="Paid by"
            name="paid_by"
            value={paidBy}
            onChange={(e) => setPaidBy(e.target.value as PaidBy)}
            hint={paidBy === "person" ? "The company owes this person until it is marked paid back" : "Company cash, card or bank account"}
          >
            <NativeSelectOption value="company">The company</NativeSelectOption>
            <NativeSelectOption value="person">A person, from their own money</NativeSelectOption>
          </SelectField>

          {paidBy === "person" ? (
            <TextField
              label="Who paid"
              name="paid_by_name"
              required
              defaultValue={initialData?.paid_by_name}
              placeholder="Name of the person to pay back"
            />
          ) : (
            // Keeps the two-column grid aligned when there is no name to ask for.
            <span className="hidden sm:block" aria-hidden="true" />
          )}

          <SelectField label="Payment mode" name="payment_method" defaultValue={initialData?.payment_method ?? "cash"}>
            {METHODS.map((method) => (
              <NativeSelectOption key={method.value} value={method.value}>
                {method.label}
              </NativeSelectOption>
            ))}
          </SelectField>

          <div>
            <SearchSelectField
              label="Vendor"
              name="party_id"
              value={vendorId}
              onChange={setVendorId}
              emptyLabel="Not recorded"
              options={vendorOptions.map((vendor) => ({ value: vendor.id, label: vendor.name }))}
            />
            {canAddParty && (
              <QuickAddParty
                kind="vendor"
                onAdded={(added) => {
                  // A party saved without the Vendor box ticked would not belong in this list.
                  if (!added.isVendor) return;
                  setAddedVendors((list) => [...list, { id: added.id, name: added.name }]);
                  setVendorId(added.id);
                }}
              />
            )}
          </div>

          <div>
            <SearchSelectField
              label="For client"
              name="client_id"
              value={clientId}
              onChange={setClientId}
              emptyLabel="Not for a client"
              options={clientOptions.map((client) => ({ value: client.id, label: client.name }))}
              hint="Whose job this was spent on, if any"
            />
            {canAddParty && (
              <QuickAddParty
                kind="client"
                onAdded={(added) => {
                  if (!added.isClient) return;
                  setAddedClients((list) => [...list, { id: added.id, name: added.name }]);
                  setClientId(added.id);
                }}
              />
            )}
          </div>

          <TextField label="Reference" name="reference" defaultValue={initialData?.reference} placeholder="Bill number, UTR…" />
          <TextField label="Project" name="project_tag" defaultValue={initialData?.project_tag} placeholder="Optional, to group by job" />

          {/* Only when adding: a saved expense manages its receipts, several if needed, on its own page. */}
          {!isEdit && (
            <Field className="sm:col-span-2">
              <FieldTitle>Receipt</FieldTitle>
              <ReceiptPicker file={receipt} onChange={setReceipt} disabled={isPending} />
              <FieldDescription>Optional. {RECEIPT_HINT} You can add more on the next screen.</FieldDescription>
            </Field>
          )}

          <TextareaField label="Notes" name="notes" rows={2} defaultValue={initialData?.notes} className="sm:col-span-2" />
        </CardContent>
      </Card>

      <FormError error={error} />

      <div className="flex gap-3">
        <Button type="submit" variant="brand" disabled={isPending}>
          {isPending ? "Saving…" : isEdit ? "Save Changes" : "Save Expense"}
        </Button>
        <CancelButton cancelUrl={cancelUrl} />
      </div>
    </form>
  );
}
