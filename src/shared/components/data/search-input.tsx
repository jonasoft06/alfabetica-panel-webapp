"use client";

import { SearchIcon, XIcon } from "lucide-react";
import { cn } from "@/shared/lib/cn";

type SearchInputProps = Omit<React.ComponentProps<"input">, "onChange" | "value"> & {
  value: string;
  onValueChange: (value: string) => void;
};

export function SearchInput({ value, onValueChange, className, placeholder = "Buscar…", ...props }: SearchInputProps) {
  return (
    <label className={cn("relative flex h-10 items-center rounded-xl bg-muted focus-within:ring-[3px] focus-within:ring-ring/20", className)}>
      <SearchIcon className="pointer-events-none absolute left-3.5 size-4 text-muted-foreground" />
      <input
        type="search"
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        placeholder={placeholder}
        className="h-full w-full bg-transparent pr-9 pl-10 text-sm outline-none placeholder:text-muted-foreground/80 [&::-webkit-search-cancel-button]:hidden"
        {...props}
      />
      {value && (
        <button
          type="button"
          onClick={() => onValueChange("")}
          className="absolute right-2.5 rounded-md p-1 text-muted-foreground hover:text-foreground"
          aria-label="Limpiar búsqueda"
        >
          <XIcon className="size-3.5" />
        </button>
      )}
    </label>
  );
}
