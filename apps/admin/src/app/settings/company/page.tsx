import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import CompanyForm from "./CompanyForm";
import { updateCompanyProfile } from "./actions";

export default async function CompanySettingsPage() {
  await requireRole("owner");

  const supabase = await createClient();
  const { data: profile } = await supabase.from("company_profile").select("*").eq("id", 1).single();

  if (!profile) {
    return (
      <div className="p-8 max-w-3xl mx-auto w-full">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mt-16 text-center">
          <h1 className="text-xl font-bold uppercase tracking-tight text-matte-black mb-2">Company profile missing</h1>
          <p className="text-gray-500 text-sm">Run the Phase 2 migrations, which seed this row.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold uppercase tracking-tight text-matte-black">Company Details</h1>
        <p className="text-gray-500 mt-2">Your business identity, as it appears on invoices, quotations and payslips.</p>
      </div>

      <CompanyForm profile={profile} save={updateCompanyProfile} />
    </div>
  );
}
