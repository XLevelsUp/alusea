import { redirect } from "next/navigation";

// The reports moved into the Analytics tab of Finances; this keeps old links and bookmarks working.
export default function ReportsPage() {
  redirect("/finances?tab=analytics");
}
