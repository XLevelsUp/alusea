import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { formatPaise } from "@/lib/erp/money";
import EmployeeForm from "./EmployeeForm";
import StatusToggleButton from "@/components/StatusToggleButton";
import { addEmployee, updateEmployee, setEmployeeActive } from "./actions";

export default async function EmployeesPage(props: {
  searchParams: Promise<{ add?: string; edit?: string; show?: string }>;
}) {
  await requireRole("owner", "hr");

  const searchParams = await props.searchParams;
  const isAddOpen = searchParams?.add === "true";
  const editId = searchParams?.edit;
  const showInactive = searchParams?.show === "all";

  const supabase = await createClient();
  let request = supabase.from("employees").select("*").order("employee_code");
  if (!showInactive) request = request.eq("is_active", true);

  const { data: employees } = await request;

  const editingEmployee = editId ? employees?.find((employee) => employee.id === editId) : undefined;
  const isModalOpen = isAddOpen || !!editingEmployee;

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
        <Link
          href="/employees?add=true"
          className="inline-flex items-center justify-center px-5 py-3 bg-[#A67C52] text-white text-xs font-bold uppercase tracking-wider rounded-sm hover:bg-[#8e6944] transition-colors shadow-md"
        >
          + Add Employee
        </Link>
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
                      <Link
                        href={`/employees?edit=${employee.id}`}
                        className="text-blue-500 hover:text-blue-700 text-xs font-semibold uppercase tracking-wider px-3 py-1 border border-blue-200 hover:bg-blue-50 rounded transition-colors"
                      >
                        Edit
                      </Link>
                      <StatusToggleButton
                        id={employee.id}
                        isActive={employee.is_active}
                        setActive={setEmployeeActive}
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

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-100 max-w-2xl w-full max-h-[90vh] flex flex-col relative">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold uppercase tracking-wider text-matte-black">
                {editingEmployee ? "Edit Employee" : "Add Employee"}
              </h2>
              <Link href="/employees" className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-matte-black">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Link>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <EmployeeForm
                key={editId ?? "new"}
                initialData={editingEmployee}
                add={addEmployee}
                update={updateEmployee}
                cancelUrl="/employees"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
