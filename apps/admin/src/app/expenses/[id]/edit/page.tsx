import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth/session";
import { isOwnerLevel, roleAllowed } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { loadExpenseFormData } from "@/lib/erp/expenseFormData";
import ExpenseForm from "../../ExpenseForm";
import { updateExpense } from "../../actions";

export default async function EditExpensePage({ params }: { params: Promise<{ id: string }> }) {
  const profile = await requireProfile();

  const { id } = await params;
  const supabase = await createClient();
  const { data: expense } = await supabase.from("expenses").select("*").eq("id", id).single();

  if (!expense) notFound();

  // An approved expense is in the books, so only an approver can still touch it.
  const canApprove = isOwnerLevel(profile.role) || profile.role === "accounts";
  if (expense.status === "approved" && !canApprove) {
    redirect(`/expenses/${id}`);
  }

  const { categories, vendors, clients } = await loadExpenseFormData();

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto w-full">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight text-matte-black">Edit Expense</h1>
        <Link href={`/expenses/${id}`} className="text-sm text-gray-500 hover:text-matte-black transition-colors">
          ← Back to Expense
        </Link>
      </div>

      <ExpenseForm
        initialData={expense}
        categories={categories}
        vendors={vendors}
        clients={clients}
        save={updateExpense}
        canAddParty={roleAllowed(profile.role, ["owner", "accounts", "sales"])}
        cancelUrl={`/expenses/${id}`}
      />
    </div>
  );
}
