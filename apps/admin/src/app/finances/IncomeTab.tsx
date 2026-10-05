"use client";

import { useMemo } from "react";
import Link from "next/link";
import { inRange } from "@/lib/erp/finance";
import { formatPaise } from "@/lib/erp/money";
import { Empty, Section, TH, Tile, formatDate } from "./parts";
import type { InvoiceRow, LedgerRow, PartyOption } from "./types";

type Range = { from: string | null; to: string | null };

type ClientIncome = { id: string; name: string; billed: number; collected: number; outstanding: number; lastInvoice: string | null };

export default function IncomeTab({
  ledger,
  invoices,
  clients,
  range,
}: {
  ledger: LedgerRow[];
  invoices: InvoiceRow[];
  clients: PartyOption[];
  range: Range;
}) {
  // Billed counts invoices issued in the period; collected counts payments received in it; outstanding is today's unpaid balance.
  const rows = useMemo(() => {
    const byClient = new Map<string, ClientIncome>(
      clients.map((client) => [client.id, { id: client.id, name: client.name, billed: 0, collected: 0, outstanding: 0, lastInvoice: null }])
    );

    for (const invoice of invoices) {
      const row = byClient.get(invoice.partyId);
      if (!row) continue;
      row.outstanding += invoice.balance_paise;
      if (!row.lastInvoice || invoice.issue_date > row.lastInvoice) row.lastInvoice = invoice.issue_date;
      if (inRange(invoice.issue_date, range)) row.billed += invoice.total_paise;
    }

    for (const entry of ledger) {
      if (entry.source !== "invoice_payment" || !entry.partyId || !inRange(entry.entry_date, range)) continue;
      const row = byClient.get(entry.partyId);
      if (row) row.collected += entry.amount_paise;
    }

    return [...byClient.values()]
      .filter((row) => row.billed > 0 || row.collected > 0 || row.outstanding > 0)
      .sort((a, b) => b.billed - a.billed || b.collected - a.collected);
  }, [clients, invoices, ledger, range]);

  const billed = rows.reduce((total, row) => total + row.billed, 0);
  const collected = rows.reduce((total, row) => total + row.collected, 0);
  const outstanding = rows.reduce((total, row) => total + row.outstanding, 0);

  return (
    <div>
      <section aria-label="Client income totals" className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Tile label="Billed" paise={billed} note="Invoices issued in the period" />
        <Tile label="Collected" paise={collected} tone="good" note="Payments received in the period" />
        <Tile label="Still owed" paise={outstanding} tone={outstanding > 0 ? "warn" : undefined} note="Unpaid balance as of today" />
      </section>

      <Section title="Income by client" description="Each client's billing and payments. Open a name for their full history.">
        {rows.length === 0 ? (
          <Empty>No client was billed or paid anything in this period.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className={TH}>Client</th>
                  <th className={`${TH} text-right`}>Billed</th>
                  <th className={`${TH} text-right`}>Collected</th>
                  <th className={`${TH} text-right`}>Still owed</th>
                  <th className={TH}>Last invoice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-4">
                      <Link href={`/parties/${row.id}`} className="text-sm font-medium text-gray-900 hover:text-[#A67C52]">
                        {row.name}
                      </Link>
                    </td>
                    <td className="p-4 text-sm text-right font-semibold text-gray-900">{formatPaise(row.billed)}</td>
                    <td className="p-4 text-sm text-right text-green-700">{formatPaise(row.collected)}</td>
                    <td className={`p-4 text-sm text-right ${row.outstanding > 0 ? "text-amber-700 font-semibold" : "text-gray-600"}`}>
                      {formatPaise(row.outstanding)}
                    </td>
                    <td className="p-4 text-sm text-gray-600">{row.lastInvoice ? formatDate(row.lastInvoice) : "—"}</td>
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
