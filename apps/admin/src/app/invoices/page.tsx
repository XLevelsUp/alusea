import { todayInIndia } from "@/lib/erp/dates";
import { requireRole } from "@/lib/auth/session";
import { isOwnerLevel } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { loadDocumentFormData } from "@/lib/erp/formData";
import { fetchAll } from "@/lib/erp/fetchAll";
import { displayStatus } from "@/lib/erp/invoices";
import DocumentForm from "@/components/erp/DocumentForm";
import { FormDialog } from "@/components/FormDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import PartyForm from "@/app/parties/PartyForm";
import { addParty, updateParty } from "@/app/parties/actions";
import InvoiceHistory, { type HistoryRow } from "./InvoiceHistory";
import InvoiceTabs from "./InvoiceTabs";
import { generateInvoice } from "./actions";

type SearchParams = { tab?: string; client?: string; filter?: string };

export default async function InvoicesPage(props: { searchParams: Promise<SearchParams> }) {
  const profile = await requireRole("owner", "accounts", "sales");
  // Sales can read invoices but not raise them, so they get the history without the New Invoice tab.
  const canCreate = isOwnerLevel(profile.role) || profile.role === "accounts";

  const { tab, client, filter } = await props.searchParams;

  const supabase = await createClient();
  const [{ data: balances }, { data: pdfs }, formData] = await Promise.all([
    fetchAll((first, last) => supabase.from("invoice_balances").select("*").order("issue_date", { ascending: false }).order("invoice_id").range(first, last)),
    fetchAll((first, last) => supabase.from("invoices").select("id, pdf_path, is_gst_applicable").order("id").range(first, last)),
    canCreate ? loadDocumentFormData() : Promise.resolve(null),
  ]);

  // Read in full rather than by a list of ids, which would outgrow a request once there are a few hundred clients.
  const { data: parties } = await fetchAll((first, last) => supabase.from("parties").select("id, name").order("id").range(first, last));

  const nameById = new Map((parties ?? []).map((party) => [party.id, party.name]));
  const extraById = new Map((pdfs ?? []).map((row) => [row.id, row]));

  const rows: HistoryRow[] = (balances ?? []).map((row) => ({
    id: row.invoice_id,
    number: row.invoice_number,
    clientId: row.party_id,
    clientName: nameById.get(row.party_id) ?? "—",
    issueDate: row.issue_date,
    dueDate: row.due_date,
    status: displayStatus(row.payment_status),
    totalPaise: row.total_paise,
    balancePaise: row.balance_paise,
    hasPdf: !!extraById.get(row.invoice_id)?.pdf_path,
    withGst: extraById.get(row.invoice_id)?.is_gst_applicable ?? false,
  }));

  const newInvoice = formData ? (
    formData.parties.length === 0 ? (
      <Card>
        <CardContent className="py-4 text-center">
          <p className="text-gray-600 mb-4">You need at least one client before raising an invoice.</p>
          {/* Adding the client here refreshes this page, which then shows the form with them in the list. */}
          <FormDialog title="Add a client" trigger={<Button type="button" variant="brand">Add a client</Button>}>
            <PartyForm add={addParty} update={updateParty} />
          </FormDialog>
        </CardContent>
      </Card>
    ) : (
      <DocumentForm
        kind="invoice"
        parties={formData.parties}
        companyStateCode={formData.companyStateCode}
        initial={{
          // ?client=<id> arrives from a client's page, so the invoice starts with them selected.
          partyId: formData.parties.some((party) => party.id === client) ? (client ?? "") : "",
          issueDate: todayInIndia(),
          secondDate: "",
          isGstApplicable: true,
          // Left blank so the GST % is typed for each invoice rather than taken from company settings.
          gstRate: 0,
          notes: "",
          lines: [],
        }}
        save={generateInvoice}
        submitLabel="Generate Invoice"
        pendingLabel="Generating…"
      />
    )
  ) : undefined;

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto w-full">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight text-matte-black">Invoices</h1>
        <p className="text-gray-500 mt-2">Generate invoices and look back through the ones already raised.</p>
      </div>

      <InvoiceTabs
        initialTab={tab === "history" || filter ? "history" : "new"}
        newInvoice={newInvoice}
        history={<InvoiceHistory rows={rows} initialStatus={filter} />}
      />
    </div>
  );
}
