import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import PartyForm from "./PartyForm";
import StatusToggleButton from "@/components/StatusToggleButton";
import { FormDialog } from "@/components/FormDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addParty, updateParty, setPartyActive } from "./actions";

type SearchParams = { filter?: string; status?: string; q?: string };

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

function tabClass(selected: boolean) {
  return `px-4 py-2 text-xs font-bold uppercase tracking-wider rounded transition-colors ${
    selected ? "bg-matte-black text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
  }`;
}

export default async function PartiesPage(props: { searchParams: Promise<SearchParams> }) {
  await requireRole("owner", "accounts", "sales");

  const searchParams = await props.searchParams;
  const filter = searchParams?.filter ?? "all";
  const status = searchParams?.status ?? "all";
  const query = searchParams?.q?.trim() ?? "";

  const supabase = await createClient();
  let request = supabase.from("parties").select("*").order("name", { ascending: true });

  if (filter === "clients") request = request.eq("is_client", true);
  if (filter === "vendors") request = request.eq("is_vendor", true);
  if (status === "active") request = request.eq("is_active", true);
  if (status === "inactive") request = request.eq("is_active", false);
  if (query) request = request.ilike("name", `%${query}%`);

  const { data: parties } = await request;

  // Each tab changes one filter and carries the others, so type, status and search combine.
  const hrefWith = (change: Partial<SearchParams>) => {
    const params = new URLSearchParams({ filter, status, ...change });
    if (query) params.set("q", query);
    return `/parties?${params}`;
  };

  return (
    <div className="p-8 max-w-6xl mx-auto w-full relative">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold uppercase tracking-tight text-matte-black">Clients &amp; Vendors</h1>
          <p className="text-gray-500 mt-2">One list for everyone you bill and everyone who bills you.</p>
        </div>
        <FormDialog title="Add Party" trigger={<Button type="button" variant="brand">+ Add Party</Button>}>
          <PartyForm add={addParty} update={updateParty} />
        </FormDialog>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 mb-6">
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
        <form className="flex-1 flex gap-2" action="/parties">
          <input type="hidden" name="filter" value={filter} />
          <input type="hidden" name="status" value={status} />
          <Input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Search by name…"
            aria-label="Search parties by name"
            className="flex-1 bg-white"
          />
          <Button type="submit" size="lg" variant="outline">
            Search
          </Button>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden w-full">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Location</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">GSTIN</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {parties?.map((party) => (
                <tr key={party.id} className={`hover:bg-gray-50/50 transition-colors ${party.is_active ? "" : "opacity-50"}`}>
                  <td className="p-4 align-top">
                    <div className="flex flex-col">
                      <span className="font-semibold text-gray-900">{party.name}</span>
                      {party.contact_person && <span className="text-xs text-gray-500">{party.contact_person}</span>}
                      {party.phone && <span className="text-xs text-gray-400">{party.phone}</span>}
                      {!party.is_active && (
                        <span className="text-[10px] uppercase tracking-wider text-gray-400 mt-1">Inactive</span>
                      )}
                    </div>
                  </td>
                  <td className="p-4 align-top">
                    <div className="flex gap-1 flex-wrap">
                      {party.is_client && (
                        <span className="inline-block px-2 py-1 rounded bg-blue-50 text-blue-700 text-[10px] font-bold uppercase tracking-wider">
                          Client
                        </span>
                      )}
                      {party.is_vendor && (
                        <span className="inline-block px-2 py-1 rounded bg-amber-50 text-amber-700 text-[10px] font-bold uppercase tracking-wider">
                          Vendor
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-4 align-top text-sm text-gray-600">
                    {party.billing_city && <div>{party.billing_city}</div>}
                    {party.billing_state && <div className="text-xs text-gray-400">{party.billing_state}</div>}
                  </td>
                  <td className="p-4 align-top text-sm text-gray-600 font-mono text-xs">{party.gstin || "—"}</td>
                  <td className="p-4 align-top text-right">
                    <div className="flex items-start justify-end gap-2">
                      <FormDialog title="Edit Party" trigger={<Button type="button" variant="outline" size="sm" className="border-blue-200 text-blue-500 hover:bg-blue-50 hover:text-blue-700">Edit</Button>}>
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
              ))}
              {(!parties || parties.length === 0) && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">
                    {query
                      ? `No parties matching “${query}”.`
                      : status === "inactive"
                        ? "No deactivated clients or vendors."
                        : status === "active"
                          ? "No active clients or vendors."
                          : "No clients or vendors yet."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
