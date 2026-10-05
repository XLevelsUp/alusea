"use client";

import type { ReactNode } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUrlState } from "@/hooks/use-url-state";

export type PageTab = {
  key: string;
  label: string;
  // A count shown beside the label when something in the tab is waiting, such as comments to moderate.
  badge?: number;
  content: ReactNode;
};

const TRIGGER =
  "h-auto flex-none rounded-none border-0 px-5 py-3 text-xs font-bold uppercase tracking-wider text-gray-500 hover:text-gray-700 data-[state=active]:text-[#A67C52] after:bg-[#A67C52] group-data-horizontal/tabs:after:bottom-[-1px]";

// Two or more closely related lists on one page. The open tab is kept in the address, so a refresh or a shared link returns to it.
export default function PageTabs({ tabs }: { tabs: PageTab[] }) {
  const [tab, setTab] = useUrlState("tab", tabs[0].key, { allowed: tabs.map((item) => item.key) });

  return (
    <Tabs value={tab} onValueChange={setTab} className="gap-6">
      <TabsList variant="line" className="h-auto w-full justify-start gap-0 rounded-none border-b border-gray-200 p-0">
        {tabs.map((item) => (
          <TabsTrigger key={item.key} value={item.key} className={TRIGGER}>
            {item.label}
            {!!item.badge && <span className="ml-1 rounded-full bg-amber-100 px-1.5 text-[11px] text-amber-800">{item.badge}</span>}
          </TabsTrigger>
        ))}
      </TabsList>
      {tabs.map((item) => (
        <TabsContent key={item.key} value={item.key}>
          {item.content}
        </TabsContent>
      ))}
    </Tabs>
  );
}
