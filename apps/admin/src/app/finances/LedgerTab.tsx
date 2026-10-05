"use client";

import { toast } from "sonner";
import { useMemo } from "react";
import Link from "next/link";
import { CheckIcon, DownloadIcon, PlusIcon, XIcon } from "lucide-react";
import { useConfirm } from "@/components/ConfirmProvider";
import { FormDialog } from "@/components/FormDialog";
import Pagination from "@/components/Pagination";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { useActionRunner } from "@/hooks/use-action";
import { usePaged } from "@/hooks/use-paged";
import { useUrlState } from "@/hooks/use-url-state";
import { LEDGER_CATEGORIES, SOURCE_LABELS, inRange, totals, withRunningBalance, type Source } from "@/lib/erp/finance";
import { formatPaise, paiseToRupeeString } from "@/lib/erp/money";
import { deletePayment } from "@/app/invoices/actions";
import { approveLedgerEntry, deleteLedgerEntry, toggleGstClaim } from "./actions";
import { LedgerEntryForm, PaymentForm } from "./LedgerForms";
import { Empty, Section, TH, downloadCsv, formatDate } from "./parts";
import type { InvoiceRow, LedgerRow, PartyOption, PendingEntry } from "./types";

type Range = { from: string | null; to: string | null };

const categoryLabel = (value: string) => LEDGER_CATEGORIES.find((category) => category.value === value)?.label ?? value;

export default function LedgerTab({
  ledger,
  pending,
  invoices,
  parties,
  range,
  openingPaise,
  canEdit,
}: {
  ledger: LedgerRow[];
  pending: PendingEntry[];
  invoices: InvoiceRow[];
  parties: PartyOption[];
  range: Range;
  // The balance carried in from movements older than the ones loaded.
  openingPaise: number;
  canEdit: boolean;
}) {
  // Kept in the address, so opening a line's invoice or expense and pressing Back returns to the same filtered ledger.
  const [direction, setDirection] = useUrlState<string>("money", "all", { allowed: ["all", "in", "out"] });
  const [source, setSource] = useUrlState<string>("type", "all", { allowed: ["all", ...Object.keys(SOURCE_LABELS)] });
  const [claim, setClaim] = useUrlState<string>("gst", "all", { allowed: ["all", "claimed", "unclaimed"] });
  const [query, setQuery] = useUrlState<string>("search", "");
  const { run, isPending, error } = useActionRunner();
  const confirm = useConfirm();
  // Confirms in the corner once an action on a ledger line has gone through.
  const say = (message: string) => (result: { ok: boolean }) => {
    if (result.ok) toast.success(message);
  };

  // The balance runs over every movement ever recorded, so it is the real position at each date; filters then only choose which lines to show.
  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return withRunningBalance(ledger, openingPaise)
      .filter((row) => inRange(row.entry_date, range))
      .filter((row) => direction === "all" || row.direction === direction)
      .filter((row) => source === "all" || row.source === source)
      // Choosing claimed or unclaimed narrows the list to purchases, the only lines a claim applies to.
      .filter((row) => claim === "all" || (row.claimable && row.gstClaim === (claim === "claimed")))
      .filter((row) => !needle || row.description.toLowerCase().includes(needle) || row.partyName.toLowerCase().includes(needle))
      .reverse();
  }, [ledger, openingPaise, range, direction, source, claim, query]);

  const sum = totals(visible);
  // The totals, the balance and the CSV cover every matching line; only the table is cut into pages.
  const paged = usePaged(visible, [range.from, range.to, direction, source, claim, query].join("|"));

  function exportCsv() {
    downloadCsv(
      "general-ledger.csv",
      ["Date", "Type", "Description", "Client or vendor", "Money in", "Money out", "GST claimed", "Balance"],
      visible.map((row) => [
        row.entry_date,
        SOURCE_LABELS[row.source],
        row.description,
        row.partyName,
        row.direction === "in" ? paiseToRupeeString(row.amount_paise) : "",
        row.direction === "out" ? paiseToRupeeString(row.amount_paise) : "",
        row.claimable ? (row.gstClaim ? "Yes" : "No") : "",
        paiseToRupeeString(row.balancePaise),
      ])
    );
  }

  async function removeRow(row: LedgerRow) {
    const ok = await confirm({
      title: row.source === "invoice_payment" ? `Remove the ${formatPaise(row.amount_paise)} payment?` : "Delete this entry?",
      description:
        row.source === "invoice_payment"
          ? "The invoice's outstanding balance goes back up by this amount."
          : "It is removed from the ledger permanently.",
      confirmLabel: "Remove",
    });
    if (!ok) return;

    if (row.source === "invoice_payment") {
      const formData = new FormData();
      formData.set("id", row.recordId);
      formData.set("invoice_id", row.parentId ?? "");
      run(deletePayment, formData).then(say("Payment removed"));
    } else {
      run(deleteLedgerEntry, row.recordId).then(say("Entry deleted"));
    }
  }

  // A single-field save: the tick is stored on the expense or manual entry the line came from.
  function setGstClaim(row: LedgerRow, claimed: boolean) {
    const formData = new FormData();
    formData.set("id", row.recordId);
    formData.set("source", row.source);
    formData.set("claimed", String(claimed));
    run(toggleGstClaim, formData).then(say(claimed ? "Marked as GST claimed" : "GST claim removed"));
  }

  async function rejectPending(entry: PendingEntry) {
    const ok = await confirm({ title: "Delete this pending entry?", description: entry.description, confirmLabel: "Delete" });
    if (ok) run(deleteLedgerEntry, entry.id).then(say("Entry deleted"));
  }

  return (
    <div>
      {canEdit && (
        <div className="flex flex-wrap gap-3 mb-6">
          <FormDialog
            title="Record a client payment"
            description="Money received against an issued invoice."
            trigger={
              <Button type="button" variant="brand">
                <PlusIcon aria-hidden="true" />
                Record Payment
              </Button>
            }
          >
            <PaymentForm invoices={invoices} />
          </FormDialog>
          <FormDialog
            title="Add a ledger entry"
            description="For money that moved outside invoices, expenses, payroll and capital."
            trigger={
              <Button type="button" variant="outline">
                <PlusIcon aria-hidden="true" />
                Add Entry
              </Button>
            }
          >
            <LedgerEntryForm parties={parties} />
          </FormDialog>
        </div>
      )}

      {error && <p role="alert" className="mb-4 text-sm text-destructive">{error}</p>}

      {pending.length > 0 && (
        <Section title="Waiting for approval" description="Manual entries count in the ledger only once approved.">
          <ul className="divide-y">
            {pending.map((entry) => (
              <li key={entry.id} className="flex flex-wrap items-center gap-4 px-5 py-3">
                <span className="text-sm text-gray-600 w-28">{formatDate(entry.entry_date)}</span>
                <span className="flex-1 min-w-48">
                  <span className="block text-sm font-medium text-gray-900">{entry.description}</span>
                  <span className="block text-xs text-gray-500">
                    {categoryLabel(entry.category)}
                    {entry.partyName && ` · ${entry.partyName}`}
                    {entry.gst_claim && " · GST claimed"}
                  </span>
                </span>
                <span className={`text-sm font-semibold ${entry.direction === "in" ? "text-green-700" : "text-red-600"}`}>
                  {entry.direction === "in" ? "+" : "−"} {formatPaise(entry.amount_paise)}
                </span>
                {canEdit && (
                  <span className="flex gap-2">
                    <Button type="button" size="sm" disabled={isPending} onClick={() => run(approveLedgerEntry, entry.id).then(say("Entry approved"))}>
                      <CheckIcon aria-hidden="true" />
                      Approve
                    </Button>
                    <Button type="button" size="sm" variant="destructive" disabled={isPending} onClick={() => rejectPending(entry)}>
                      Delete
                    </Button>
                  </span>
                )}
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Card className="mb-6">
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
          <label className="text-sm font-medium">
            <span className="block mb-2">Money</span>
            <NativeSelect value={direction} onChange={(e) => setDirection(e.target.value)}>
              <NativeSelectOption value="all">In and out</NativeSelectOption>
              <NativeSelectOption value="in">Money in</NativeSelectOption>
              <NativeSelectOption value="out">Money out</NativeSelectOption>
            </NativeSelect>
          </label>
          <label className="text-sm font-medium">
            <span className="block mb-2">Type</span>
            <NativeSelect value={source} onChange={(e) => setSource(e.target.value)}>
              <NativeSelectOption value="all">All types</NativeSelectOption>
              {(Object.keys(SOURCE_LABELS) as Source[]).map((key) => (
                <NativeSelectOption key={key} value={key}>
                  {SOURCE_LABELS[key]}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </label>
          <label className="text-sm font-medium">
            <span className="block mb-2">GST claim</span>
            <NativeSelect value={claim} onChange={(e) => setClaim(e.target.value)}>
              <NativeSelectOption value="all">All</NativeSelectOption>
              <NativeSelectOption value="claimed">Claimed</NativeSelectOption>
              <NativeSelectOption value="unclaimed">Unclaimed</NativeSelectOption>
            </NativeSelect>
          </label>
          <label className="text-sm font-medium">
            <span className="block mb-2">Search</span>
            <Input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Description or client…" />
          </label>
          <Button type="button" size="lg" variant="outline" onClick={exportCsv} disabled={visible.length === 0}>
            <DownloadIcon aria-hidden="true" />
            Export CSV
          </Button>
        </CardContent>
      </Card>

      <Section
        title="General ledger"
        description={`${visible.length} movements · in ${formatPaise(sum.inPaise)} · out ${formatPaise(sum.outPaise)}`}
      >
        {visible.length === 0 ? (
          <Empty>No money moved in this period with these filters.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className={TH}>Date</th>
                  <th className={TH}>Description</th>
                  <th className={`${TH} hidden md:table-cell`}>Type</th>
                  <th className={`${TH} text-right`}>Money in</th>
                  <th className={`${TH} text-right`}>Money out</th>
                  <th className={`${TH} hidden md:table-cell`}>GST claim</th>
                  <th className={`${TH} text-right`}>Balance</th>
                  {canEdit && <th className="p-4 w-10" />}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paged.pageRows.map((row) => (
                  <tr key={row.key} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-4 text-sm text-gray-600 whitespace-nowrap">{formatDate(row.entry_date)}</td>
                    <td className="p-4">
                      {row.href ? (
                        <Link href={row.href} className="text-sm font-medium text-gray-900 hover:text-[#A67C52]">
                          {row.description}
                        </Link>
                      ) : (
                        <span className="text-sm font-medium text-gray-900">{row.description}</span>
                      )}
                      {row.partyName && <span className="block text-xs text-gray-500">{row.partyName}</span>}
                      {/* The Type column is hidden on a phone, so the type is shown here instead. */}
                      <span className="block text-xs text-gray-500 md:hidden">{SOURCE_LABELS[row.source]}</span>
                      {/* The GST claim column is hidden on a phone too, so its tick box is offered here. */}
                      {row.claimable && (
                        <span className="mt-2 flex items-center gap-2 text-xs text-gray-600 md:hidden">
                          {canEdit ? (
                            <Checkbox
                              checked={row.gstClaim}
                              disabled={isPending}
                              aria-label={`GST claimed for ${row.description}`}
                              onCheckedChange={(checked) => setGstClaim(row, checked === true)}
                            />
                          ) : null}
                          {row.gstClaim ? "GST claimed" : "GST not claimed"}
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-xs text-gray-600 hidden md:table-cell">{SOURCE_LABELS[row.source]}</td>
                    <td className="p-4 text-sm text-right text-green-700 font-semibold">
                      {row.direction === "in" ? formatPaise(row.amount_paise) : ""}
                    </td>
                    <td className="p-4 text-sm text-right text-red-600 font-semibold">
                      {row.direction === "out" ? formatPaise(row.amount_paise) : ""}
                    </td>
                    <td className="p-4 text-sm text-gray-700 hidden md:table-cell">
                      {/* Only purchases can be ticked: expenses and manual money-out entries. */}
                      {row.claimable &&
                        (canEdit ? (
                          <Checkbox
                            checked={row.gstClaim}
                            disabled={isPending}
                            aria-label={`GST claimed for ${row.description}`}
                            onCheckedChange={(checked) => setGstClaim(row, checked === true)}
                          />
                        ) : (
                          <span className={row.gstClaim ? "text-green-700" : "text-gray-500"}>{row.gstClaim ? "Claimed" : "Not claimed"}</span>
                        ))}
                    </td>
                    <td className={`p-4 text-sm text-right ${row.balancePaise < 0 ? "text-red-600" : "text-gray-900"}`}>
                      {formatPaise(row.balancePaise)}
                    </td>
                    {canEdit && (
                      <td className="p-4 text-right">
                        {(row.source === "invoice_payment" || row.source === "manual") && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            disabled={isPending}
                            aria-label={`Remove ${row.description}`}
                            onClick={() => removeRow(row)}
                            className="text-gray-500 hover:text-destructive"
                          >
                            <XIcon />
                          </Button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={paged.page} total={paged.total} noun="movements" onPage={paged.setPage} />
      </Section>
    </div>
  );
}
