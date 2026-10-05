import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { isOwnerLevel } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { formatPaise } from "@/lib/erp/money";
import { calendarDaysInMonth, formatPeriod, sundaysInMonth, workingDaysInMonth } from "@/lib/erp/payroll";
import { createAdminClient } from "@/lib/supabase/admin";
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

  const canWrite = isOwnerLevel(profile.role) || profile.role === "hr";
  const isDraft = run.status === "draft";

  // accounts can see run totals for cashflow but not who was paid what, so the grid is hidden from them.
  const canSeeDetail = isOwnerLevel(profile.role) || profile.role === "hr";

  const employeeIds = (payslips ?? []).map((slip) => slip.employee_id);
  const { data: employees } = employeeIds.length
    ? await supabase.from("employees").select("id, default_amount_paise").in("id", employeeIds)
    : { data: [] };

  const defaultById = new Map((employees ?? []).map((employee) => [employee.id, employee.default_amount_paise]));

  // Runs created since Sundays were excluded store the month's working days; older runs stored a flat 30 and say so.
  const usesWorkingDays = run.days_in_period === workingDaysInMonth(run.period_month);
  const dayBasisNote = usesWorkingDays
    ? `${calendarDaysInMonth(run.period_month)} days − ${sundaysInMonth(run.period_month)} Sundays`
    : "Flat day basis from before Sundays were excluded";

  // Names for the trail. Profiles are readable only by their owner, so they are looked up with the service client, limited to the people on this run.
  const actorIds = [run.created_by, run.approved_by, run.paid_by].filter((value): value is string => !!value);
  let actors: { id: string; full_name: string; email: string }[] = [];
  if (actorIds.length > 0) {
    try {
      const { data } = await createAdminClient().from("profiles").select("id, full_name, email").in("id", actorIds);
      actors = data ?? [];
    } catch {
      // Without the service key the trail still shows the dates, just not the names.
    }
  }
  const nameOf = (userId: string | null) => {
    const actor = actors.find((row) => row.id === userId);
    return actor ? actor.full_name || actor.email : "";
  };
  const formatDate = (value: string) =>
    new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  const trail = [
    { label: "Generated", at: run.created_at, by: nameOf(run.created_by) },
    { label: "Approved", at: run.approved_at, by: nameOf(run.approved_by) },
    { label: "Paid", at: run.paid_at, by: nameOf(run.paid_by) },
  ];

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto w-full">
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <Link href="/payroll" className="text-sm text-gray-500 hover:text-matte-black transition-colors">
            ← Back to Payroll
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight text-matte-black mt-2">
            {formatPeriod(run.period_month)}
          </h1>
          <span
            className={`inline-block mt-2 px-2 py-1 rounded text-[11px] font-bold uppercase tracking-wider ${
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
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">{usesWorkingDays ? "Working days" : "Day basis"}</p>
          <p className="text-2xl font-bold text-matte-black">{run.days_in_period}</p>
          <p className="text-xs text-gray-500 mt-1">{dayBasisNote}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
        <h2 className="text-sm font-bold uppercase tracking-wider text-matte-black mb-3">Trail</h2>
        <ol className="flex flex-col sm:flex-row sm:gap-8 gap-2">
          {trail.map((step) => (
            <li key={step.label} className="flex items-start gap-2 text-sm">
              <span className={`mt-1.5 size-2.5 shrink-0 rounded-full ${step.at ? "bg-green-500" : "bg-gray-200"}`} aria-hidden="true" />
              <span className={step.at ? "text-gray-900" : "text-gray-500"}>
                <span className="font-semibold">{step.label}</span>
                {step.at ? (
                  <span className="block text-xs text-gray-500">
                    {formatDate(step.at)}
                    {step.by && <> by {step.by}</>}
                  </span>
                ) : (
                  <span className="block text-xs">Not yet</span>
                )}
              </span>
            </li>
          ))}
        </ol>
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
          <p className="text-sm text-gray-500 mt-1">The run total above is what you need for cashflow.</p>
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
