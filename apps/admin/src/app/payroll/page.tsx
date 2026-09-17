import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { formatPaise } from "@/lib/erp/money";
import { formatPeriod, toPeriodMonth } from "@/lib/erp/payroll";
import NewRunForm from "./NewRunForm";
import { createPayrollRun } from "./actions";

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600",
  approved: "bg-blue-50 text-blue-700",
  paid: "bg-green-50 text-green-700",
};

export default async function PayrollPage() {
  const profile = await requireRole("owner", "hr", "accounts");

  const supabase = await createClient();
  const { data: runs } = await supabase
    .from("payroll_runs")
    .select("*")
    .order("period_month", { ascending: false });

  const canRun = profile.role === "owner" || profile.role === "hr";
  const thisMonth = toPeriodMonth(new Date()).slice(0, 7);
  const hasThisMonth = runs?.some((run) => run.period_month.slice(0, 7) === thisMonth);

  return (
    <div className="p-8 max-w-5xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold uppercase tracking-tight text-matte-black">Payroll</h1>
        <p className="text-gray-500 mt-2">One run a month. Enter days worked, review the total, then approve.</p>
      </div>

      {canRun && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-matte-black mb-1">Start a run</h2>
          <p className="text-xs text-gray-400 mb-4">
            {hasThisMonth
              ? "This month already has a run. Choose another month, or open the existing one below."
              : "Every active employee is added automatically, pre-filled from their stored amount."}
          </p>
          <NewRunForm defaultMonth={thisMonth} create={createPayrollRun} />
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Period</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Employees</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {runs?.map((run) => (
                <tr key={run.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-4">
                    <Link href={`/payroll/${run.id}`} className="font-semibold text-gray-900 hover:text-[#A67C52]">
                      {formatPeriod(run.period_month)}
                    </Link>
                  </td>
                  <td className="p-4">
                    <span
                      className={`inline-block px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                        STATUS_STYLES[run.status] ?? "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {run.status}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-gray-600 text-right">{run.employee_count}</td>
                  <td className="p-4 text-sm font-semibold text-right text-gray-900">{formatPaise(run.total_net_paise)}</td>
                </tr>
              ))}
              {(!runs || runs.length === 0) && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-500">
                    No payroll runs yet.
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
