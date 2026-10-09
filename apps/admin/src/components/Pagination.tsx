import Link from "next/link";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export const PAGE_SIZE = 50;

type Props = {
  page: number;
  total: number;
  pageSize?: number;
  // What the rows are called, for the "Showing 1–50 of 230 expenses" line.
  noun: string;
  // Server-filtered lists move by link; lists filtered in the browser pass onPage instead.
  hrefFor?: (page: number) => string;
  onPage?: (page: number) => void;
};

// Previous and next under a long table, with a line saying which rows are on screen; hidden when everything fits on one page.
export default function Pagination({ page, total, pageSize = PAGE_SIZE, noun, hrefFor, onPage }: Props) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  if (pageCount <= 1) return null;

  const first = (page - 1) * pageSize + 1;
  const last = Math.min(total, page * pageSize);

  const step = (target: number, label: string, icon: "left" | "right") => {
    const disabled = target < 1 || target > pageCount;
    const body = (
      <>
        {icon === "left" && <ChevronLeftIcon aria-hidden="true" />}
        {label}
        {icon === "right" && <ChevronRightIcon aria-hidden="true" />}
      </>
    );
    if (disabled || !hrefFor) {
      return (
        // No handler at all on a link-driven pager, since a server-rendered page cannot hand a function to a button.
        <Button type="button" size="sm" variant="outline" disabled={disabled} onClick={onPage ? () => onPage(target) : undefined}>
          {body}
        </Button>
      );
    }
    return (
      <Button asChild size="sm" variant="outline">
        <Link href={hrefFor(target)} scroll={false}>{body}</Link>
      </Button>
    );
  };

  return (
    <nav aria-label="Pages" className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 px-4 py-3">
      <p className="text-sm text-gray-600">
        Showing {first}–{last} of {total} {noun}
      </p>
      <div className="flex items-center gap-2">
        {step(page - 1, "Previous", "left")}
        <span className="text-xs text-gray-500">
          Page {page} of {pageCount}
        </span>
        {step(page + 1, "Next", "right")}
      </div>
    </nav>
  );
}
