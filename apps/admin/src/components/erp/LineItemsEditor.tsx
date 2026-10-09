"use client";

import { useState } from "react";
import { XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOptGroup, NativeSelectOption } from "@/components/ui/native-select";
import { HSN_GROUPS, hsnCodeForKey, hsnKeyForCode } from "@/lib/erp/hsn";
import { formatPaise, previewRupeesToPaise } from "@/lib/erp/money";
import { computeTax } from "@/lib/erp/tax";

export type EditorLine = {
  key: string;
  description: string;
  // Which HSN option is selected; several products share a code, so the option is tracked rather than the code.
  hsnKey: string;
  widthFt: string;
  heightFt: string;
  quantity: string;
  unit: string;
  rate: string;
  amount: string;
  // Once someone types an amount it is theirs; until then it follows quantity times rate.
  amountEdited: boolean;
};

function blankLine(): EditorLine {
  return {
    key: crypto.randomUUID(),
    description: "",
    hsnKey: "",
    widthFt: "",
    heightFt: "",
    quantity: "1",
    unit: "",
    rate: "",
    amount: "",
    amountEdited: false,
  };
}

export function toEditorLines(
  items: {
    description: string;
    hsn_code: string;
    width_ft: number | null;
    height_ft: number | null;
    quantity: number;
    unit: string;
    rate_paise: number;
    amount_paise: number;
  }[]
): EditorLine[] {
  if (items.length === 0) return [blankLine()];

  return items.map((item) => ({
    key: crypto.randomUUID(),
    description: item.description,
    hsnKey: hsnKeyForCode(item.hsn_code),
    widthFt: item.width_ft?.toString() ?? "",
    heightFt: item.height_ft?.toString() ?? "",
    quantity: item.quantity.toString(),
    unit: item.unit,
    rate: (item.rate_paise / 100).toFixed(2),
    amount: (item.amount_paise / 100).toFixed(2),
    // A saved amount is kept exactly, even where it differs from quantity times rate.
    amountEdited: true,
  }));
}

function suggestedAmount(quantity: string, rate: string): string {
  if (!rate.trim()) return "";
  const paise = Math.round((Number(quantity) || 0) * previewRupeesToPaise(rate));
  return (paise / 100).toFixed(2);
}

const TH = "p-3 text-xs font-semibold text-gray-500 uppercase tracking-wider";

export default function LineItemsEditor({
  initialLines,
  companyStateCode,
  partyStateCode,
  isGstApplicable,
  gstRate,
}: {
  initialLines: EditorLine[];
  companyStateCode: string;
  partyStateCode: string;
  isGstApplicable: boolean;
  gstRate: number;
}) {
  // An empty document still needs one row to type into.
  const [lines, setLines] = useState<EditorLine[]>(() => (initialLines.length > 0 ? initialLines : [blankLine()]));

  function update(key: string, patch: Partial<EditorLine>) {
    setLines((current) =>
      current.map((line) => {
        if (line.key !== key) return line;
        const next = { ...line, ...patch };
        // Quantity or rate changing refreshes the amount, unless the amount was typed by hand.
        if (!next.amountEdited && ("quantity" in patch || "rate" in patch)) {
          next.amount = suggestedAmount(next.quantity, next.rate);
        }
        return next;
      })
    );
  }

  function updateAmount(key: string, value: string) {
    setLines((current) =>
      current.map((line) => {
        if (line.key !== key) return line;
        // Clearing the box hands the amount back to quantity times rate.
        if (!value.trim()) return { ...line, amount: suggestedAmount(line.quantity, line.rate), amountEdited: false };
        return { ...line, amount: value, amountEdited: true };
      })
    );
  }

  const amounts = lines.map((line) => previewRupeesToPaise(line.amount));

  const totals = computeTax({
    lineAmountsPaise: amounts,
    isGstApplicable,
    gstRatePercent: gstRate,
    companyStateCode,
    partyStateCode,
  });

  return (
    <div>
      <div className="overflow-x-auto border border-gray-200 rounded-lg bg-white">
        <table className="w-full text-left border-collapse min-w-[1040px]">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className={`${TH} w-[24%]`}>Description</th>
              <th className={`${TH} w-[20%]`}>HSN code</th>
              <th className={TH}>Width ft</th>
              <th className={TH}>Height ft</th>
              <th className={TH}>Qty</th>
              <th className={TH}>Unit</th>
              <th className={TH}>Rate</th>
              <th className={TH}>Amount</th>
              <th className="p-3 w-10" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {lines.map((line, index) => (
              <tr key={line.key} className="align-top">
                <td className="p-2">
                  <Input
                    name={`items[${index}][description]`}
                    value={line.description}
                    onChange={(e) => update(line.key, { description: e.target.value })}
                    placeholder="Description"
                    className="h-9 px-2"
                    aria-label={`Description for line ${index + 1}`}
                  />
                </td>
                <td className="p-2">
                  <NativeSelect
                    value={line.hsnKey}
                    onChange={(e) => update(line.key, { hsnKey: e.target.value })}
                    className="[&_select]:h-9"
                    aria-label={`HSN code for line ${index + 1}`}
                  >
                    <NativeSelectOption value="">No HSN code</NativeSelectOption>
                    {HSN_GROUPS.map((group) => (
                      <NativeSelectOptGroup key={group.label} label={group.label}>
                        {group.options.map((option) => (
                          <NativeSelectOption key={option.key} value={option.key}>
                            {option.code} — {option.product}
                          </NativeSelectOption>
                        ))}
                      </NativeSelectOptGroup>
                    ))}
                  </NativeSelect>
                  {/* The select tracks which product was picked; only its code is submitted. */}
                  <input type="hidden" name={`items[${index}][hsn_code]`} value={hsnCodeForKey(line.hsnKey)} />
                </td>
                <td className="p-2">
                  <Input
                    name={`items[${index}][width_ft]`}
                    value={line.widthFt}
                    onChange={(e) => update(line.key, { widthFt: e.target.value })}
                    inputMode="decimal"
                    className="h-9 w-20 px-2"
                    aria-label={`Width for line ${index + 1}`}
                  />
                </td>
                <td className="p-2">
                  <Input
                    name={`items[${index}][height_ft]`}
                    value={line.heightFt}
                    onChange={(e) => update(line.key, { heightFt: e.target.value })}
                    inputMode="decimal"
                    className="h-9 w-20 px-2"
                    aria-label={`Height for line ${index + 1}`}
                  />
                </td>
                <td className="p-2">
                  <Input
                    name={`items[${index}][quantity]`}
                    value={line.quantity}
                    onChange={(e) => update(line.key, { quantity: e.target.value })}
                    inputMode="decimal"
                    className="h-9 w-20 px-2"
                    aria-label={`Quantity for line ${index + 1}`}
                  />
                </td>
                <td className="p-2">
                  <Input
                    name={`items[${index}][unit]`}
                    value={line.unit}
                    onChange={(e) => update(line.key, { unit: e.target.value })}
                    placeholder="nos"
                    className="h-9 w-20 px-2"
                    aria-label={`Unit for line ${index + 1}`}
                  />
                </td>
                <td className="p-2">
                  <Input
                    name={`items[${index}][rate]`}
                    value={line.rate}
                    onChange={(e) => update(line.key, { rate: e.target.value })}
                    inputMode="decimal"
                    placeholder="0.00"
                    className="h-9 w-28 px-2"
                    aria-label={`Rate for line ${index + 1}`}
                  />
                </td>
                <td className="p-2">
                  <Input
                    name={`items[${index}][amount]`}
                    value={line.amount}
                    onChange={(e) => updateAmount(line.key, e.target.value)}
                    inputMode="decimal"
                    placeholder="0.00"
                    className="h-9 w-32 px-2 text-right"
                    aria-label={`Amount for line ${index + 1}`}
                  />
                </td>
                <td className="p-2 pt-3">
                  {lines.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setLines((current) => current.filter((l) => l.key !== line.key))}
                      aria-label={`Remove line ${index + 1}`}
                      className="text-gray-500 hover:text-destructive"
                    >
                      <XIcon />
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Button
        type="button"
        variant="outline"
        size="lg"
        onClick={() => setLines((current) => [...current, blankLine()])}
        className="mt-3"
      >
        + Add Line
      </Button>

      <div className="mt-6 ml-auto max-w-sm space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Subtotal</span>
          <span className="text-gray-900">{formatPaise(totals.subtotalPaise)}</span>
        </div>

        {isGstApplicable && totals.isInterState && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">IGST @ {gstRate}%</span>
            <span className="text-gray-900">{formatPaise(totals.igstPaise)}</span>
          </div>
        )}

        {isGstApplicable && !totals.isInterState && (
          <>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">CGST @ {gstRate / 2}%</span>
              <span className="text-gray-900">{formatPaise(totals.cgstPaise)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">SGST @ {gstRate / 2}%</span>
              <span className="text-gray-900">{formatPaise(totals.sgstPaise)}</span>
            </div>
          </>
        )}

        {totals.roundingPaise !== 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Rounding</span>
            <span className="text-gray-500">{formatPaise(totals.roundingPaise)}</span>
          </div>
        )}

        <div className="flex justify-between pt-2 mt-2 border-t border-gray-300">
          <span className="font-bold uppercase text-sm tracking-wide text-gray-900">Total</span>
          <span className="font-bold text-lg text-gray-900">{formatPaise(totals.totalPaise)}</span>
        </div>

        {isGstApplicable && (
          <p className="text-xs text-gray-500 pt-1">
            {totals.isInterState
              ? "Inter-state supply, so IGST applies."
              : "Same-state supply, so CGST and SGST apply."}
          </p>
        )}
      </div>
    </div>
  );
}
