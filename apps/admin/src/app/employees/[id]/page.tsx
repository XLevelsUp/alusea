import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { formatPaise } from "@/lib/erp/money";
import { formatPeriod } from "@/lib/erp/payroll";

export default async function EmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole("owner", "hr");

  const { id } = await params;
  const supabase = await createClient();

  const [{ data: employee }, { data: history }] = await Promise.all([
    supabase.from("employees").select("*").eq("id", id).single(),
    supabase
      .from("employee_pay_history")
      .select("*")
      .eq("employee_id", id)
      .order("period_month", { ascending: false }),
  ]);

  if (!employee) notFound();

  const rows = history ?? [];
  // Flags the months where the entered amount differs from the month before, which is what "when did their pay change" means here.
  const changes = new Set<string>();
  for (let index = 0; index < rows.length - 1; index += 1) {
    if (rows[index].entered_amount_paise !== rows[index + 1].entered_amount_paise) {
      changes.add(rows[index].period_month);
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto w-full">
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <Link href="/employees" className="text-sm text-gray-500 hover:text-matte-black transition-colors">
            ← Back to Employees
          </Link>
          <h1 className="text-3xl font-bold uppercase tracking-tight text-matte-black mt-2">{employee.full_name}</h1>
          <p className="text-gray-500 mt-1 font-mono text-sm">{employee.employee_code}</p>
        </div>
        <Link
          href={`/employees?edit=${id}`}
          className="px-4 py-2.5 border border-gray-200 text-gray-600 text-xs font-bold uppercase tracking-wider rounded hover:bg-gray-50 transition-colors"
        >
          Edit
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">
            {employee.worker_type === "monthly" ? "Monthly salary" : "Daily rate"}
          </p>
          <p className="text-2xl font-bold text-matte-black">{formatPaise(employee.default_amount_paise)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Designation</p>
          <p className="text-lg text-matte-black">{employee.designation || "—"}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Joined</p>
          <p className="text-lg text-matte-black">
            {employee.joining_date
              ? new Date(employee.joining_date).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })
              : "—"}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <h2 className="text-sm font-bold uppercase tracking-wider text-matte-black">Pay history</h2>
          <p className="text-xs text-gray-400 mt-1">
            Every month this person has been paid, read from their payslips.
          </p>
        </div>

        {rows.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Period</th>
                  <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">
                    {employee.worker_type === "monthly" ? "Salary" : "Rate"}
                  </th>
                  <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Days</th>
                  <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Net paid</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((row) => (
                  <tr key={row.period_month} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-4 text-sm text-gray-900">
                      {formatPeriod(row.period_month)}
                      {row.run_status === "draft" && (
                        <span className="ml-2 text-[10px] uppercase tracking-wider text-gray-400">Draft</span>
                      )}
                    </td>
                    <td className="p-4 text-sm text-right">
                      {formatPaise(row.entered_amount_paise)}
                      {changes.has(row.period_month) && (
                        <span className="block text-[10px] uppercase tracking-wider text-[#A67C52]">Changed</span>
                      )}
                    </td>
                    <td className="p-4 text-sm text-gray-600 text-right">{Number(row.days_worked)}</td>
                    <td className="p-4 text-sm font-semibold text-right text-gray-900">{formatPaise(row.net_paise)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="p-5 text-sm text-gray-500">No payslips yet. They will appear here once a payroll run includes this person.</p>
        )}
      </div>
    </div>
  );
}
