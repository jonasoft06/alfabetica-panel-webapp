"use client";

import { cn } from "@/shared/lib/cn";

export interface FilterOption<T extends string> {
  value: T;
  label: string;
  /** Tailwind bg-* class for the leading dot. */
  dot?: string;
  count?: number;
}

/** Pill filters ("Todos", "Portafolio", "Tienda"…). Horizontally scrollable on mobile. */
export function FilterChips<T extends string>({
  options,
  value,
  onChange,
  className,
  label = "Filtros",
}: {
  options: FilterOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  label?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn("-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] md:mx-0 md:px-0 md:pb-0", className)}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            className={cn(
              "inline-flex h-9 shrink-0 items-center gap-2 rounded-full border-[1.5px] px-3.5 text-[13px] font-semibold transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/30",
              active ? "border-eerie bg-eerie text-near-white" : "border-border bg-card hover:bg-muted",
            )}
          >
            {option.dot && <span aria-hidden className={cn("size-2 rounded-full", option.dot)} />}
            {option.label}
            {option.count !== undefined && (
              <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-extrabold", active ? "bg-near-white/20" : "bg-muted")}>{option.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
