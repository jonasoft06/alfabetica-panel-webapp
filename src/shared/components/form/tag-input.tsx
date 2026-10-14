"use client";

import { useState } from "react";
import { XIcon } from "lucide-react";
import { cn } from "@/shared/lib/cn";

/** Chips + free input. Enter or comma adds a tag; Backspace on empty input removes the last one. */
export function TagInput({
  id,
  value,
  onChange,
  placeholder = "Agregar tag…",
  maxTags = 12,
  className,
}: {
  id?: string;
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
  className?: string;
}) {
  const [draft, setDraft] = useState("");

  const add = (raw: string) => {
    const tag = raw.trim().replace(/,$/, "").slice(0, 40);
    if (!tag || value.length >= maxTags || value.some((t) => t.toLowerCase() === tag.toLowerCase())) return setDraft("");
    onChange([...value, tag]);
    setDraft("");
  };

  return (
    <div
      className={cn(
        "flex min-h-11 flex-wrap items-center gap-1.5 rounded-xl border-[1.5px] border-input bg-card px-2.5 py-1.5 focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/20",
        className,
      )}
    >
      {value.map((tag) => (
        <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-turquoise/15 py-1 pr-1.5 pl-2.5 text-xs font-bold text-turquoise-dark">
          {tag}
          <button
            type="button"
            onClick={() => onChange(value.filter((t) => t !== tag))}
            className="rounded-full p-0.5 hover:bg-turquoise/20"
            aria-label={`Quitar ${tag}`}
          >
            <XIcon className="size-3" strokeWidth={3} />
          </button>
        </span>
      ))}
      <input
        id={id}
        value={draft}
        onChange={(e) => (e.target.value.endsWith(",") ? add(e.target.value) : setDraft(e.target.value))}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            add(draft);
          } else if (e.key === "Backspace" && !draft && value.length) onChange(value.slice(0, -1));
        }}
        onBlur={() => draft && add(draft)}
        placeholder={value.length >= maxTags ? "" : placeholder}
        className="min-w-24 flex-1 bg-transparent px-1 py-1 text-sm outline-none placeholder:text-muted-foreground/70"
      />
    </div>
  );
}
