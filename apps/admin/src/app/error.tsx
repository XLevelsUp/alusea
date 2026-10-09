"use client";

import { usePathname } from "next/navigation";
import ErrorState from "@/components/ErrorState";

// Keyed by the first URL segment, so one boundary can name whichever section failed and link back to its list.
// Sections without a backHref (dashboard, settings) have no single list to return to, so they fall back to home.
const SECTIONS: Record<string, { label: string; backHref?: string }> = {
  blog: { label: "the blog", backHref: "/blog" },
  catalogue: { label: "the catalogue", backHref: "/catalogue" },
  categories: { label: "categories", backHref: "/categories" },
  dashboard: { label: "the dashboard" },
  employees: { label: "employees", backHref: "/employees" },
  expenses: { label: "expenses", backHref: "/expenses" },
  finances: { label: "finances", backHref: "/finances" },
  invoices: { label: "invoices", backHref: "/invoices" },
  media: { label: "page media", backHref: "/media" },
  parties: { label: "clients and vendors", backHref: "/parties" },
  payroll: { label: "payroll", backHref: "/payroll" },
  quotes: { label: "quotations", backHref: "/quotes" },
  settings: { label: "settings" },
};

export default function RouteError(props: { error: Error & { digest?: string }; reset: () => void }) {
  const pathname = usePathname();
  const section = SECTIONS[pathname.split("/")[1] ?? ""];

  return <ErrorState {...props} section={section?.label} backHref={section?.backHref} />;
}
