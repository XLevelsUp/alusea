import { EXPENSE_STATUS_LABELS } from "@/lib/erp/expenses";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { requireRole } from "@/lib/auth/session";
import { isOwnerLevel } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { formatPaise } from "@/lib/erp/money";
import { VENDOR_TYPE_LABELS } from "@/lib/erp/parties";
import { INVOICE_STATUS, displayStatus } from "@/lib/erp/invoices";
import type { ExpenseStatus } from "@/lib/supabase/types";
import DeleteButton from "@/components/DeleteButton";
import { FormDialog } from "@/components/FormDialog";
import StatusToggleButton from "@/components/StatusToggleButton";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import PartyForm from "../PartyForm";
import { addParty, deleteParty, setPartyActive, updateParty } from "../actions";

const EXPENSE_STATUS: Record<ExpenseStatus, string> = {
  draft: "bg-gray-100 text-gray-600",
  submitted: "bg-blue-50 text-blue-700",
  approved: "bg-green-50 text-green-700",
  rejected: "bg-red-50 text-red-700",
};

const TH = "p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider";
const TITLE = "text-sm font-bold uppercase tracking-wider text-matte-black";

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function Badge({ className, children }: { className: string; children: ReactNode }) {
  return <span className={`inline-block px-2 py-1 rounded text-[11px] font-bold uppercase tracking-wider ${className}`}>{children}</span>;
}

function Tile({ label, value, note, tone }: { label: string; value: string; note?: string; tone?: string }) {
  return (
    <Card>
      <CardContent>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className={`mt-2 text-2xl font-bold ${tone ?? "text-matte-black"}`}>{value}</p>
        {note && <p className="mt-1 text-xs text-muted-foreground">{note}</p>}
      </CardContent>
    </Card>
  );
}

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm text-gray-900 whitespace-pre-line">{children || "—"}</dd>
    </div>
  );
}

type ExpenseRow = {
  id: string;
  spent_on: string;
  description: string;
  amount_paise: number;
  status: ExpenseStatus;
  category_id: string;
  party_id: string | null;
  client_id: string | null;
};

function ExpenseTable({
  rows,
  categoryById,
  partyById,
  counterpart,
  empty,
}: {
  rows: ExpenseRow[];
  categoryById: Map<string, string>;
  partyById: Map<string, string>;
  // Which other party to show beside each expense: the vendor paid, or the client it was for.
  counterpart: "vendor" | "client";
  empty: string;
}) {
  if (rows.length === 0) return <p className="p-5 text-sm text-gray-500">{empty}</p>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-100">
            <th className={TH}>Date</th>
            <th className={TH}>Description</th>
            <th className={TH}>Category</th>
            <th className={TH}>{counterpart === "vendor" ? "Paid to" : "For client"}</th>
            <th className={TH}>Status</th>
            <th className={`${TH} text-right`}>Amount</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((expense) => {
            const otherId = counterpart === "vendor" ? expense.party_id : expense.client_id;

            return (
              <tr key={expense.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="p-4 text-sm text-gray-600 whitespace-nowrap">{formatDate(expense.spent_on)}</td>
                <td className="p-4">
                  <Link href={`/expenses/${expense.id}`} className="text-sm font-medium text-gray-900 hover:text-[#A67C52]">
                    {expense.description}
                  </Link>
                </td>
                <td className="p-4 text-sm text-gray-600">{categoryById.get(expense.category_id) ?? "—"}</td>
                <td className="p-4 text-sm text-gray-600">{(otherId && partyById.get(otherId)) || "—"}</td>
                <td className="p-4">
                  <Badge className={EXPENSE_STATUS[expense.status]}>{EXPENSE_STATUS_LABELS[expense.status]}</Badge>
                </td>
                <td className="p-4 text-sm text-right font-semibold text-gray-900">{formatPaise(expense.amount_paise)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default async function PartyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const profile = await requireRole("owner", "accounts", "sales");
  // The money totals and the history of invoices and expenses are for the owner only for now.
  const isOwner = isOwnerLevel(profile.role);

  const { id } = await params;
  const supabase = await createClient();
  const { data: party } = await supabase.from("parties").select("*").eq("id", id).single();

  if (!party) notFound();

  const expenseColumns = "id, spent_on, description, amount_paise, status, category_id, party_id, client_id";
  const none = Promise.resolve({ data: null });

  const [{ data: summary }, { data: invoices }, { data: clientExpenses }, { data: vendorExpenses }, { data: categories }] =
    await Promise.all([
      isOwner ? supabase.from("party_financial_summary").select("*").eq("party_id", id).maybeSingle() : none,
      isOwner
        ? supabase.from("invoice_balances").select("*").eq("party_id", id).order("issue_date", { ascending: false })
        : none,
      isOwner && party.is_client
        ? supabase.from("expenses").select(expenseColumns).eq("client_id", id).order("spent_on", { ascending: false })
        : none,
      isOwner && party.is_vendor
        ? supabase.from("expenses").select(expenseColumns).eq("party_id", id).order("spent_on", { ascending: false })
        : none,
      isOwner ? supabase.from("expense_categories").select("id, name") : none,
    ]);

  const invoiceRows = invoices ?? [];
  const clientExpenseRows = clientExpenses ?? [];
  const vendorExpenseRows = vendorExpenses ?? [];

  // Names for the other party on each expense: the vendor paid, or the client it was for.
  const otherIds = [
    ...new Set([...clientExpenseRows.map((row) => row.party_id), ...vendorExpenseRows.map((row) => row.client_id)].filter(Boolean)),
  ] as string[];
  const { data: others } = otherIds.length
    ? await supabase.from("parties").select("id, name").in("id", otherIds)
    : { data: [] };

  const categoryById = new Map((categories ?? []).map((category) => [category.id, category.name]));
  const partyById = new Map((others ?? []).map((other) => [other.id, other.name]));

  // Delete is offered only while nothing refers to the party; the server action checks again, including quotations.
  const hasHistory = invoiceRows.length + clientExpenseRows.length + vendorExpenseRows.length > 0;

  const address = [
    party.billing_address_line1,
    party.billing_address_line2,
    [party.billing_city, party.billing_state, party.billing_pincode].filter(Boolean).join(", "),
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto w-full">
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <Link href="/parties" className="text-sm text-gray-500 hover:text-matte-black transition-colors">
            ← Back to Clients &amp; Vendors
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight text-matte-black mt-2">{party.name}</h1>
          <div className="flex gap-1 flex-wrap mt-2">
            {party.is_client && <Badge className="bg-blue-50 text-blue-700">Client</Badge>}
            {party.is_vendor && (
              <Badge className="bg-amber-50 text-amber-700">
                {party.vendor_type ? `${VENDOR_TYPE_LABELS[party.vendor_type]} vendor` : "Vendor"}
              </Badge>
            )}
            <Badge className={party.is_active ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}>
              {party.is_active ? "Active" : "Deactivated"}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <FormDialog title="Edit Party" trigger={<Button type="button" size="lg" variant="outline">Edit</Button>}>
            <PartyForm initialData={party} add={addParty} update={updateParty} />
          </FormDialog>
          <StatusToggleButton
            id={party.id}
            isActive={party.is_active}
            setActive={setPartyActive}
            name={party.name}
            itemLabel="party"
            size="lg"
            deactivateNote="They will no longer appear when picking a client or vendor on new invoices and expenses. Existing records keep them."
          />
          {isOwner && !hasHistory && (
            <DeleteButton id={party.id} itemLabel="party" name={party.name} deleteAction={deleteParty} redirectTo="/parties" size="lg" />
          )}
        </div>
      </div>

      {isOwner && party.is_client && (
        <section aria-label="Client totals" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Tile label="Total billed" value={formatPaise(summary?.invoiced_paise ?? 0)} note={`${summary?.invoice_count ?? 0} issued invoices`} />
          <Tile label="Collected" value={formatPaise(summary?.collected_paise ?? 0)} />
          <Tile
            label="Outstanding"
            value={formatPaise(summary?.outstanding_paise ?? 0)}
            tone={(summary?.outstanding_paise ?? 0) > 0 ? "text-red-600" : undefined}
          />
          <Tile
            label="Spent on their jobs"
            value={formatPaise(summary?.client_expense_paise ?? 0)}
            note={`${summary?.client_expense_count ?? 0} approved expenses`}
          />
        </section>
      )}

      {isOwner && party.is_vendor && (
        <section aria-label="Vendor totals" className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <Tile label="Purchased from them" value={formatPaise(summary?.vendor_expense_paise ?? 0)} note="Approved expenses paid to this vendor" />
          <Tile label="Purchases" value={String(summary?.vendor_expense_count ?? 0)} />
        </section>
      )}

      <Card className="mb-6">
        <CardHeader className="border-b">
          <CardTitle className={TITLE}>Details</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <Detail label="Contact person">{party.contact_person}</Detail>
            <Detail label="Phone">{party.phone}</Detail>
            <Detail label="Email">{party.email}</Detail>
            <Detail label="Address">{address}</Detail>
            <Detail label="GSTIN">{party.gstin}</Detail>
            <Detail label="PAN">{party.pan}</Detail>
            <Detail label="Payment terms">{party.payment_terms_days ? `${party.payment_terms_days} ${party.payment_terms_days === 1 ? "day" : "days"}` : ""}</Detail>
            <Detail label="Services offered">{party.services_offered}</Detail>
            <Detail label="Notes">{party.notes}</Detail>
          </dl>
        </CardContent>
      </Card>

      {isOwner && party.is_client && (
        <>
          <Card className="gap-0 py-0 mb-6">
            <CardHeader className="p-5 border-b">
              <CardTitle className={TITLE}>Invoices</CardTitle>
              <CardDescription className="text-xs">Every invoice raised for this client, including drafts.</CardDescription>
              <CardAction>
                <Button asChild size="lg" variant="outline">
                  <Link href={`/invoices?tab=new&client=${party.id}`}>+ New invoice</Link>
                </Button>
              </CardAction>
            </CardHeader>
            {invoiceRows.length === 0 ? (
              <p className="p-5 text-sm text-gray-500">No invoices for this client yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className={TH}>Invoice</th>
                      <th className={TH}>Date</th>
                      <th className={TH}>Status</th>
                      <th className={`${TH} text-right`}>Total</th>
                      <th className={`${TH} text-right`}>Paid</th>
                      <th className={`${TH} text-right`}>Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {invoiceRows.map((invoice) => (
                      <tr key={invoice.invoice_id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="p-4">
                          <Link href={`/invoices/${invoice.invoice_id}`} className="text-sm font-medium text-gray-900 hover:text-[#A67C52]">
                            {invoice.invoice_number ?? "Draft"}
                          </Link>
                        </td>
                        <td className="p-4 text-sm text-gray-600 whitespace-nowrap">{formatDate(invoice.issue_date)}</td>
                        <td className="p-4">
                          <Badge className={INVOICE_STATUS[displayStatus(invoice.payment_status)].style}>
                            {INVOICE_STATUS[displayStatus(invoice.payment_status)].label}
                          </Badge>
                        </td>
                        <td className="p-4 text-sm text-right font-semibold text-gray-900">{formatPaise(invoice.total_paise)}</td>
                        <td className="p-4 text-sm text-right text-gray-600">{formatPaise(invoice.paid_paise)}</td>
                        <td className={`p-4 text-sm text-right ${invoice.status === "issued" && invoice.balance_paise > 0 ? "text-red-600 font-semibold" : "text-gray-600"}`}>
                          {invoice.status === "issued" ? formatPaise(invoice.balance_paise) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <Card className="gap-0 py-0 mb-6">
            <CardHeader className="p-5 border-b">
              <CardTitle className={TITLE}>Expenses for this client</CardTitle>
              <CardDescription className="text-xs">Money spent on this client&apos;s jobs, whoever it was paid to.</CardDescription>
              <CardAction className="flex gap-2">
                <Button asChild size="lg" variant="outline">
                  <Link href={`/expenses?client=${party.id}`}>View in Expenses</Link>
                </Button>
                <Button asChild size="lg" variant="brand">
                  <Link href={`/expenses/new?client=${party.id}`}>+ Add expense</Link>
                </Button>
              </CardAction>
            </CardHeader>
            <ExpenseTable
              rows={clientExpenseRows}
              categoryById={categoryById}
              partyById={partyById}
              counterpart="vendor"
              empty="No expenses recorded for this client yet."
            />
          </Card>
        </>
      )}

      {isOwner && party.is_vendor && (
        <Card className="gap-0 py-0">
          <CardHeader className="p-5 border-b">
            <CardTitle className={TITLE}>Purchases from this vendor</CardTitle>
            <CardDescription className="text-xs">Expenses where this vendor was the one paid.</CardDescription>
          </CardHeader>
          <ExpenseTable
            rows={vendorExpenseRows}
            categoryById={categoryById}
            partyById={partyById}
            counterpart="client"
            empty="No purchases from this vendor yet."
          />
        </Card>
      )}
    </div>
  );
}
