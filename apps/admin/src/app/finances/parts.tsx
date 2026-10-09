// Small display pieces shared by the Finances tabs.

import type { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPaise } from "@/lib/erp/money";

export const TH = "p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider";

export function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function Tile({ label, paise, note, tone }: { label: string; paise: number; note?: string; tone?: "good" | "bad" | "warn" }) {
  const colour =
    tone === "good" ? "text-green-700" : tone === "bad" ? "text-red-600" : tone === "warn" ? "text-amber-700" : "text-matte-black";
  return (
    <Card>
      <CardContent>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className={`mt-2 text-2xl font-bold ${colour}`}>{formatPaise(paise)}</p>
        {note && <p className="mt-1 text-xs text-muted-foreground">{note}</p>}
      </CardContent>
    </Card>
  );
}

export function Section({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card className="gap-0 py-0 mb-6">
      <CardHeader className="p-5 border-b flex flex-row items-start justify-between gap-4 flex-wrap">
        <div>
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-matte-black">{title}</CardTitle>
          {description && <CardDescription className="text-xs mt-1">{description}</CardDescription>}
        </div>
        {action && <div className="flex gap-2 flex-wrap">{action}</div>}
      </CardHeader>
      {children}
    </Card>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="p-5 text-sm text-gray-500">{children}</p>;
}

// A horizontal bar for breakdowns, scaled against the largest value in its list.
export function Bar({ label, paise, max, colour = "bg-[#A67C52]" }: { label: string; paise: number; max: number; colour?: string }) {
  return (
    <li>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-700">{label}</span>
        <span className="font-semibold text-gray-900">{formatPaise(paise)}</span>
      </div>
      <div className="h-2 rounded-full bg-gray-100" aria-hidden="true">
        <div className={`h-2 rounded-full ${colour}`} style={{ width: `${Math.max(2, (paise / Math.max(1, max)) * 100)}%` }} />
      </div>
    </li>
  );
}

// Builds a CSV in the browser and downloads it, guarding cells that Excel would otherwise run as formulas.
export function downloadCsv(filename: string, header: string[], rows: (string | number)[][]) {
  const cell = (value: string | number) => {
    const text = String(value ?? "");
    const safe = /^[=+\-@]/.test(text) ? `'${text}` : text;
    return `"${safe.replace(/"/g, '""')}"`;
  };
  const csv = "﻿" + [header, ...rows].map((row) => row.map(cell).join(",")).join("\r\n") + "\r\n";
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
