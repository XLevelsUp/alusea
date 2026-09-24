import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { formatPaise } from "@/lib/erp/money";
import EmployeeForm from "./EmployeeForm";
import StatusToggleButton from "@/components/StatusToggleButton";
import { FormDialog } from "@/components/FormDialog";
import { Button } from "@/components/ui/button";
import { addEmployee, updateEmployee, setEmployeeActive } from "./actions";

export default async function EmployeesPage(props: {
  searchParams: Promise<{ show?: string }>;
}) {
  await requireRole("owner", "hr");

  const searchParams = await props.searchParams;
  const showInactive = searchParams?.show === "all";

  const supabase = await createClient();
  let request = supabase.from("employees").select("*").order("employee_code");
  if (!showInactive) request = request.eq("is_active", true);

  const { data: employees } = await request;

  const monthlyCount = employees?.filter((e) => e.worker_type === "monthly").length ?? 0;
  const dailyCount = employees?.filter((e) => e.worker_type === "daily").length ?? 0;

  return (
    <div className="p-8 max-w-6xl mx-auto w-full relative">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold uppercase tracking-tight text-matte-black">Employees</h1>
          <p className="text-gray-500 mt-2">
            {monthlyCount} on monthly salary, {dailyCount} on a daily rate.
          </p>
        </div>
        <FormDialog title="Add Employee" trigger={<Button type="button" variant="brand">+ Add Employee</Button>}>
          <EmployeeForm add={addEmployee} update={updateEmployee} />
        </FormDialog>
      </div>

      <div className="flex gap-2 mb-6">
        <Link
          href="/employees"
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded transition-colors ${
            !showInactive ? "bg-matte-black text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
          }`}
        >
          Active
        </Link>
        <Link
          href="/employees?show=all"
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded transition-colors ${
            showInactive ? "bg-matte-black text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
          }`}
        >
          All
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Code</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Pay type</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Amount</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {employees?.map((employee) => (
                <tr
                  key={employee.id}
                  className={`hover:bg-gray-50/50 transition-colors ${employee.is_active ? "" : "opacity-50"}`}
                >
                  <td className="p-4 font-mono text-xs text-gray-600">{employee.employee_code}</td>
                  <td className="p-4">
                    <Link href={`/employees/${employee.id}`} className="font-semibold text-gray-900 hover:text-[#A67C52]">
                      {employee.full_name}
                    </Link>
                    {employee.designation && <span className="block text-xs text-gray-500">{employee.designation}</span>}
                    {!employee.is_active && (
                      <span className="text-[10px] uppercase tracking-wider text-gray-400">Inactive</span>
                    )}
                  </td>
                  <td className="p-4">
                    <span
                      className={`inline-block px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                        employee.worker_type === "monthly" ? "bg-blue-50 text-blue-700" : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {employee.worker_type === "monthly" ? "Monthly" : "Daily"}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-right">
                    <span className="font-semibold text-gray-900">{formatPaise(employee.default_amount_paise)}</span>
                    <span className="block text-xs text-gray-400">
                      {employee.worker_type === "monthly" ? "per month" : "per day"}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-start justify-end gap-2">
                      <FormDialog title="Edit Employee" trigger={<Button type="button" variant="outline" size="sm" className="border-blue-200 text-blue-500 hover:bg-blue-50 hover:text-blue-700">Edit</Button>}>
                        <EmployeeForm initialData={employee} add={addEmployee} update={updateEmployee} />
                      </FormDialog>
                      <StatusToggleButton
                        id={employee.id}
                        isActive={employee.is_active}
                        setActive={setEmployeeActive}
                        name={employee.full_name}
                        itemLabel="employee"
                        deactivateNote="They will be left out of new payroll runs. Their past payslips and pay history stay on record."
                      />
                    </div>
                  </td>
                </tr>
              ))}
              {(!employees || employees.length === 0) && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">
                    No employees yet. Add one to get started with payroll.
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
