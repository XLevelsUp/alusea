"use client";

import { useState } from "react";
import { PAGE_SIZE } from "@/components/Pagination";

// Splits a list already in the browser into pages. `signature` describes the current filters, so changing any of them returns to page 1.
export function usePaged<T>(rows: T[], signature: string, pageSize: number = PAGE_SIZE) {
  const [state, setState] = useState({ signature, page: 1 });

  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const page = state.signature === signature ? Math.min(state.page, pageCount) : 1;

  return {
    page,
    total: rows.length,
    pageRows: rows.slice((page - 1) * pageSize, page * pageSize),
    setPage: (next: number) => setState({ signature, page: next }),
  };
}
