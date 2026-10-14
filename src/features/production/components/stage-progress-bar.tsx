import { cn } from "@/shared/lib/cn";

/** Segmented bar of the shared stages; `position` is 1-based (0 = no stage). */
export function StageProgressBar({ position, total, label, className }: { position: number; total: number; label?: string; className?: string }) {
  return (
    <div className={cn("min-w-0", className)}>
      {label && <p className="mb-1.5 truncate text-[13px] font-bold">{label}</p>}
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={position}
        aria-label={`Etapa ${position} de ${total}`}
        className="flex gap-1"
      >
        {Array.from({ length: total }, (_, i) => (
          <span
            key={i}
            className={cn("h-1.5 flex-1 rounded-full", i < position - 1 ? "bg-bubblegum" : i === position - 1 ? "bg-bubblegum-dark" : "bg-eerie/10")}
          />
        ))}
      </div>
      <p className="mt-1 text-[11px] font-semibold text-muted-foreground">{position > 0 ? `Etapa ${position} de ${total}` : "Sin etapa asignada"}</p>
    </div>
  );
}
