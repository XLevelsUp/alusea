import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { formatPaise } from "@/lib/erp/money";
import { formatPeriod } from "@/lib/erp/payroll";
import PayrollGrid from "./PayrollGrid";
import RunActions from "./RunActions";
import {
  savePayrollEntries,
  approvePayrollRun,
  markPayrollPaid,
  regeneratePayslips,
  deletePayrollRun,
} from "../actions";

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600",
  approved: "bg-blue-50 text-blue-700",
  paid: "bg-green-50 text-green-700",
};

export default async function PayrollRunPage({ params }: { params: Promise<{ id: string }> }) {
  const profile = await requireRole("owner", "hr", "accounts");
  const { id } = await params;

  const supabase = await createClient();
  const [{ data: run }, { data: payslips }] = await Promise.all([
    supabase.from("payroll_runs").select("*").eq("id", id).single(),
    supabase.from("payslips").select("*").eq("run_id", id).order("employee_code"),
  ]);

  if (!run) notFound();

  const canWrite = profile.role === "owner" || profile.role === "hr";
  const isDraft = run.status === "draft";

  // accounts can see run totals for cashflow but not who was paid what, so the grid is hidden from them.
  const canSeeDetail = profile.role === "owner" || profile.role === "hr";

  const employeeIds = (payslips ?? []).map((slip) => slip.employee_id);
  const { data: employees } = employeeIds.length
    ? await supabase.from("employees").select("id, default_amount_paise").in("id", employeeIds)
    : { data: [] };

  const defaultById = new Map((employees ?? []).map((employee) => [employee.id, employee.default_amount_paise]));

  return (
    <div className="p-8 max-w-6xl mx-auto w-full">
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <Link href="/payroll" className="text-sm text-gray-500 hover:text-matte-black transition-colors">
            ← Back to Payroll
          </Link>
          <h1 className="text-3xl font-bold uppercase tracking-tight text-matte-black mt-2">
            {formatPeriod(run.period_month)}
          </h1>
          <span
            className={`inline-block mt-2 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
              STATUS_STYLES[run.status] ?? "bg-gray-100 text-gray-600"
            }`}
          >
            {run.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Employees</p>
          <p className="text-2xl font-bold text-matte-black">{run.employee_count}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Total payable</p>
          <p className="text-2xl font-bold text-matte-black">{formatPaise(run.total_net_paise)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Day basis</p>
          <p className="text-2xl font-bold text-matte-black">{run.days_in_period}</p>
        </div>
      </div>

      <div className="mb-6">
        <RunActions
          runId={id}
          status={run.status}
          canWrite={canWrite}
          approve={approvePayrollRun}
          markPaid={markPayrollPaid}
          regenerate={regeneratePayslips}
          remove={deletePayrollRun}
        />
      </div>

      {!canSeeDetail ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
          <p className="text-gray-600">Individual pay is visible to owners and HR only.</p>
          <p className="text-sm text-gray-400 mt-1">The run total above is what you need for cashflow.</p>
        </div>
      ) : isDraft && canWrite ? (
        <PayrollGrid
          runId={id}
          daysInPeriod={run.days_in_period}
          notes={run.notes}
          save={savePayrollEntries}
          initialRows={(payslips ?? []).map((slip) => ({
            id: slip.id,
            employeeId: slip.employee_id,
            code: slip.employee_code,
            name: slip.employee_name,
            designation: slip.designation,
            workerType: slip.worker_type,
            daysWorked: slip.days_worked ? String(Number(slip.days_worked)) : "",
            amount: (slip.entered_amount_paise / 100).toFixed(2),
            overtime: slip.overtime_paise ? (slip.overtime_paise / 100).toFixed(2) : "",
            bonus: slip.bonus_paise ? (slip.bonus_paise / 100).toFixed(2) : "",
            storedDefaultPaise: defaultById.get(slip.employee_id) ?? slip.entered_amount_paise,
          }))}
        />
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Employee</th>
                  <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Days</th>
                  <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Base</th>
                  <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">OT</th>
                  <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Bonus</th>
                  <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Net</th>
                  <th className="p-4" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {payslips?.map((slip) => (
                  <tr key={slip.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-4">
                      <span className="font-semibold text-gray-900 text-sm block">{slip.employee_name}</span>
                      <span className="text-xs text-gray-500 font-mono">{slip.employee_code}</span>
                    </td>
                    <td className="p-4 text-sm text-gray-600 text-right">{Number(slip.days_worked)}</td>
                    <td className="p-4 text-sm text-gray-600 text-right">{formatPaise(slip.base_paise)}</td>
                    <td className="p-4 text-sm text-gray-600 text-right">{formatPaise(slip.overtime_paise)}</td>
                    <td className="p-4 text-sm text-gray-600 text-right">{formatPaise(slip.bonus_paise)}</td>
                    <td className="p-4 text-sm font-semibold text-right text-gray-900">{formatPaise(slip.net_paise)}</td>
                    <td className="p-4 text-right">
                      {slip.pdf_path && (
                        <a
                          href={`/payroll/${id}/payslip/${slip.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-semibold uppercase tracking-wider text-[#A67C52] hover:underline"
                        >
                          PDF
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 border-t border-gray-200">
                  <td colSpan={5} className="p-4 text-sm font-bold uppercase tracking-wide text-right">
                    Total
                  </td>
                  <td className="p-4 text-lg font-bold text-right text-gray-900">{formatPaise(run.total_net_paise)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
