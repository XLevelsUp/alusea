import Link from "next/link";
import { requireProfile } from "@/lib/auth/session";
import { roleAllowed } from "@/lib/auth/roles";
import { loadExpenseFormData } from "@/lib/erp/expenseFormData";
import ExpenseForm from "../ExpenseForm";
import { addExpense } from "../actions";

export default async function NewExpensePage(props: { searchParams: Promise<{ client?: string }> }) {
  const profile = await requireProfile();

  // ?client=<id> arrives from a client's page, so the expense starts already tagged to them and returns there on cancel.
  const { client } = await props.searchParams;
  const { categories, vendors, clients } = await loadExpenseFormData();
  const fromClient = clients.find((option) => option.id === client);

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto w-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight text-matte-black">Add Expense</h1>
          <p className="text-gray-500 mt-2">Attach the receipt here, or add more on the next screen.</p>
        </div>
        <Link href="/expenses" className="text-sm text-gray-500 hover:text-matte-black transition-colors">
          ← Back to Expenses
        </Link>
      </div>

      <ExpenseForm
        categories={categories}
        vendors={vendors}
        clients={clients}
        defaultClientId={fromClient?.id}
        save={addExpense}
        canAddParty={roleAllowed(profile.role, ["owner", "accounts", "sales"])}
        cancelUrl={fromClient ? `/parties/${fromClient.id}` : "/expenses"}
      />
    </div>
  );
}
