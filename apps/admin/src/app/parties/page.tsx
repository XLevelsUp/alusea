import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import PartyForm from "./PartyForm";
import PartyStatusButton from "./PartyStatusButton";
import { addParty, updateParty, setPartyActive } from "./actions";

type SearchParams = { edit?: string; add?: string; filter?: string; q?: string };

export default async function PartiesPage(props: { searchParams: Promise<SearchParams> }) {
  await requireRole("owner", "accounts", "sales");

  const searchParams = await props.searchParams;
  const editId = searchParams?.edit;
  const isAddOpen = searchParams?.add === "true";
  const filter = searchParams?.filter ?? "all";
  const query = searchParams?.q?.trim() ?? "";

  const supabase = await createClient();
  let request = supabase.from("parties").select("*").order("name", { ascending: true });

  if (filter === "clients") request = request.eq("is_client", true);
  if (filter === "vendors") request = request.eq("is_vendor", true);
  if (query) request = request.ilike("name", `%${query}%`);

  const { data: parties } = await request;

  const editingParty = editId ? parties?.find((p) => p.id === editId) : undefined;
  const isModalOpen = isAddOpen || !!editingParty;

  const tabs = [
    { key: "all", label: "All" },
    { key: "clients", label: "Clients" },
    { key: "vendors", label: "Vendors" },
  ];

  return (
    <div className="p-8 max-w-6xl mx-auto w-full relative">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold uppercase tracking-tight text-matte-black">Clients &amp; Vendors</h1>
          <p className="text-gray-500 mt-2">One list for everyone you bill and everyone who bills you.</p>
        </div>
        <Link
          href="/parties?add=true"
          className="inline-flex items-center justify-center px-5 py-3 bg-[#A67C52] text-white text-xs font-bold uppercase tracking-wider rounded-sm hover:bg-[#8e6944] transition-colors shadow-md"
        >
          + Add Party
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex gap-2">
          {tabs.map((tab) => (
            <Link
              key={tab.key}
              href={`/parties?filter=${tab.key}${query ? `&q=${encodeURIComponent(query)}` : ""}`}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded transition-colors ${
                filter === tab.key ? "bg-matte-black text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </div>
        <form className="flex-1 flex gap-2" action="/parties">
          <input type="hidden" name="filter" value={filter} />
          <input
            name="q"
            defaultValue={query}
            placeholder="Search by name…"
            className="flex-1 rounded-md px-4 py-2 bg-white border border-gray-200 text-black text-sm focus:outline-none focus:ring-2 focus:ring-[#A67C52]/40"
          />
          <button
            type="submit"
            className="px-4 py-2 border border-gray-200 bg-white text-gray-600 text-xs font-bold uppercase tracking-wider rounded hover:bg-gray-50 transition-colors cursor-pointer"
          >
            Search
          </button>
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
                      <Link
                        href={`/parties?edit=${party.id}`}
                        className="text-blue-500 hover:text-blue-700 text-xs font-semibold uppercase tracking-wider px-3 py-1 border border-blue-200 hover:bg-blue-50 rounded transition-colors"
                      >
                        Edit
                      </Link>
                      <PartyStatusButton id={party.id} isActive={party.is_active} setActive={setPartyActive} />
                    </div>
                  </td>
                </tr>
              ))}
              {(!parties || parties.length === 0) && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">
                    {query ? `No parties matching “${query}”.` : "No clients or vendors yet."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-100 max-w-2xl w-full max-h-[90vh] flex flex-col relative">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold uppercase tracking-wider text-matte-black">
                {editingParty ? "Edit Party" : "Add Party"}
              </h2>
              <Link href="/parties" className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-matte-black">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Link>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <PartyForm
                key={editId ?? "new"}
                initialData={editingParty}
                add={addParty}
                update={updateParty}
                cancelUrl="/parties"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
