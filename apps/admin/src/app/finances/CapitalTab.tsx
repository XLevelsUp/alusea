"use client";

import { PlusIcon } from "lucide-react";
import DeleteButton from "@/components/DeleteButton";
import { FormDialog } from "@/components/FormDialog";
import { Button } from "@/components/ui/button";
import { CAPITAL_KINDS } from "@/lib/erp/finance";
import { formatPaise } from "@/lib/erp/money";
import { deleteCapitalInflow } from "./actions";
import { CapitalForm } from "./LedgerForms";
import { Empty, Section, TH, Tile, formatDate } from "./parts";
import type { CapitalRow } from "./types";

const kindLabel = (value: string) => CAPITAL_KINDS.find((kind) => kind.value === value)?.label ?? value;

export default function CapitalTab({ capital, canEdit }: { capital: CapitalRow[]; canEdit: boolean }) {
  const total = capital.reduce((sum, row) => sum + row.amount_paise, 0);
  const byKind = CAPITAL_KINDS.map((kind) => ({
    ...kind,
    paise: capital.filter((row) => row.kind === kind.value).reduce((sum, row) => sum + row.amount_paise, 0),
  })).filter((kind) => kind.paise > 0);

  return (
    <div>
      {canEdit && (
        <div className="flex justify-end mb-4">
          <FormDialog
            title="Record capital"
            description="Money put into the business: owner capital, a loan or an investment."
            trigger={
              <Button type="button" variant="brand">
                <PlusIcon aria-hidden="true" />
                Record Capital
              </Button>
            }
          >
            <CapitalForm />
          </FormDialog>
        </div>
      )}

      <section aria-label="Capital totals" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Tile label="Total capital in" paise={total} tone="good" note={`${capital.length} entries, all time`} />
        {byKind.map((kind) => (
          <Tile key={kind.value} label={kind.label} paise={kind.paise} />
        ))}
      </section>

      <Section title="Capital inflow" description="Every amount put into the business. Each one also appears in the general ledger as money in.">
        {capital.length === 0 ? (
          <Empty>No capital has been recorded yet.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className={TH}>Date</th>
                  <th className={TH}>From</th>
                  <th className={TH}>Type</th>
                  <th className={`${TH} text-right`}>Amount</th>
                  {canEdit && <th className={`${TH} text-right`}>Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {capital.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-4 text-sm text-gray-600 whitespace-nowrap">{formatDate(row.received_on)}</td>
                    <td className="p-4">
                      <span className="text-sm font-medium text-gray-900">{row.source}</span>
                      {row.notes && <span className="block text-xs text-gray-500">{row.notes}</span>}
                    </td>
                    <td className="p-4 text-sm text-gray-600">{kindLabel(row.kind)}</td>
                    <td className="p-4 text-sm text-right font-semibold text-green-700">{formatPaise(row.amount_paise)}</td>
                    {canEdit && (
                      <td className="p-4">
                        <div className="flex items-start justify-end gap-2">
                          <FormDialog title="Edit capital" trigger={<Button type="button" size="sm" variant="outline">Edit</Button>}>
                            <CapitalForm initialData={row} />
                          </FormDialog>
                          <DeleteButton id={row.id} itemLabel="capital entry" name={`${row.source} — ${formatPaise(row.amount_paise)}`} deleteAction={deleteCapitalInflow} />
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </div>
  );
}
