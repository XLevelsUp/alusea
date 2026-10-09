"use client";

import { todayInIndia } from "@/lib/erp/dates";
import { useState } from "react";
import { FormActions, FormError, SelectField, TextareaField, TextField } from "@/components/form-fields";
import { useFormDone } from "@/components/FormDialog";
import { SearchSelectField } from "@/components/SearchSelect";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { NativeSelectOption } from "@/components/ui/native-select";
import { useAction } from "@/hooks/use-action";
import type { Action } from "@/lib/actions";
import { CAPITAL_KINDS, LEDGER_CATEGORIES } from "@/lib/erp/finance";
import { formatPaise } from "@/lib/erp/money";
import { recordPayment } from "@/app/invoices/actions";
import { addCapitalInflow, addLedgerEntry, updateCapitalInflow } from "./actions";
import type { CapitalRow, InvoiceRow, PartyOption } from "./types";

const today = () => todayInIndia();

const METHODS = [
  { value: "bank_transfer", label: "Bank transfer" },
  { value: "upi", label: "UPI" },
  { value: "cash", label: "Cash" },
  { value: "cheque", label: "Cheque" },
  { value: "card", label: "Card" },
  { value: "other", label: "Other" },
];

function useSubmit(action: Action, saved: string) {
  const { run, isPending, error } = useAction(action);
  const done = useFormDone();
  function onSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    run(new FormData(e.currentTarget)).then((result) => {
      if (result.ok) done(saved);
    });
  }
  return { onSubmit, isPending, error };
}

// Records money received against an issued invoice. Payments are entered here rather than on the invoice, as in the reference.
export function PaymentForm({ invoices }: { invoices: InvoiceRow[] }) {
  const { onSubmit, isPending, error } = useSubmit(recordPayment, "Payment recorded");
  const [invoiceId, setInvoiceId] = useState("");
  const invoice = invoices.find((row) => row.id === invoiceId);

  if (invoices.length === 0) {
    return <p className="text-sm text-gray-500">No issued invoice has an unpaid balance, so there is nothing to record a payment against.</p>;
  }

  return (
    <form onSubmit={onSubmit}>
      <FieldGroup>
        <SearchSelectField
          label="Invoice"
          name="invoice_id"
          required
          value={invoiceId}
          onChange={setInvoiceId}
          placeholder="Choose an invoice…"
          options={invoices.map((row) => ({
            value: row.id,
            label: `${row.number ?? "Invoice"} — ${row.partyName}`,
            detail: `${formatPaise(row.balance_paise)} due`,
          }))}
          hint={invoice ? `${formatPaise(invoice.balance_paise)} still due from ${invoice.partyName}` : "Only invoices with money still due are listed"}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Keyed on the invoice so choosing one fills in its full balance, which can then be lowered for a part payment. */}
          <TextField
            key={invoiceId}
            label="Amount received"
            name="amount"
            required
            inputMode="decimal"
            defaultValue={invoice ? (invoice.balance_paise / 100).toFixed(2) : ""}
            placeholder="0.00"
          />
          <TextField label="Date received" name="paid_on" type="date" defaultValue={today()} />
          <SelectField label="Method" name="method" defaultValue="bank_transfer">
            {METHODS.map((method) => (
              <NativeSelectOption key={method.value} value={method.value}>
                {method.label}
              </NativeSelectOption>
            ))}
          </SelectField>
          <TextField label="Reference" name="reference" placeholder="UTR, cheque number…" />
        </div>
        <FormError error={error} />
        <FormActions isPending={isPending} submitLabel="Record Payment" />
      </FieldGroup>
    </form>
  );
}

// A movement nothing else records: bank charges, drawings, loan repayments, opening balances. It counts once approved.
export function LedgerEntryForm({ parties }: { parties: PartyOption[] }) {
  const { onSubmit, isPending, error } = useSubmit(addLedgerEntry, "Entry added. It is waiting for approval.");
  // Controlled because a GST claim is only offered on money going out.
  const [direction, setDirection] = useState("out");
  const [gstClaim, setGstClaim] = useState(false);

  return (
    <form onSubmit={onSubmit}>
      <FieldGroup>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SelectField label="Direction" name="direction" required value={direction} onChange={(e) => setDirection(e.target.value)}>
            <NativeSelectOption value="in">Money in</NativeSelectOption>
            <NativeSelectOption value="out">Money out</NativeSelectOption>
          </SelectField>
          <SelectField label="Category" name="category" required defaultValue="other">
            {LEDGER_CATEGORIES.map((category) => (
              <NativeSelectOption key={category.value} value={category.value}>
                {category.label}
              </NativeSelectOption>
            ))}
          </SelectField>
          <TextField label="Amount" name="amount" required inputMode="decimal" placeholder="0.00" />
          <TextField label="Date" name="entry_date" type="date" defaultValue={today()} />
        </div>
        {direction === "out" && (
          <Field orientation="horizontal">
            {/* Radix omits an unchecked box from the submitted form, so the hidden field carries the value either way. */}
            <input type="hidden" name="gst_claim" value={gstClaim ? "on" : "off"} />
            <Checkbox id="gst_claim" checked={gstClaim} onCheckedChange={(checked) => setGstClaim(checked === true)} />
            <div>
              <FieldLabel htmlFor="gst_claim" className="font-normal">GST claim</FieldLabel>
              <FieldDescription className="text-xs">Tick once the GST on this payment has been claimed. It can also be ticked later in the ledger.</FieldDescription>
            </div>
          </Field>
        )}
        <TextField label="Description" name="description" required placeholder="e.g. HDFC quarterly account charges" />
        <SearchSelectField
          label="Client or vendor"
          name="party_id"
          emptyLabel="None"
          options={parties.map((party) => ({ value: party.id, label: party.name }))}
          hint="Optional"
        />
        <p className="text-xs text-muted-foreground">The entry waits for approval and only counts in the ledger once approved.</p>
        <FormError error={error} />
        <FormActions isPending={isPending} submitLabel="Add Entry" />
      </FieldGroup>
    </form>
  );
}

export function CapitalForm({ initialData }: { initialData?: CapitalRow }) {
  const { onSubmit, isPending, error } = useSubmit(initialData ? updateCapitalInflow : addCapitalInflow, initialData ? "Capital updated" : "Capital recorded");

  return (
    <form onSubmit={onSubmit}>
      <FieldGroup>
        {initialData && <input type="hidden" name="id" value={initialData.id} />}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TextField label="Received from" name="source" required defaultValue={initialData?.source} placeholder="e.g. Owner, HDFC Bank" />
          <SelectField label="Type" name="kind" required defaultValue={initialData?.kind ?? "owner_capital"}>
            {CAPITAL_KINDS.map((kind) => (
              <NativeSelectOption key={kind.value} value={kind.value}>
                {kind.label}
              </NativeSelectOption>
            ))}
          </SelectField>
          <TextField
            label="Amount"
            name="amount"
            required
            inputMode="decimal"
            defaultValue={initialData ? (initialData.amount_paise / 100).toFixed(2) : ""}
            placeholder="0.00"
          />
          <TextField label="Date received" name="received_on" type="date" defaultValue={initialData?.received_on ?? today()} />
        </div>
        <TextareaField label="Notes" name="notes" rows={2} defaultValue={initialData?.notes} placeholder="Terms of a loan, what the money is for…" />
        <FormError error={error} />
        <FormActions isPending={isPending} submitLabel={initialData ? "Save Changes" : "Record Capital"} />
      </FieldGroup>
    </form>
  );
}
