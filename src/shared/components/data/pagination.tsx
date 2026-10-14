"use client";

import { useMemo, useState } from "react";
import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react";
import { cn } from "@/shared/lib/cn";

/** Client-side pagination (panel-api list endpoints return full arrays). */
export function usePagination<T>(items: T[], pageSize = 10, resetKey?: unknown) {
  // Page resets to 1 whenever `resetKey` (search/filter) changes, without an effect.
  const [state, setState] = useState({ key: resetKey, page: 1 });
  const page = Object.is(state.key, resetKey) ? state.page : 1;
  const setPage = (next: number) => setState({ key: resetKey, page: next });
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const current = Math.min(page, pageCount);
  const pageItems = useMemo(() => items.slice((current - 1) * pageSize, current * pageSize), [items, current, pageSize]);
  const from = items.length === 0 ? 0 : (current - 1) * pageSize + 1;
  const to = Math.min(current * pageSize, items.length);
  return { page: current, setPage, pageCount, pageItems, from, to, total: items.length };
}

export function Pagination({
  page,
  pageCount,
  onPageChange,
  summary,
  className,
}: {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  summary?: React.ReactNode;
  className?: string;
}) {
  const pages = Array.from({ length: pageCount }, (_, i) => i + 1);
  const btn =
    "inline-flex h-[30px] min-w-[30px] items-center justify-center rounded-lg border-[1.5px] px-2 text-xs font-bold transition-colors disabled:opacity-40";
  return (
    <nav aria-label="Paginación" className={cn("flex items-center justify-between gap-3 border-t px-5 py-3.5 md:px-6", className)}>
      <p className="text-xs text-muted-foreground">{summary}</p>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          className={cn(btn, "border-border text-muted-foreground hover:bg-muted")}
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Página anterior"
        >
          <ArrowLeftIcon className="size-3.5" />
        </button>
        {pages.map((n) => (
          <button
            key={n}
            type="button"
            aria-current={n === page ? "page" : undefined}
            onClick={() => onPageChange(n)}
            className={cn(
              btn,
              "hidden sm:inline-flex",
              n === page ? "border-eerie bg-eerie text-near-white" : "border-border text-muted-foreground hover:bg-muted",
            )}
          >
            {n}
          </button>
        ))}
        <span className="px-1 text-xs font-bold sm:hidden">
          {page} / {pageCount}
        </span>
        <button
          type="button"
          className={cn(btn, "border-border text-muted-foreground hover:bg-muted")}
          disabled={page >= pageCount}
          onClick={() => onPageChange(page + 1)}
          aria-label="Página siguiente"
        >
          <ArrowRightIcon className="size-3.5" />
        </button>
      </div>
    </nav>
  );
}
