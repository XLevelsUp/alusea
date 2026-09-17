import Link from "next/link";
import { requireProfile } from "@/lib/auth/session";
import { loadExpenseFormData } from "@/lib/erp/expenseFormData";
import ExpenseForm from "../ExpenseForm";
import { addExpense } from "../actions";

export default async function NewExpensePage() {
  await requireProfile();

  const { categories, vendors } = await loadExpenseFormData();

  return (
    <div className="p-8 max-w-4xl mx-auto w-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold uppercase tracking-tight text-matte-black">Add Expense</h1>
          <p className="text-gray-500 mt-2">Attach the receipt on the next screen once it is saved.</p>
        </div>
        <Link href="/expenses" className="text-sm text-gray-500 hover:text-matte-black transition-colors">
          ← Back to Expenses
        </Link>
      </div>

      <ExpenseForm categories={categories} vendors={vendors} save={addExpense} cancelUrl="/expenses" />
    </div>
  );
}
