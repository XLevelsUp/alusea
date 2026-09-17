import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type { AuditOperation, Json } from "@/lib/supabase/types";

const OPERATION_STYLES: Record<AuditOperation, string> = {
  INSERT: "bg-green-50 text-green-700",
  UPDATE: "bg-blue-50 text-blue-700",
  DELETE: "bg-red-50 text-red-700",
};

const TABLE_LABELS: Record<string, string> = {
  invoices: "Invoice",
  invoice_items: "Invoice line",
  payments: "Payment",
  quotes: "Quotation",
  quote_items: "Quotation line",
  expenses: "Expense",
  employees: "Employee",
  payroll_runs: "Payroll run",
  payslips: "Payslip",
  parties: "Client or vendor",
  company_profile: "Company details",
  document_series: "Numbering series",
  tax_rates: "Tax rate",
  profiles: "User",
};

const PAGE_SIZE = 50;

// Values that mean nothing to a reader, or that should not be repeated on screen.
const HIDDEN_FIELDS = new Set(["party_snapshot", "pdf_path", "old_values", "new_values"]);

function describeValue(value: Json): string {
  if (value === null || value === undefined) return "empty";
  if (typeof value === "boolean") return value ? "yes" : "no";
  if (typeof value === "object") return "…";
  const text = String(value);
  return text.length > 60 ? `${text.slice(0, 57)}…` : text || "empty";
}

function changeSummary(changed: Json): { field: string; from: string; to: string }[] {
  if (!changed || typeof changed !== "object" || Array.isArray(changed)) return [];

  return Object.entries(changed)
    .filter(([field]) => !HIDDEN_FIELDS.has(field))
    .slice(0, 4)
    .map(([field, change]) => {
      const pair = change as { from?: Json; to?: Json };
      return {
        field: field.replace(/_paise$/, "").replace(/_/g, " "),
        from: describeValue(pair?.from ?? null),
        to: describeValue(pair?.to ?? null),
      };
    });
}

export default async function AuditLogPage(props: {
  searchParams: Promise<{ table?: string; page?: string }>;
}) {
  await requireRole("owner");

  const searchParams = await props.searchParams;
  const tableFilter = searchParams?.table ?? "";
  const page = Math.max(1, Number(searchParams?.page ?? "1") || 1);
  const offset = (page - 1) * PAGE_SIZE;

  const supabase = await createClient();
  let request = supabase
    .from("audit_log")
    .select("*")
    .order("created_at", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  if (tableFilter) request = request.eq("table_name", tableFilter);

  const { data: entries } = await request;
  const rows = entries ?? [];
  const hasMore = rows.length === PAGE_SIZE;

  function pageHref(target: number): string {
    const params = new URLSearchParams();
    if (tableFilter) params.set("table", tableFilter);
    if (target > 1) params.set("page", String(target));
    const query = params.toString();
    return query ? `/settings/audit?${query}` : "/settings/audit";
  }

  return (
    <div className="p-8 max-w-6xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold uppercase tracking-tight text-matte-black">Audit Log</h1>
        <p className="text-gray-500 mt-2">
          Every change to a financial record, recorded by the database itself.
        </p>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        <Link
          href="/settings/audit"
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded transition-colors ${
            !tableFilter ? "bg-matte-black text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
          }`}
        >
          Everything
        </Link>
        {["invoices", "payments", "expenses", "payslips", "profiles"].map((table) => (
          <Link
            key={table}
            href={`/settings/audit?table=${table}`}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded transition-colors ${
              tableFilter === table
                ? "bg-matte-black text-white"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            {TABLE_LABELS[table] ?? table}
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">When</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Who</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">What</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Changed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((entry) => {
                const changes = changeSummary(entry.changed_fields);

                return (
                  <tr key={entry.id} className="hover:bg-gray-50/50 transition-colors align-top">
                    <td className="p-4 text-xs text-gray-600 whitespace-nowrap">
                      {new Date(entry.created_at).toLocaleString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="p-4 text-xs text-gray-600">{entry.actor_email || "System"}</td>
                    <td className="p-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider mr-2 ${
                          OPERATION_STYLES[entry.operation]
                        }`}
                      >
                        {entry.operation === "INSERT" ? "Created" : entry.operation === "UPDATE" ? "Edited" : "Deleted"}
                      </span>
                      <span className="text-sm text-gray-900">
                        {TABLE_LABELS[entry.table_name] ?? entry.table_name}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-gray-600">
                      {changes.length > 0 ? (
                        <ul className="space-y-0.5">
                          {changes.map((change) => (
                            <li key={change.field}>
                              <span className="capitalize text-gray-500">{change.field}:</span> {change.from} →{" "}
                              <span className="text-gray-900">{change.to}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-gray-400">
                          {entry.operation === "INSERT" ? "New record" : entry.operation === "DELETE" ? "Removed" : "—"}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-500">
                    Nothing recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {(page > 1 || hasMore) && (
          <div className="p-4 border-t border-gray-100 flex justify-between items-center">
            {page > 1 ? (
              <Link href={pageHref(page - 1)} className="text-xs font-bold uppercase tracking-wider text-gray-600 hover:text-matte-black">
                ← Newer
              </Link>
            ) : (
              <span />
            )}
            <span className="text-xs text-gray-400">Page {page}</span>
            {hasMore ? (
              <Link href={pageHref(page + 1)} className="text-xs font-bold uppercase tracking-wider text-gray-600 hover:text-matte-black">
                Older →
              </Link>
            ) : (
              <span />
            )}
          </div>
        )}
      </div>

      <p className="text-xs text-gray-400 mt-6">
        Entries are written by database triggers, so a change made outside this app is recorded too. Nothing can edit or
        delete them, including an owner.
      </p>
    </div>
  );
}
