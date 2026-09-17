import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { formatPaise } from "@/lib/erp/money";
import { formatPeriod } from "@/lib/erp/payroll";
import { loadDashboard, AGEING_LABELS, currentPeriodMonth } from "@/lib/erp/dashboard";

function changeLabel(current: number, previous: number): { text: string; tone: string } | null {
  if (previous === 0) return null;
  const percent = Math.round(((current - previous) / Math.abs(previous)) * 100);
  if (percent === 0) return { text: "level with last month", tone: "text-gray-400" };
  return {
    text: `${percent > 0 ? "+" : ""}${percent}% vs last month`,
    tone: percent > 0 ? "text-green-600" : "text-red-600",
  };
}

function StatCard({
  label,
  value,
  sub,
  subTone = "text-gray-400",
  href,
}: {
  label: string;
  value: string;
  sub?: string;
  subTone?: string;
  href?: string;
}) {
  const body = (
    <>
      <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">{label}</p>
      <p className="text-2xl font-bold text-matte-black">{value}</p>
      {sub && <p className={`text-xs mt-1 ${subTone}`}>{sub}</p>}
    </>
  );

  const className = "bg-white rounded-xl shadow-sm border border-gray-100 p-5 block";

  return href ? (
    <Link href={href} className={`${className} hover:border-[#A67C52]/40 transition-colors`}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}

export default async function DashboardPage() {
  const profile = await requireRole("owner", "accounts");
  const data = await loadDashboard();

  const revenueChange = changeLabel(data.thisMonth.revenuePaise, data.lastMonth.revenuePaise);
  const thisMonthLabel = formatPeriod(currentPeriodMonth());

  // The trend bars are scaled against the largest figure across all months, so the months stay comparable.
  const trendMax = Math.max(
    1,
    ...data.trend.flatMap((row) => [row.revenuePaise, row.expensesPaise + row.payrollPaise])
  );

  return (
    <div className="p-8 max-w-7xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold uppercase tracking-tight text-matte-black">Dashboard</h1>
        <p className="text-gray-500 mt-2">{thisMonthLabel} so far, and how it compares.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Revenue this month"
          value={formatPaise(data.thisMonth.revenuePaise)}
          sub={revenueChange?.text}
          subTone={revenueChange?.tone}
          href="/invoices"
        />
        <StatCard
          label="Collected this month"
          value={formatPaise(data.thisMonth.collectedPaise)}
          sub="Money actually received"
        />
        <StatCard
          label="Outstanding"
          value={formatPaise(data.receivables.totalPaise)}
          sub={
            data.receivables.overduePaise > 0
              ? `${formatPaise(data.receivables.overduePaise)} overdue`
              : "Nothing overdue"
          }
          subTone={data.receivables.overduePaise > 0 ? "text-red-600" : "text-gray-400"}
          href="/invoices?filter=unpaid"
        />
        <StatCard
          label="Profit this month"
          value={formatPaise(data.thisMonth.profitPaise)}
          sub="Revenue less expenses and payroll"
          subTone={data.thisMonth.profitPaise < 0 ? "text-red-600" : "text-gray-400"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-matte-black mb-1">
            Revenue against costs
          </h2>
          <p className="text-xs text-gray-400 mb-5">Last six months. Revenue and expenses are both net of GST.</p>

          {data.trend.length > 0 ? (
            <div className="space-y-4">
              {data.trend.map((row) => {
                const costs = row.expensesPaise + row.payrollPaise;
                return (
                  <div key={row.periodMonth}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-gray-600">{formatPeriod(row.periodMonth)}</span>
                      <span className={row.profitPaise < 0 ? "text-red-600" : "text-gray-900"}>
                        {formatPaise(row.profitPaise)}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="h-2.5 bg-gray-100 rounded overflow-hidden">
                        <div
                          className="h-full bg-[#A67C52]"
                          style={{ width: `${Math.round((row.revenuePaise / trendMax) * 100)}%` }}
                        />
                      </div>
                      <div className="h-2.5 bg-gray-100 rounded overflow-hidden">
                        <div
                          className="h-full bg-gray-400"
                          style={{ width: `${Math.round((costs / trendMax) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
              <div className="flex gap-4 pt-2 text-xs text-gray-500">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-2.5 bg-[#A67C52] rounded-sm inline-block" /> Revenue
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-2.5 bg-gray-400 rounded-sm inline-block" /> Expenses and payroll
                </span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              Nothing to chart yet. Issue an invoice or record an expense to get started.
            </p>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-matte-black mb-1">Who owes us</h2>
          <p className="text-xs text-gray-400 mb-5">Unpaid balances by age.</p>

          {data.receivables.buckets.length > 0 ? (
            <div className="space-y-3">
              {data.receivables.buckets.map((bucket) => (
                <div key={bucket.bucket} className="flex justify-between items-baseline">
                  <div>
                    <p
                      className={`text-sm ${
                        bucket.bucket === "over_90"
                          ? "text-red-600 font-semibold"
                          : bucket.bucket === "current"
                            ? "text-gray-500"
                            : "text-gray-900"
                      }`}
                    >
                      {AGEING_LABELS[bucket.bucket]}
                    </p>
                    <p className="text-xs text-gray-400">
                      {bucket.count} invoice{bucket.count === 1 ? "" : "s"}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">{formatPaise(bucket.totalPaise)}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">Nothing outstanding.</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-matte-black mb-1">Needs attention</h2>
          <p className="text-xs text-gray-400 mb-5">Things sitting unfinished.</p>

          <div className="space-y-3">
            {data.pendingExpensesPaise > 0 && (
              <Link
                href="/expenses?status=submitted"
                className="flex justify-between items-center text-sm hover:text-[#A67C52] transition-colors"
              >
                <span className="text-gray-600">Expenses awaiting approval</span>
                <span className="font-semibold text-gray-900">{formatPaise(data.pendingExpensesPaise)}</span>
              </Link>
            )}
            {data.draftInvoiceCount > 0 && (
              <Link
                href="/invoices?filter=draft"
                className="flex justify-between items-center text-sm hover:text-[#A67C52] transition-colors"
              >
                <span className="text-gray-600">Draft invoices not yet issued</span>
                <span className="font-semibold">{data.draftInvoiceCount}</span>
              </Link>
            )}
            {data.pendingExpensesPaise === 0 && data.draftInvoiceCount === 0 && (
              <p className="text-sm text-gray-500">Nothing waiting.</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-matte-black mb-1">Spending this month</h2>
          <p className="text-xs text-gray-400 mb-5">Approved expenses by category.</p>

          {data.topCategories.length > 0 ? (
            <div className="space-y-2">
              {data.topCategories.map((category) => (
                <div key={category.name} className="flex justify-between text-sm">
                  <span className="text-gray-600">{category.name}</span>
                  <span className="font-semibold text-gray-900">{formatPaise(category.totalPaise)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No approved expenses this month.</p>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-matte-black mb-1">This month in full</h2>
          <p className="text-xs text-gray-400 mb-5">{thisMonthLabel}.</p>

          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-600">Revenue</dt>
              <dd className="text-gray-900">{formatPaise(data.thisMonth.revenuePaise)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">Expenses</dt>
              <dd className="text-gray-600">−{formatPaise(data.thisMonth.expensesPaise)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">Payroll</dt>
              <dd className="text-gray-600">−{formatPaise(data.thisMonth.payrollPaise)}</dd>
            </div>
            <div className="flex justify-between pt-2 border-t border-gray-100 font-semibold">
              <dt>Profit</dt>
              <dd className={data.thisMonth.profitPaise < 0 ? "text-red-600" : ""}>
                {formatPaise(data.thisMonth.profitPaise)}
              </dd>
            </div>
          </dl>

          {profile.role === "owner" && (
            <Link
              href="/reports"
              className="inline-block mt-5 text-xs font-bold uppercase tracking-wider text-[#A67C52] hover:underline"
            >
              Full reports →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
