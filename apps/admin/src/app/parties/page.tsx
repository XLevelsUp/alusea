import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { isOwnerLevel } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { formatPaise } from "@/lib/erp/money";
import { VENDOR_TYPE_LABELS, isVendorType } from "@/lib/erp/parties";
import PartyForm from "./PartyForm";
import StatusToggleButton from "@/components/StatusToggleButton";
import AutoFilterForm from "@/components/AutoFilterForm";
import Pagination, { PAGE_SIZE } from "@/components/Pagination";
import { FormDialog } from "@/components/FormDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addParty, updateParty, setPartyActive } from "./actions";

type SearchParams = { filter?: string; status?: string; vendor?: string; q?: string; page?: string };

const TYPE_TABS = [
  { key: "all", label: "All" },
  { key: "clients", label: "Clients" },
  { key: "vendors", label: "Vendors" },
];

const STATUS_TABS = [
  { key: "all", label: "Any status" },
  { key: "active", label: "Active" },
  { key: "inactive", label: "Deactivated" },
];

const VENDOR_TABS = [
  { key: "all", label: "Any vendor type" },
  { key: "local", label: "Local" },
  { key: "import_export", label: "Import / Export" },
];

function tabClass(selected: boolean) {
  return `px-4 py-2 text-xs font-bold uppercase tracking-wider rounded transition-colors ${
    selected ? "bg-matte-black text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
  }`;
}

export default async function PartiesPage(props: { searchParams: Promise<SearchParams> }) {
  const profile = await requireRole("owner", "accounts", "sales");
  // Money totals are for the owner only for now; everyone else sees the same list without them.
  const showMoney = isOwnerLevel(profile.role);

  const searchParams = await props.searchParams;
  const filter = searchParams?.filter ?? "all";
  const status = searchParams?.status ?? "all";
  const vendor = searchParams?.vendor ?? "all";
  const query = searchParams?.q?.trim() ?? "";
  const page = Math.max(1, Math.floor(Number(searchParams?.page)) || 1);

  const supabase = await createClient();
  // Only the page on screen is fetched, with the full count alongside for the pager; id breaks ties so pages never overlap.
  let request = supabase
    .from("parties")
    .select("*", { count: "exact" })
    .order("name", { ascending: true })
    .order("id")
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  if (filter === "clients") request = request.eq("is_client", true);
  if (filter === "vendors") request = request.eq("is_vendor", true);
  if (status === "active") request = request.eq("is_active", true);
  if (status === "inactive") request = request.eq("is_active", false);
  // Only vendors carry a type, so choosing one narrows the list to vendors of that type.
  if (isVendorType(vendor)) request = request.eq("vendor_type", vendor);
  if (query) request = request.ilike("name", `%${query}%`);

  const { data: parties, count } = await request;
  const total = count ?? 0;

  // Money totals are looked up only for the parties on this page.
  const pageIds = (parties ?? []).map((party) => party.id);
  const { data: summaries } =
    showMoney && pageIds.length > 0
      ? await supabase.from("party_financial_summary").select("party_id, invoiced_paise, outstanding_paise").in("party_id", pageIds)
      : { data: null };

  const moneyByParty = new Map((summaries ?? []).map((row) => [row.party_id, row]));
  const columnCount = showMoney ? 6 : 5;

  // Each tab changes one filter and carries the others, so type, status, vendor type and search combine.
  const hrefWith = (change: Partial<SearchParams>) => {
    const params = new URLSearchParams({ filter, status, vendor, ...change });
    if (query) params.set("q", query);
    return `/parties?${params}`;
  };

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto w-full relative">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight text-matte-black">Clients &amp; Vendors</h1>
          <p className="text-gray-500 mt-2">One list for everyone you bill and everyone who bills you.</p>
        </div>
        <FormDialog title="Add Client or Vendor" trigger={<Button type="button" variant="brand">+ Add Client or Vendor</Button>}>
          <PartyForm add={addParty} update={updateParty} />
        </FormDialog>
      </div>

      <div className="flex flex-wrap gap-x-6 gap-y-3 mb-4">
        <nav aria-label="Filter by type" className="flex gap-2">
          {TYPE_TABS.map((tab) => (
            <Link key={tab.key} href={hrefWith({ filter: tab.key })} aria-current={filter === tab.key ? "page" : undefined} className={tabClass(filter === tab.key)}>
              {tab.label}
            </Link>
          ))}
        </nav>
        <nav aria-label="Filter by status" className="flex gap-2">
          {STATUS_TABS.map((tab) => (
            <Link key={tab.key} href={hrefWith({ status: tab.key })} aria-current={status === tab.key ? "page" : undefined} className={tabClass(status === tab.key)}>
              {tab.label}
            </Link>
          ))}
        </nav>
        <nav aria-label="Filter by vendor type" className="flex gap-2">
          {VENDOR_TABS.map((tab) => (
            <Link key={tab.key} href={hrefWith({ vendor: tab.key })} aria-current={vendor === tab.key ? "page" : undefined} className={tabClass(vendor === tab.key)}>
              {tab.label}
            </Link>
          ))}
        </nav>
      </div>

      <AutoFilterForm className="mb-3" action="/parties">
        <input type="hidden" name="filter" value={filter} />
        <input type="hidden" name="status" value={status} />
        <input type="hidden" name="vendor" value={vendor} />
        <Input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="Type a name to search…"
          aria-label="Search parties by name"
          className="bg-white"
        />
      </AutoFilterForm>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden w-full">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Location</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">GSTIN</th>
                {showMoney && (
                  <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Total billed</th>
                )}
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {parties?.map((party) => {
                const money = moneyByParty.get(party.id);

                return (
                  <tr key={party.id} className={`hover:bg-gray-50/50 transition-colors ${party.is_active ? "" : "opacity-50"}`}>
                    <td className="p-4 align-top">
                      <div className="flex flex-col">
                        <Link href={`/parties/${party.id}`} className="font-semibold text-gray-900 hover:text-[#A67C52]">
                          {party.name}
                        </Link>
                        {party.contact_person && <span className="text-xs text-gray-500">{party.contact_person}</span>}
                        {party.phone && <span className="text-xs text-gray-500">{party.phone}</span>}
                        {/* The Location column is hidden on a phone, so the city is shown here instead. */}
                        {party.billing_city && <span className="text-xs text-gray-500 md:hidden">{party.billing_city}</span>}
                        {!party.is_active && (
                          <span className="text-[11px] uppercase tracking-wider text-gray-500 mt-1">Inactive</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 align-top">
                      <div className="flex gap-1 flex-wrap">
                        {party.is_client && (
                          <span className="inline-block px-2 py-1 rounded bg-blue-50 text-blue-700 text-[11px] font-bold uppercase tracking-wider">
                            Client
                          </span>
                        )}
                        {party.is_vendor && (
                          <span className="inline-block px-2 py-1 rounded bg-amber-50 text-amber-700 text-[11px] font-bold uppercase tracking-wider">
                            {party.vendor_type ? `${VENDOR_TYPE_LABELS[party.vendor_type]} vendor` : "Vendor"}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 align-top text-sm text-gray-600 hidden md:table-cell">
                      {party.billing_city && <div>{party.billing_city}</div>}
                      {party.billing_state && <div className="text-xs text-gray-500">{party.billing_state}</div>}
                    </td>
                    <td className="p-4 align-top text-sm text-gray-600 font-mono text-xs hidden md:table-cell">{party.gstin || "—"}</td>
                    {showMoney && (
                      <td className="p-4 align-top text-sm text-right">
                        {party.is_client && money ? (
                          <>
                            <span className="font-semibold text-gray-900">{formatPaise(money.invoiced_paise)}</span>
                            {money.outstanding_paise > 0 && (
                              <span className="block text-xs text-red-600">{formatPaise(money.outstanding_paise)} due</span>
                            )}
                          </>
                        ) : (
                          <span className="text-gray-500">—</span>
                        )}
                      </td>
                    )}
                    <td className="p-4 align-top text-right">
                      <div className="flex items-start justify-end gap-2">
                        <FormDialog title="Edit Client or Vendor" trigger={<Button type="button" variant="outline" size="sm">Edit</Button>}>
                          <PartyForm initialData={party} add={addParty} update={updateParty} />
                        </FormDialog>
                        <StatusToggleButton
                          id={party.id}
                          isActive={party.is_active}
                          setActive={setPartyActive}
                          name={party.name}
                          itemLabel="party"
                          deactivateNote="They will no longer appear when picking a client or vendor on new invoices, quotes and expenses. Existing records keep them."
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
              {(!parties || parties.length === 0) && (
                <tr>
                  <td colSpan={columnCount} className="p-8 text-center text-gray-500">
                    {query
                      ? `No parties matching “${query}”.`
                      : isVendorType(vendor)
                        ? `No ${VENDOR_TYPE_LABELS[vendor].toLowerCase()} vendors found.`
                        : status === "inactive"
                          ? "No deactivated clients or vendors."
                          : status === "active"
                            ? "No active clients or vendors."
                            : "No clients or vendors yet."}
                    {/* Shown only on a truly empty list, where adding one is the obvious next step. */}
                    {!query && status !== "inactive" && !isVendorType(vendor) && (
                      <div className="mt-4">
                        <FormDialog title="Add Client or Vendor" trigger={<Button type="button" variant="brand">+ Add Client or Vendor</Button>}>
                          <PartyForm add={addParty} update={updateParty} />
                        </FormDialog>
                      </div>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination page={page} total={total} noun="clients and vendors" hrefFor={(target) => `${hrefWith({})}&page=${target}`} />
      </div>
    </div>
  );
}
