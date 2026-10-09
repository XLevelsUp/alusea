"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { DownloadIcon, EyeIcon } from "lucide-react";
import Pagination from "@/components/Pagination";
import SortHeader, { type SortDirection } from "@/components/SortHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { usePaged } from "@/hooks/use-paged";
import { useUrlState } from "@/hooks/use-url-state";
import { INVOICE_STATUS, type InvoiceDisplayStatus } from "@/lib/erp/invoices";
import { formatPaise } from "@/lib/erp/money";

export type HistoryRow = {
  id: string;
  number: string | null;
  clientId: string;
  clientName: string;
  issueDate: string;
  dueDate: string | null;
  status: InvoiceDisplayStatus;
  totalPaise: number;
  balancePaise: number;
  hasPdf: boolean;
  withGst: boolean;
};

const STATUS_FILTERS: { key: string; label: string }[] = [
  { key: "all", label: "All statuses" },
  { key: "unpaid", label: "Unpaid" },
  { key: "part_paid", label: "Part paid" },
  { key: "paid", label: "Paid" },
  { key: "cancelled", label: "Cancelled" },
  { key: "draft", label: "Draft" },
];

const TAX_FILTERS: { key: string; label: string }[] = [
  { key: "all", label: "With and without GST" },
  { key: "gst", label: "With GST" },
  { key: "no-gst", label: "Without GST" },
];

const TH = "p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider";

type SortKey = "number" | "client" | "date" | "total" | "balance";

// Text columns start A to Z; dates and amounts start with the newest or largest, which is what people look for first.
const FIRST_DIRECTION: Record<SortKey, SortDirection> = { number: "asc", client: "asc", date: "desc", total: "desc", balance: "desc" };

function compare(a: HistoryRow, b: HistoryRow, key: SortKey): number {
  switch (key) {
    case "number":
      return (a.number ?? "").localeCompare(b.number ?? "", "en-IN", { numeric: true });
    case "client":
      return a.clientName.localeCompare(b.clientName, "en-IN");
    case "total":
      return a.totalPaise - b.totalPaise;
    case "balance":
      return a.balancePaise - b.balancePaise;
    default:
      return a.issueDate.localeCompare(b.issueDate);
  }
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

// Filters run in the browser over rows the page already loaded, so changing the month or status is instant.
export default function InvoiceHistory({ rows, initialStatus = "all" }: { rows: HistoryRow[]; initialStatus?: string }) {
  // All four live in the address, so opening an invoice and pressing Back returns to the same filtered list.
  const [month, setMonth] = useUrlState<string>("month", "");
  const [status, setStatus] = useUrlState<string>("filter", STATUS_FILTERS.some((filter) => filter.key === initialStatus) ? initialStatus : "all", {
    allowed: STATUS_FILTERS.map((filter) => filter.key),
    always: true,
  });
  const [tax, setTax] = useUrlState<string>("tax", "all", { allowed: TAX_FILTERS.map((filter) => filter.key) });
  const [query, setQuery] = useUrlState<string>("q", "");

  const [sort, setSort] = useState<{ key: SortKey; direction: SortDirection }>({ key: "date", direction: "desc" });
  // Clicking the sorted column flips it; clicking another starts that column in its natural direction.
  const sortBy = (key: SortKey) =>
    setSort((current) => (current.key === key ? { key, direction: current.direction === "asc" ? "desc" : "asc" } : { key, direction: FIRST_DIRECTION[key] }));
  const directionOf = (key: SortKey) => (sort.key === key ? sort.direction : null);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const matching = rows.filter((row) => {
      if (month && !row.issueDate.startsWith(month)) return false;
      if (status !== "all" && row.status !== status) return false;
      if (tax === "gst" && !row.withGst) return false;
      if (tax === "no-gst" && row.withGst) return false;
      if (needle && !row.clientName.toLowerCase().includes(needle) && !(row.number ?? "").toLowerCase().includes(needle)) return false;
      return true;
    });
    return matching.sort((a, b) => (sort.direction === "asc" ? compare(a, b, sort.key) : compare(b, a, sort.key)));
  }, [rows, month, status, tax, query, sort]);

  // Totals cover everything that matches; only the table is cut into pages, and any filter change returns to page 1.
  const paged = usePaged(visible, [month, status, tax, query, sort.key, sort.direction].join("|"));

  // Money still owed excludes drafts and cancelled invoices, since neither is a debt.
  const billable = visible.filter((row) => row.status !== "draft" && row.status !== "cancelled");
  const billed = billable.reduce((total, row) => total + row.totalPaise, 0);
  const outstanding = billable.reduce((total, row) => total + row.balancePaise, 0);

  return (
    <div>
      <Card className="mb-6">
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
          <Field>
            <FieldLabel htmlFor="history-month">Month</FieldLabel>
            <div className="flex gap-2">
              <Input id="history-month" type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
              {month && (
                <Button type="button" size="lg" variant="outline" onClick={() => setMonth("")}>
                  All
                </Button>
              )}
            </div>
          </Field>
          <Field>
            <FieldLabel htmlFor="history-status">Status</FieldLabel>
            <NativeSelect id="history-status" value={status} onChange={(e) => setStatus(e.target.value)}>
              {STATUS_FILTERS.map((filter) => (
                <NativeSelectOption key={filter.key} value={filter.key}>
                  {filter.label}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </Field>
          <Field>
            <FieldLabel htmlFor="history-tax">Tax</FieldLabel>
            <NativeSelect id="history-tax" value={tax} onChange={(e) => setTax(e.target.value)}>
              {TAX_FILTERS.map((filter) => (
                <NativeSelectOption key={filter.key} value={filter.key}>
                  {filter.label}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </Field>
          <Field>
            <FieldLabel htmlFor="history-search">Search</FieldLabel>
            <Input
              id="history-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Client or invoice number…"
            />
          </Field>
        </CardContent>
      </Card>

      <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: "Invoices", value: String(visible.length) },
          { label: "Billed", value: formatPaise(billed) },
          { label: "Outstanding", value: formatPaise(outstanding) },
        ].map((figure) => (
          <Card key={figure.label}>
            <CardContent>
              <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{figure.label}</dt>
              <dd className="mt-2 text-2xl font-bold text-matte-black">{figure.value}</dd>
            </CardContent>
          </Card>
        ))}
      </dl>

      <Card className="gap-0 py-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <SortHeader label="Number" className={TH} direction={directionOf("number")} onSort={() => sortBy("number")} />
                <SortHeader label="Client" className={TH} direction={directionOf("client")} onSort={() => sortBy("client")} />
                <SortHeader label="Date" className={`${TH} hidden md:table-cell`} direction={directionOf("date")} onSort={() => sortBy("date")} />
                <th className={TH}>Status</th>
                <SortHeader label="Total" align="right" className={TH} direction={directionOf("total")} onSort={() => sortBy("total")} />
                <SortHeader label="Balance" align="right" className={`${TH} hidden md:table-cell`} direction={directionOf("balance")} onSort={() => sortBy("balance")} />
                <th className={`${TH} text-right`}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paged.pageRows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-4">
                    <Link href={`/invoices/${row.id}`} className="font-mono text-xs font-semibold text-[#A67C52] hover:underline">
                      {row.number ?? "Draft"}
                    </Link>
                    <span className="block text-[11px] uppercase tracking-wider text-gray-500 mt-1">
                      {row.withGst ? "With GST" : "Without GST"}
                    </span>
                    {/* The Date column is hidden on a phone, so the date is shown here instead. */}
                    <span className="block text-xs text-gray-500 mt-1 md:hidden">{formatDate(row.issueDate)}</span>
                  </td>
                  <td className="p-4 text-sm text-gray-900">
                    <Link href={`/parties/${row.clientId}`} className="hover:text-[#A67C52]">
                      {row.clientName}
                    </Link>
                  </td>
                  <td className="p-4 text-sm text-gray-600 whitespace-nowrap hidden md:table-cell">
                    {formatDate(row.issueDate)}
                    {row.dueDate && <span className="block text-xs text-gray-500">Due {formatDate(row.dueDate)}</span>}
                  </td>
                  <td className="p-4">
                    <span className={`inline-block px-2 py-1 rounded text-[11px] font-bold uppercase tracking-wider ${INVOICE_STATUS[row.status].style}`}>
                      {INVOICE_STATUS[row.status].label}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-gray-900 text-right">
                    {formatPaise(row.totalPaise)}
                    {/* The Balance column is hidden on a phone, so what is still due is shown here instead. */}
                    {row.status !== "cancelled" && row.status !== "draft" && row.balancePaise > 0 && (
                      <span className="block text-xs text-amber-700 md:hidden">{formatPaise(row.balancePaise)} due</span>
                    )}
                  </td>
                  <td className="p-4 text-sm text-right font-semibold hidden md:table-cell">
                    {row.status === "cancelled" || row.status === "draft" ? "—" : formatPaise(row.balancePaise)}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-2">
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/invoices/${row.id}`}>
                          <EyeIcon aria-hidden="true" />
                          View
                        </Link>
                      </Button>
                      {row.hasPdf && (
                        <Button asChild size="sm" variant="outline">
                          <a href={`/invoices/${row.id}/pdf`} target="_blank" rel="noopener noreferrer">
                            <DownloadIcon aria-hidden="true" />
                            PDF
                          </a>
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {visible.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500">
                    {rows.length === 0 ? "No invoices yet." : "No invoices match these filters."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination page={paged.page} total={paged.total} noun="invoices" onPage={paged.setPage} />
      </Card>
    </div>
  );
}
