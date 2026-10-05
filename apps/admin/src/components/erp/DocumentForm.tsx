"use client";

import { useState } from "react";
import Link from "next/link";
import { FormError, TextareaField, TextField } from "@/components/form-fields";
import { SearchSelectField } from "@/components/SearchSelect";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useAction } from "@/hooks/use-action";
import type { Action } from "@/lib/actions";
import LineItemsEditor, { type EditorLine } from "./LineItemsEditor";
import QuickAddParty from "./QuickAddParty";

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
  // Omitted when the form sits inside a tab, where there is nothing to go back to.
  cancelUrl?: string;
  submitLabel?: string;
  pendingLabel?: string;
};

export default function DocumentForm({
  kind,
  documentId,
  quoteId,
  parties,
  companyStateCode,
  initial,
  save,
  cancelUrl,
  submitLabel,
  pendingLabel = "Saving…",
}: Props) {
  const [partyId, setPartyId] = useState(initial.partyId);
  const [isGst, setIsGst] = useState(initial.isGstApplicable);
  // Typed by hand per invoice; kept as text so a half-typed value like "12." is not rewritten mid-keystroke.
  const [gstRateInput, setGstRateInput] = useState(initial.gstRate > 0 ? String(initial.gstRate) : "");
  const parsedRate = Number(gstRateInput);
  const gstRate = Number.isFinite(parsedRate) && parsedRate >= 0 && parsedRate <= 100 ? parsedRate : 0;
  const { run, isPending, error } = useAction(save);

  // Clients added from this form are listed at once; the page's own list catches up when it refreshes.
  const [addedParties, setAddedParties] = useState<PartyOption[]>([]);
  const partyOptions = [...parties, ...addedParties.filter((added) => !parties.some((p) => p.id === added.id))];
  const party = partyOptions.find((p) => p.id === partyId);
  const secondDateLabel = kind === "quote" ? "Valid until" : "Due date";
  const secondDateName = kind === "quote" ? "valid_until" : "due_date";

  function onSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    // Creating redirects to the new document from the server; saving an edit returns to where it came from.
    run(new FormData(e.currentTarget)).then((result) => {
      if (result.ok && cancelUrl) window.location.href = cancelUrl;
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {documentId && <input type="hidden" name="id" value={documentId} />}
      {quoteId && <input type="hidden" name="quote_id" value={quoteId} />}

      <Card>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="sm:col-span-2">
              <SearchSelectField
                label="Client"
                name="party_id"
                required
                value={partyId}
                onChange={setPartyId}
                placeholder="Select a client…"
                options={partyOptions.map((option) => ({ value: option.id, label: option.name, detail: option.stateName }))}
                hint={
                  party && !party.stateCode ? (
                    <span className="text-amber-600">
                      This client has no state set, so the tax will be treated as same-state. Add one on their record.
                    </span>
                  ) : undefined
                }
              />
              <QuickAddParty
                kind="client"
                onAdded={(added) => {
                  setAddedParties((list) => [...list, { id: added.id, name: added.name, stateCode: added.stateCode, stateName: added.stateName, gstin: added.gstin }]);
                  setPartyId(added.id);
                }}
              />
            </div>

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

            {isGst ? (
              <Field orientation="horizontal" className="w-auto">
                <FieldLabel htmlFor="gst_rate" className="font-normal">GST %</FieldLabel>
                <Input
                  id="gst_rate"
                  name="gst_rate"
                  inputMode="decimal"
                  required
                  value={gstRateInput}
                  onChange={(e) => setGstRateInput(e.target.value)}
                  placeholder="18"
                  className="h-9 w-24 px-2"
                />
              </Field>
            ) : (
              <p className="text-xs text-muted-foreground">No tax will be charged on this document.</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-matte-black">Line items</CardTitle>
          <CardDescription className="text-xs">
            Type each line by hand. The amount starts as quantity × rate and can be overwritten.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LineItemsEditor
            initialLines={initial.lines}
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
          {isPending ? pendingLabel : (submitLabel ?? (documentId ? "Save Changes" : `Create ${kind === "quote" ? "Quotation" : "Invoice"}`))}
        </Button>
        {cancelUrl && (
          <Button asChild variant="outline">
            <Link href={cancelUrl}>Cancel</Link>
          </Button>
        )}
      </div>
    </form>
  );
}
