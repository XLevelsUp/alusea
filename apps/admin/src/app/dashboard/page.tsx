import Link from "next/link";
import type { ComponentType } from "react";
import { CheckCircle2Icon, ChevronRightIcon, PackageIcon, PlusIcon, TruckIcon, UsersIcon } from "lucide-react";
import { FormDialog } from "@/components/FormDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/session";
import { currentPeriodMonth, loadDashboard } from "@/lib/erp/dashboard";
import { formatPaise } from "@/lib/erp/money";
import { formatPeriod } from "@/lib/erp/payroll";
import PartyForm from "@/app/parties/PartyForm";
import { addParty, updateParty } from "@/app/parties/actions";

type Tile = {
  label: string;
  value: number | null;
  // A ready-made figure such as a rupee amount, shown in place of the count.
  display?: string;
  // Left out for a money tile, whose figure needs the full width.
  icon?: ComponentType<{ className?: string }>;
  tone?: "warn";
  href?: string;
  note?: string;
};

function StatTile({ label, value, display, icon: Icon, href, note, tone }: Tile) {
  const body = (
    <Card className="h-full transition-colors group-hover:border-[#A67C52]/40">
      <CardContent className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className={`mt-2 font-bold ${display ? "text-2xl" : "text-3xl"} ${tone === "warn" ? "text-amber-700" : "text-matte-black"}`}>
            {display ?? value ?? "—"}
          </p>
          {note && <p className="mt-1 text-xs text-muted-foreground">{note}</p>}
        </div>
        {Icon && (
          <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-[#A67C52]/10 text-[#A67C52]" aria-hidden="true">
            <Icon className="size-5" />
          </span>
        )}
      </CardContent>
    </Card>
  );

  return href ? (
    <Link href={href} className="group block focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 rounded-xl">
      {body}
    </Link>
  ) : (
    <div className="opacity-60">{body}</div>
  );
}

export default async function DashboardPage() {
  const profile = await requireRole("owner", "accounts");
  const data = await loadDashboard();

  const tiles: Tile[] = [
    {
      label: "Clients still owe",
      value: null,
      display: formatPaise(data.outstanding.paise),
      note: data.outstanding.count === 0 ? "Every invoice is paid" : `Across ${data.outstanding.count} unpaid ${data.outstanding.count === 1 ? "invoice" : "invoices"}`,
      tone: data.outstanding.paise > 0 ? "warn" : undefined,
      href: "/finances?tab=income",
    },
    { label: "Total clients", value: data.clients, icon: UsersIcon, href: "/parties?filter=clients&status=active" },
    { label: "Total vendors", value: data.vendors, icon: TruckIcon, href: "/parties?filter=vendors&status=active" },
    { label: "Total products", value: data.products, icon: PackageIcon, href: "/catalogue" },
  ];

  const money = [
    { label: "Billed", paise: data.thisMonth.billedPaise, note: "Invoices issued this month" },
    { label: "Collected", paise: data.thisMonth.collectedPaise, note: "Payments received this month" },
    { label: "Spent", paise: data.thisMonth.spentPaise, note: "Approved expenses plus payroll" },
  ];

  const waiting = data.waiting.filter((item) => item.count > 0);

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight text-matte-black">Dashboard</h1>
        <p className="text-gray-500 mt-2">Welcome back{profile.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}. Here is where things stand.</p>
      </div>

      <section aria-label="Totals" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {tiles.map((tile) => (
          <StatTile key={tile.label} {...tile} />
        ))}
      </section>

      <nav aria-label="Quick actions" className="flex flex-wrap gap-3 mb-8">
        <Button asChild variant="brand">
          <Link href="/invoices?tab=new">
            <PlusIcon aria-hidden="true" />
            New Invoice
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/expenses/new">
            <PlusIcon aria-hidden="true" />
            Add Expense
          </Link>
        </Button>
        <FormDialog
          title="Add Client or Vendor"
          trigger={
            <Button type="button" variant="outline">
              <PlusIcon aria-hidden="true" />
              Add Client or Vendor
            </Button>
          }
        >
          <PartyForm add={addParty} update={updateParty} />
        </FormDialog>
      </nav>

      <Card className="mb-8">
        <CardHeader className="border-b">
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-matte-black">
            This month · {formatPeriod(currentPeriodMonth())}
          </CardTitle>
          <CardDescription className="text-xs">All three include GST, so they compare like for like.</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {money.map((figure) => (
              <div key={figure.label}>
                <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{figure.label}</dt>
                <dd className="mt-1 text-2xl font-bold text-matte-black">{formatPaise(figure.paise)}</dd>
                <dd className="text-xs text-muted-foreground mt-1">{figure.note}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b">
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-matte-black">Waiting on you</CardTitle>
          <CardDescription className="text-xs">Things that need a decision or a follow-up.</CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          {waiting.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-center">
              <CheckCircle2Icon className="size-10 text-green-600 mb-3" aria-hidden="true" />
              <p className="font-semibold text-gray-900">All caught up</p>
              <p className="text-sm text-muted-foreground mt-1">Nothing is waiting for approval or follow-up right now.</p>
            </div>
          ) : (
            <ul className="divide-y">
              {waiting.map((item) => (
                <li key={item.key}>
                  <Link
                    href={item.href}
                    className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors focus-visible:outline-none focus-visible:bg-gray-50"
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#A67C52]/10 text-sm font-bold text-[#A67C52]">
                      {item.count}
                    </span>
                    <span className="flex-1 text-sm font-medium text-gray-900">{item.label}</span>
                    {item.amountPaise ? (
                      <span className="text-sm font-semibold text-gray-700">{formatPaise(item.amountPaise)}</span>
                    ) : null}
                    <ChevronRightIcon className="size-4 text-gray-500" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
