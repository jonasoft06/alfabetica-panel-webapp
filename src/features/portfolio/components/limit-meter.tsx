import { cn } from "@/shared/lib/cn";

function Bar({ value, max, className }: { value: number; max: number; className?: string }) {
  const full = value >= max;
  return (
    <span aria-hidden className={cn("block h-1.5 overflow-hidden rounded-full bg-eerie/10", className)}>
      <span
        className={cn("block h-full rounded-full transition-[width]", full ? "bg-tangerine" : "bg-turquoise")}
        style={{ width: `${max ? Math.min(100, (value / max) * 100) : 0}%` }}
      />
    </span>
  );
}

/** Compact "Visibles en la web principal 8 / 10" tile used in the toolbar. */
export function LimitMeter({ value, max, className }: { value: number; max: number; className?: string }) {
  return (
    <div
      className={cn("flex h-[46px] min-w-[200px] flex-col justify-center gap-1 rounded-xl bg-muted px-4", className)}
      role="meter"
      aria-label="Títulos visibles en la web principal"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-valuetext={`${value} de ${max}`}
    >
      <span className="text-[11px] leading-none text-muted-foreground">Visibles en la web principal</span>
      <span className="flex items-center gap-3">
        <Bar value={value} max={max} className="flex-1" />
        <span className="font-display text-[13px] leading-none font-bold text-turquoise-dark">
          {value} / {max}
        </span>
      </span>
    </div>
  );
}

/** Wide variant used inside the edit modal. */
export function LimitBar({ value, max }: { value: number; max: number }) {
  return (
    <div
      className="flex items-center gap-3"
      role="meter"
      aria-label="Títulos visibles en la web principal"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-valuetext={`${value} de ${max}`}
    >
      <Bar value={value} max={max} className="h-2 flex-1" />
      <span className="font-display text-sm font-bold text-turquoise-dark">
        {value} / {max}
      </span>
    </div>
  );
}
