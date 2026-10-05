import { redirect } from "next/navigation";

// New invoices are raised from the New Invoice tab of the invoices page; this route only keeps older links working.
export default async function NewInvoicePage(props: { searchParams: Promise<{ client?: string }> }) {
  const { client } = await props.searchParams;
  redirect(client ? `/invoices?tab=new&client=${encodeURIComponent(client)}` : "/invoices?tab=new");
}
