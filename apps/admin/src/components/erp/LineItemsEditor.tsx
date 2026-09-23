"use client";

import { useState } from "react";
import { XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { formatPaise, previewRupeesToPaise } from "@/lib/erp/money";
import { areaSqFt, lineAmountPaise, computeTax } from "@/lib/erp/tax";

export type EditorLine = {
  key: string;
  description: string;
  widthFt: string;
  heightFt: string;
  quantity: string;
  unit: string;
  rate: string;
  productId: string;
};

export type ProductOption = {
  id: string;
  name: string;
  pricePerSqft: number;
};

function blankLine(): EditorLine {
  return {
    key: crypto.randomUUID(),
    description: "",
    widthFt: "",
    heightFt: "",
    quantity: "1",
    unit: "sq ft",
    rate: "",
    productId: "",
  };
}

export function toEditorLines(
  items: {
    description: string;
    width_ft: number | null;
    height_ft: number | null;
    quantity: number;
    unit: string;
    rate_paise: number;
    product_id: string | null;
  }[]
): EditorLine[] {
  if (items.length === 0) return [blankLine()];

  return items.map((item) => ({
    key: crypto.randomUUID(),
    description: item.description,
    widthFt: item.width_ft?.toString() ?? "",
    heightFt: item.height_ft?.toString() ?? "",
    quantity: item.quantity.toString(),
    unit: item.unit,
    rate: (item.rate_paise / 100).toFixed(2),
    productId: item.product_id ?? "",
  }));
}

// Width times height gives the quantity when both are present; otherwise the typed quantity stands. Mirrors parseLineItems on the server, which is what the totals are actually computed from.
function effectiveQuantity(line: EditorLine): number {
  const width = Number(line.widthFt);
  const height = Number(line.heightFt);

  if (line.widthFt && line.heightFt && width > 0 && height > 0) {
    return areaSqFt(width, height);
  }

  const quantity = Number(line.quantity);
  return Number.isFinite(quantity) ? quantity : 0;
}

export default function LineItemsEditor({
  initialLines,
  products,
  companyStateCode,
  partyStateCode,
  isGstApplicable,
  gstRate,
}: {
  initialLines: EditorLine[];
  products: ProductOption[];
  companyStateCode: string;
  partyStateCode: string;
  isGstApplicable: boolean;
  gstRate: number;
}) {
  // An empty document still needs one row to type into.
  const [lines, setLines] = useState<EditorLine[]>(() => (initialLines.length > 0 ? initialLines : [blankLine()]));

  function update(key: string, patch: Partial<EditorLine>) {
    setLines((current) => current.map((line) => (line.key === key ? { ...line, ...patch } : line)));
  }

  function applyProduct(key: string, productId: string) {
    const product = products.find((p) => p.id === productId);
    if (!product) {
      update(key, { productId: "" });
      return;
    }
    update(key, {
      productId,
      description: product.name,
      rate: product.pricePerSqft.toFixed(2),
      unit: "sq ft",
    });
  }

  const amounts = lines.map((line) => lineAmountPaise(effectiveQuantity(line), previewRupeesToPaise(line.rate)));

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
        <table className="w-full text-left border-collapse min-w-[860px]">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="p-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-[28%]">Description</th>
              <th className="p-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Width ft</th>
              <th className="p-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Height ft</th>
              <th className="p-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Qty</th>
              <th className="p-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Unit</th>
              <th className="p-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Rate</th>
              <th className="p-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Amount</th>
              <th className="p-3 w-10" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {lines.map((line, index) => {
              const quantity = effectiveQuantity(line);
              const derived = !!(line.widthFt && line.heightFt);

              return (
                <tr key={line.key} className="align-top">
                  <td className="p-2">
                    {products.length > 0 && (
                      <NativeSelect
                        size="sm"
                        value={line.productId}
                        onChange={(e) => applyProduct(line.key, e.target.value)}
                        className="mb-1 [&_select]:text-xs [&_select]:text-muted-foreground"
                        aria-label={`Product for line ${index + 1}`}
                      >
                        <NativeSelectOption value="">Pick from catalogue…</NativeSelectOption>
                        {products.map((product) => (
                          <NativeSelectOption key={product.id} value={product.id}>
                            {product.name}
                          </NativeSelectOption>
                        ))}
                      </NativeSelect>
                    )}
                    <Input
                      name={`items[${index}][description]`}
                      value={line.description}
                      onChange={(e) => update(line.key, { description: e.target.value })}
                      placeholder="Description"
                      className="h-9 px-2"
                      aria-label={`Description for line ${index + 1}`}
                    />
                    <input type="hidden" name={`items[${index}][product_id]`} value={line.productId} />
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
                      value={derived ? quantity.toString() : line.quantity}
                      onChange={(e) => update(line.key, { quantity: e.target.value })}
                      readOnly={derived}
                      inputMode="decimal"
                      title={derived ? "Calculated from width x height" : undefined}
                      className={`h-9 w-20 px-2 ${derived ? "bg-gray-100 text-muted-foreground" : ""}`}
                      aria-label={`Quantity for line ${index + 1}`}
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      name={`items[${index}][unit]`}
                      value={line.unit}
                      onChange={(e) => update(line.key, { unit: e.target.value })}
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
                  <td className="p-2 text-right text-sm font-medium text-gray-900 whitespace-nowrap pt-4">
                    {formatPaise(amounts[index])}
                  </td>
                  <td className="p-2 pt-4">
                    {lines.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setLines((current) => current.filter((l) => l.key !== line.key))}
                        aria-label={`Remove line ${index + 1}`}
                        className="text-gray-400 hover:text-destructive"
                      >
                        <XIcon />
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
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
            <span className="text-gray-400">Rounding</span>
            <span className="text-gray-400">{formatPaise(totals.roundingPaise)}</span>
          </div>
        )}

        <div className="flex justify-between pt-2 mt-2 border-t border-gray-300">
          <span className="font-bold uppercase text-sm tracking-wide text-gray-900">Total</span>
          <span className="font-bold text-lg text-gray-900">{formatPaise(totals.totalPaise)}</span>
        </div>

        {isGstApplicable && (
          <p className="text-xs text-gray-400 pt-1">
            {totals.isInterState
              ? "Inter-state supply, so IGST applies."
              : "Same-state supply, so CGST and SGST apply."}
          </p>
        )}
      </div>
    </div>
  );
}
