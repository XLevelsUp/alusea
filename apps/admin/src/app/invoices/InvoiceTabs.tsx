"use client";

import type { ReactNode } from "react";
import { useUrlState } from "@/hooks/use-url-state";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Tab = "new" | "history";

const TRIGGER =
  "h-auto flex-none rounded-none border-0 px-5 py-3 text-xs font-bold uppercase tracking-wider text-gray-500 hover:text-gray-700 data-[state=active]:text-[#A67C52] after:bg-[#A67C52] group-data-horizontal/tabs:after:bottom-[-1px]";

// The two halves of invoicing on one page; switching is client-side, so neither tab waits on the server.
export default function InvoiceTabs({
  initialTab,
  newInvoice,
  history,
}: {
  initialTab: Tab;
  // Omitted for roles that can read invoices but not raise them.
  newInvoice?: ReactNode;
  history: ReactNode;
}) {
  // Kept in the address, so coming back from an invoice returns to the tab that was open.
  const [tab, setTab] = useUrlState<Tab>("tab", newInvoice ? initialTab : "history", { allowed: ["new", "history"], always: true });

  if (!newInvoice) return <>{history}</>;

  return (
    <Tabs value={tab} onValueChange={(value) => setTab(value as Tab)} className="gap-6">
      <TabsList variant="line" className="h-auto w-full justify-start gap-0 rounded-none border-b border-gray-200 p-0">
        <TabsTrigger value="new" className={TRIGGER}>
          New Invoice
        </TabsTrigger>
        <TabsTrigger value="history" className={TRIGGER}>
          Invoice History
        </TabsTrigger>
      </TabsList>

      {/* Kept mounted while hidden, so a half-written invoice survives a look at the history. */}
      <TabsContent value="new" forceMount className="data-[state=inactive]:hidden">
        {newInvoice}
      </TabsContent>
      <TabsContent value="history">{history}</TabsContent>
    </Tabs>
  );
}
