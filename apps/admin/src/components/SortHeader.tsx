import Link from "next/link";
import { ArrowDownIcon, ArrowUpDownIcon, ArrowUpIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export type SortDirection = "asc" | "desc";

type Props = {
  label: string;
  // The direction this column is sorted in right now, or null when another column is.
  direction: SortDirection | null;
  // Server-sorted tables move by link; tables sorted in the browser pass onSort instead.
  href?: string;
  onSort?: () => void;
  align?: "left" | "right";
  // The table's own header cell classes, so a sortable heading matches the plain ones beside it.
  className?: string;
};

// A column heading that sorts the table when clicked, with an arrow showing which way it is sorted.
export default function SortHeader({ label, direction, href, onSort, align = "left", className = "" }: Props) {
  const Icon = direction === "asc" ? ArrowUpIcon : direction === "desc" ? ArrowDownIcon : ArrowUpDownIcon;
  const body = (
    <>
      {label}
      <Icon aria-hidden="true" className={direction ? "size-3 text-matte-black" : "size-3 opacity-40"} />
    </>
  );
  const look = `h-auto gap-1 p-0 text-xs font-semibold uppercase tracking-wider hover:bg-transparent hover:text-matte-black ${
    direction ? "text-matte-black" : "text-gray-500"
  }`;

  return (
    <th className={`${className} ${align === "right" ? "text-right" : ""}`} aria-sort={direction === "asc" ? "ascending" : direction === "desc" ? "descending" : "none"}>
      {href ? (
        <Button asChild variant="ghost" className={look}>
          <Link href={href} scroll={false}>{body}</Link>
        </Button>
      ) : (
        // No handler at all on a link-driven heading, since a server-rendered page cannot hand a function to a button.
        <Button type="button" variant="ghost" className={look} onClick={onSort ? () => onSort() : undefined}>
          {body}
        </Button>
      )}
    </th>
  );
}
