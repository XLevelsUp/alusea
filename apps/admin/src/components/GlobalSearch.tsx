"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { SearchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { globalSearch, type SearchResult } from "@/app/search/actions";

type Page = { href: string; label: string };

const GROUPS: SearchResult["group"][] = ["Clients & vendors", "Invoices", "Expenses", "Employees"];

// One search box for the whole app: type a client, an invoice number, an expense or a page name and jump straight to it.
export default function GlobalSearch({ pages, compact = false }: { pages: Page[]; compact?: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Only the answer to the latest thing typed is shown, even if an earlier, slower one arrives after it.
  const latest = useRef(0);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      // Browser autofill fires key events with no key at all, so the key is checked before it is read.
      if (event.key?.toLowerCase() === "k" && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        setOpen((value) => !value);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    const term = query.trim();
    const ticket = ++latest.current;
    if (term.length < 2) return;

    const timer = setTimeout(async () => {
      setIsSearching(true);
      const result = await globalSearch(term).catch(() => ({ ok: false as const, error: "Could not reach the server." }));
      if (ticket !== latest.current) return;
      setIsSearching(false);
      setError(result.ok ? null : result.error);
      setResults(result.ok ? result.data : []);
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setQuery("");
      setResults([]);
      setError(null);
    }
  }

  function go(href: string) {
    onOpenChange(false);
    router.push(href);
  }

  const term = query.trim().toLowerCase();
  const typedEnough = term.length >= 2;
  const matchingPages = term ? pages.filter((page) => page.label.toLowerCase().includes(term)) : pages;
  const shown = typedEnough ? results : [];
  const nothingFound = typedEnough && !isSearching && !error && shown.length === 0 && matchingPages.length === 0;

  return (
    <>
      {compact ? (
        <Button type="button" variant="ghost" size="icon-sm" aria-label="Search" onClick={() => setOpen(true)} className="text-white hover:bg-white/10 hover:text-white">
          <SearchIcon />
        </Button>
      ) : (
        <Button
          type="button"
          variant="ghost"
          onClick={() => setOpen(true)}
          className="h-10 w-full justify-start gap-2 rounded-md bg-white/10 px-3 text-sm font-normal normal-case tracking-normal text-white/70 hover:bg-white/15 hover:text-white"
        >
          <SearchIcon aria-hidden="true" className="size-4" />
          <span className="flex-1 text-left">Search…</span>
          <kbd className="rounded bg-white/10 px-1.5 py-0.5 text-[11px] font-sans text-white/60">Ctrl K</kbd>
        </Button>
      )}

      <CommandDialog
        open={open}
        onOpenChange={onOpenChange}
        title="Search"
        description="Search clients, vendors, invoices, expenses, employees and pages."
        className="sm:max-w-xl"
      >
        {/* Results come already matched from the server, so the list's own filtering is switched off. */}
        <Command shouldFilter={false}>
          <CommandInput value={query} onValueChange={setQuery} placeholder="Client, invoice number, expense, employee or page…" />
          <CommandList className="max-h-[60vh]">
            {nothingFound && <CommandEmpty>Nothing found for “{query.trim()}”.</CommandEmpty>}
            {error && <p role="alert" className="px-3 py-4 text-sm text-destructive">{error}</p>}
            {typedEnough && isSearching && shown.length === 0 && <p className="px-3 py-4 text-sm text-muted-foreground">Searching…</p>}

            {GROUPS.map((group) => {
              const items = shown.filter((result) => result.group === group);
              if (items.length === 0) return null;
              return (
                <CommandGroup key={group} heading={group}>
                  {items.map((item) => (
                    <CommandItem key={`${group}-${item.id}`} value={`${group}-${item.id}`} onSelect={() => go(item.href)}>
                      <span className="truncate">{item.title}</span>
                      {item.detail && <span className="ml-auto shrink-0 pl-3 text-xs text-muted-foreground">{item.detail}</span>}
                    </CommandItem>
                  ))}
                </CommandGroup>
              );
            })}

            {matchingPages.length > 0 && (
              <CommandGroup heading={term ? "Pages" : "Go to"}>
                {matchingPages.map((page) => (
                  <CommandItem key={page.href} value={`page-${page.href}`} onSelect={() => go(page.href)}>
                    {page.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
          {!typedEnough && <p className="border-t px-3 py-2 text-xs text-muted-foreground">Type at least 2 letters to search records.</p>}
        </Command>
      </CommandDialog>
    </>
  );
}
