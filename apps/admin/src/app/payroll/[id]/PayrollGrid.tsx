"use client";

import { useState, useTransition } from "react";
import { formatPaise, parseRupeesToPaise } from "@/lib/erp/money";
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
  save: (formData: FormData) => Promise<void>;
}) {
  const [rows, setRows] = useState<GridRow[]>(initialRows);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function update(id: string, patch: Partial<GridRow>) {
    setSaved(false);
    setRows((current) => current.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  }

  const computed = rows.map((row) =>
    computePayslip({
      workerType: row.workerType,
      enteredAmountPaise: parseRupeesToPaise(row.amount),
      daysWorked: Number(row.daysWorked) || 0,
      daysInPeriod,
      overtimePaise: parseRupeesToPaise(row.overtime),
      bonusPaise: parseRupeesToPaise(row.bonus),
    })
  );

  const runTotal = computed.reduce((sum, slip) => sum + slip.netPaise, 0);
  const paidCount = computed.filter((slip) => slip.netPaise > 0).length;

  function onSubmit(formData: FormData) {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      try {
        await save(formData);
        setSaved(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not save");
      }
    });
  }

  return (
    <form action={onSubmit}>
      <input type="hidden" name="run_id" value={runId} />

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
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
                const amountChanged = parseRupeesToPaise(row.amount) !== row.storedDefaultPaise;

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
                      <input
                        name={`days[${row.id}]`}
                        value={row.daysWorked}
                        onChange={(e) => update(row.id, { daysWorked: e.target.value })}
                        inputMode="decimal"
                        aria-label={`Days worked by ${row.name}`}
                        className="w-20 rounded px-2 py-1.5 bg-gray-50 border border-gray-200 text-sm text-black"
                      />
                      <span className="block text-[10px] text-gray-400 mt-1">of {daysInPeriod}</span>
                    </td>

                    <td className="p-3">
                      {/* The column is labelled per row, so a daily rate is never mistaken for a monthly salary. */}
                      <input
                        name={`amount[${row.id}]`}
                        value={row.amount}
                        onChange={(e) => update(row.id, { amount: e.target.value })}
                        inputMode="decimal"
                        aria-label={`${row.workerType === "monthly" ? "Monthly salary" : "Daily rate"} for ${row.name}`}
                        className="w-28 rounded px-2 py-1.5 bg-gray-50 border border-gray-200 text-sm text-black"
                      />
                      <span className="block text-[10px] text-gray-400 mt-1">
                        {row.workerType === "monthly" ? "per month" : "per day"}
                      </span>
                      {amountChanged && (
                        <label className="flex items-center gap-1.5 mt-1.5 text-[10px] text-gray-600 cursor-pointer">
                          <input
                            type="checkbox"
                            name={`update_default[${row.id}]`}
                            className="w-3 h-3 accent-[#A67C52]"
                          />
                          Update their default
                        </label>
                      )}
                    </td>

                    <td className="p-3">
                      <input
                        name={`overtime[${row.id}]`}
                        value={row.overtime}
                        onChange={(e) => update(row.id, { overtime: e.target.value })}
                        inputMode="decimal"
                        placeholder="0"
                        aria-label={`Overtime for ${row.name}`}
                        className="w-24 rounded px-2 py-1.5 bg-gray-50 border border-gray-200 text-sm text-black"
                      />
                    </td>

                    <td className="p-3">
                      <input
                        name={`bonus[${row.id}]`}
                        value={row.bonus}
                        onChange={(e) => update(row.id, { bonus: e.target.value })}
                        inputMode="decimal"
                        placeholder="0"
                        aria-label={`Bonus for ${row.name}`}
                        className="w-24 rounded px-2 py-1.5 bg-gray-50 border border-gray-200 text-sm text-black"
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
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="notes">
          Notes for this run
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={2}
          defaultValue={notes}
          className="rounded-md px-4 py-2 bg-gray-50 border border-gray-200 w-full text-black"
        />
      </div>

      {error && <p className="mb-4 p-4 bg-red-50 text-red-600 text-sm rounded-md border border-red-100">{error}</p>}
      {saved && !error && (
        <p className="mb-4 p-4 bg-green-50 text-green-700 text-sm rounded-md border border-green-100">
          Saved. Review the total, then approve the run when it looks right.
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="px-6 py-3 bg-[#A67C52] text-white text-xs font-bold uppercase tracking-wider rounded-sm hover:bg-[#8e6944] transition-colors shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? "Saving…" : "Save Payroll"}
      </button>
    </form>
  );
}
