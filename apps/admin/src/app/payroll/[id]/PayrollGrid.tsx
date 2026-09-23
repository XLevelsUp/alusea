"use client";

import { useState } from "react";
import { FormError, TextareaField } from "@/components/form-fields";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useAction } from "@/hooks/use-action";
import type { Action } from "@/lib/actions";
import { formatPaise, previewRupeesToPaise } from "@/lib/erp/money";
import { computePayslip } from "@/lib/erp/payroll";
import type { WorkerType } from "@/lib/supabase/types";

export type GridRow = {
  id: string;
  employeeId: string;
  code: string;
  name: string;
  designation: string;
  workerType: WorkerType;
  daysWorked: string;
  amount: string;
  overtime: string;
  bonus: string;
  storedDefaultPaise: number;
};

export default function PayrollGrid({
  runId,
  daysInPeriod,
  initialRows,
  notes,
  save,
}: {
  runId: string;
  daysInPeriod: number;
  initialRows: GridRow[];
  notes: string;
  save: Action;
}) {
  const [rows, setRows] = useState<GridRow[]>(initialRows);
  const { run, isPending, error } = useAction(save);
  const [saved, setSaved] = useState(false);

  function update(id: string, patch: Partial<GridRow>) {
    setSaved(false);
    setRows((current) => current.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  }

  const computed = rows.map((row) =>
    computePayslip({
      workerType: row.workerType,
      enteredAmountPaise: previewRupeesToPaise(row.amount),
      daysWorked: Number(row.daysWorked) || 0,
      daysInPeriod,
      overtimePaise: previewRupeesToPaise(row.overtime),
      bonusPaise: previewRupeesToPaise(row.bonus),
    })
  );

  const runTotal = computed.reduce((sum, slip) => sum + slip.netPaise, 0);
  const paidCount = computed.filter((slip) => slip.netPaise > 0).length;

  function onSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaved(false);
    run(new FormData(e.currentTarget)).then((result) => {
      if (result.ok) setSaved(true);
    });
  }

  return (
    <form onSubmit={onSubmit}>
      <input type="hidden" name="run_id" value={runId} />

      <Card className="gap-0 py-0 mb-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="p-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Employee</th>
                <th className="p-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Days</th>
                <th className="p-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Salary / Rate</th>
                <th className="p-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Overtime</th>
                <th className="p-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Bonus</th>
                <th className="p-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Net pay</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((row, index) => {
                const slip = computed[index];
                const amountChanged = previewRupeesToPaise(row.amount) !== row.storedDefaultPaise;

                return (
                  <tr key={row.id} className="align-top hover:bg-gray-50/30">
                    <td className="p-3">
                      <span className="font-semibold text-gray-900 text-sm block">{row.name}</span>
                      <span className="text-xs text-gray-500 font-mono">{row.code}</span>
                      <span
                        className={`block mt-1 text-[10px] font-bold uppercase tracking-wider ${
                          row.workerType === "monthly" ? "text-blue-600" : "text-amber-600"
                        }`}
                      >
                        {row.workerType === "monthly" ? "Monthly" : "Daily"}
                      </span>
                    </td>

                    <td className="p-3">
                      <Input
                        name={`days[${row.id}]`}
                        value={row.daysWorked}
                        onChange={(e) => update(row.id, { daysWorked: e.target.value })}
                        inputMode="decimal"
                        aria-label={`Days worked by ${row.name}`}
                        className="h-9 w-20 px-2"
                      />
                      <span className="block text-[10px] text-gray-400 mt-1">of {daysInPeriod}</span>
                    </td>

                    <td className="p-3">
                      {/* The column is labelled per row, so a daily rate is never mistaken for a monthly salary. */}
                      <Input
                        name={`amount[${row.id}]`}
                        value={row.amount}
                        onChange={(e) => update(row.id, { amount: e.target.value })}
                        inputMode="decimal"
                        aria-label={`${row.workerType === "monthly" ? "Monthly salary" : "Daily rate"} for ${row.name}`}
                        className="h-9 w-28 px-2"
                      />
                      <span className="block text-[10px] text-gray-400 mt-1">
                        {row.workerType === "monthly" ? "per month" : "per day"}
                      </span>
                      {amountChanged && (
                        <Field orientation="horizontal" className="mt-1.5 gap-1.5">
                          <Checkbox id={`update_default_${row.id}`} name={`update_default[${row.id}]`} className="size-3" />
                          <FieldLabel htmlFor={`update_default_${row.id}`} className="text-[10px] font-normal text-gray-600">
                            Update their default
                          </FieldLabel>
                        </Field>
                      )}
                    </td>

                    <td className="p-3">
                      <Input
                        name={`overtime[${row.id}]`}
                        value={row.overtime}
                        onChange={(e) => update(row.id, { overtime: e.target.value })}
                        inputMode="decimal"
                        placeholder="0"
                        aria-label={`Overtime for ${row.name}`}
                        className="h-9 w-24 px-2"
                      />
                    </td>

                    <td className="p-3">
                      <Input
                        name={`bonus[${row.id}]`}
                        value={row.bonus}
                        onChange={(e) => update(row.id, { bonus: e.target.value })}
                        inputMode="decimal"
                        placeholder="0"
                        aria-label={`Bonus for ${row.name}`}
                        className="h-9 w-24 px-2"
                      />
                    </td>

                    <td className="p-3 text-right">
                      <span className="font-semibold text-gray-900 text-sm">{formatPaise(slip.netPaise)}</span>
                      <span className="block text-[10px] text-gray-400 mt-1">{slip.baseExplanation}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="p-5 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-sm text-gray-600">
            {paidCount} of {rows.length} employees have days entered
          </p>
          <div className="text-right">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Run total</p>
            <p className="text-2xl font-bold text-matte-black">{formatPaise(runTotal)}</p>
          </div>
        </div>
      </Card>

      <Card className="mb-6">
        <CardContent>
          <TextareaField label="Notes for this run" name="notes" rows={2} defaultValue={notes} />
        </CardContent>
      </Card>

      <FormError error={error} className="mb-4" />
      {saved && !error && (
        <Alert className="mb-4 border-green-100 bg-green-50 text-green-700">
          <AlertDescription className="text-green-700">
            Saved. Review the total, then approve the run when it looks right.
          </AlertDescription>
        </Alert>
      )}

      <Button type="submit" variant="brand" disabled={isPending}>
        {isPending ? "Saving…" : "Save Payroll"}
      </Button>
    </form>
  );
}
