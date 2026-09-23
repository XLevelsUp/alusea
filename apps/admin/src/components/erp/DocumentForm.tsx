"use client";

import { useState } from "react";
import Link from "next/link";
import { FormError, SelectField, TextareaField, TextField } from "@/components/form-fields";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldLabel } from "@/components/ui/field";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { useAction } from "@/hooks/use-action";
import type { Action } from "@/lib/actions";
import LineItemsEditor, { type EditorLine, type ProductOption } from "./LineItemsEditor";

export type PartyOption = {
  id: string;
  name: string;
  stateCode: string;
  stateName: string;
  gstin: string;
};

type Props = {
  kind: "quote" | "invoice";
  documentId?: string;
  quoteId?: string;
  parties: PartyOption[];
  products: ProductOption[];
  companyStateCode: string;
  initial: {
    partyId: string;
    issueDate: string;
    secondDate: string;
    isGstApplicable: boolean;
    gstRate: number;
    notes: string;
    lines: EditorLine[];
  };
  save: Action;
  cancelUrl: string;
};

export default function DocumentForm({
  kind,
  documentId,
  quoteId,
  parties,
  products,
  companyStateCode,
  initial,
  save,
  cancelUrl,
}: Props) {
  const [partyId, setPartyId] = useState(initial.partyId);
  const [isGst, setIsGst] = useState(initial.isGstApplicable);
  const [gstRate, setGstRate] = useState(initial.gstRate);
  const { run, isPending, error } = useAction(save);

  const party = parties.find((p) => p.id === partyId);
  const secondDateLabel = kind === "quote" ? "Valid until" : "Due date";
  const secondDateName = kind === "quote" ? "valid_until" : "due_date";

  function onSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    // Creating redirects to the new document from the server; saving an edit returns to where it came from.
    run(new FormData(e.currentTarget)).then((result) => {
      if (result.ok) window.location.href = cancelUrl;
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {documentId && <input type="hidden" name="id" value={documentId} />}
      {quoteId && <input type="hidden" name="quote_id" value={quoteId} />}

      <Card>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <SelectField
              label="Client"
              name="party_id"
              required
              value={partyId}
              onChange={(e) => setPartyId(e.target.value)}
              className="sm:col-span-2"
              hint={
                party && !party.stateCode ? (
                  <span className="text-amber-600">
                    This client has no state set, so the tax will be treated as same-state. Add one on their record.
                  </span>
                ) : undefined
              }
            >
              <NativeSelectOption value="">Select a client…</NativeSelectOption>
              {parties.map((option) => (
                <NativeSelectOption key={option.id} value={option.id}>
                  {option.name}
                  {option.stateName ? ` — ${option.stateName}` : ""}
                </NativeSelectOption>
              ))}
            </SelectField>

            <TextField label="Date" name="issue_date" type="date" defaultValue={initial.issueDate} />
            <TextField label={secondDateLabel} name={secondDateName} type="date" defaultValue={initial.secondDate} />
          </div>

          <div className="flex flex-wrap items-center gap-6 mt-5 pt-5 border-t">
            {/* Radix omits an unchecked box from the submitted form, so the hidden field carries the value either way. */}
            <input type="hidden" name="is_gst_applicable" value={isGst ? "on" : "off"} />
            <Field orientation="horizontal" className="w-auto">
              <Checkbox id="apply_gst" checked={isGst} onCheckedChange={(checked) => setIsGst(checked === true)} />
              <FieldLabel htmlFor="apply_gst" className="font-normal">Apply GST</FieldLabel>
            </Field>

            {isGst && (
              <Field orientation="horizontal" className="w-auto">
                <FieldLabel htmlFor="gst_rate" className="font-normal">Rate</FieldLabel>
                <NativeSelect
                  id="gst_rate"
                  name="gst_rate"
                  size="sm"
                  value={gstRate}
                  onChange={(e) => setGstRate(Number(e.target.value))}
                  className="w-24"
                >
                  {[5, 12, 18, 28].map((rate) => (
                    <NativeSelectOption key={rate} value={rate}>
                      {rate}%
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </Field>
            )}

            {!isGst && <p className="text-xs text-muted-foreground">No tax will be charged on this document.</p>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-matte-black">Line items</CardTitle>
          <CardDescription className="text-xs">
            Enter width and height to price by square foot, or leave them blank and type a quantity.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LineItemsEditor
            initialLines={initial.lines}
            products={products}
            companyStateCode={companyStateCode}
            partyStateCode={party?.stateCode ?? ""}
            isGstApplicable={isGst}
            gstRate={gstRate}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <TextareaField
            label="Notes"
            name="notes"
            rows={3}
            defaultValue={initial.notes}
            placeholder="Anything the client should see on this document"
          />
        </CardContent>
      </Card>

      <FormError error={error} />

      <div className="flex gap-3">
        <Button type="submit" variant="brand" disabled={isPending}>
          {isPending ? "Saving…" : documentId ? "Save Changes" : `Create ${kind === "quote" ? "Quotation" : "Invoice"}`}
        </Button>
        <Button asChild variant="outline">
          <Link href={cancelUrl}>Cancel</Link>
        </Button>
      </div>
    </form>
  );
}
