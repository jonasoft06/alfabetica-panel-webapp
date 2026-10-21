import { cn } from "@/shared/lib/cn";

/** Segmented bar of the shared production phases; `position` is 1-based (0 = no phase yet). */
export function PhaseProgressBar({
  position,
  total,
  label,
  finished,
  className,
}: {
  position: number;
  total: number;
  label?: string;
  finished?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      {label && <p className="mb-1.5 truncate text-[13px] font-bold">{label}</p>}
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={position}
        aria-label={position > 0 ? `Fase ${position} de ${total}` : "Sin fase"}
        className="flex gap-1"
      >
        {Array.from({ length: total }, (_, i) => (
          <span
            key={i}
            className={cn(
              "h-1.5 flex-1 rounded-full",
              i < position - 1 || (finished && i < position) ? "bg-bubblegum" : i === position - 1 ? "bg-bubblegum-dark" : "bg-eerie/10",
            )}
          />
        ))}
      </div>
      <p className="mt-1 text-[11px] font-semibold text-muted-foreground">
        {finished ? "Terminado" : position > 0 ? `Fase ${position} de ${total}` : "Sin fase"}
      </p>
    </div>
  );
}
