import { cn } from "@/shared/lib/cn";

/**
 * PLACEHOLDER — Alfabética logo.
 * Replace this block with the official asset (SVG in /public/brand/) when available.
 */
export function BrandMark({ className, label = "Logo" }: { className?: string; label?: string }) {
  return (
    <div
      data-placeholder="alfabetica-logo"
      title="Espacio reservado para el logo de Alfabética"
      className={cn(
        "flex size-10 items-center justify-center rounded-xl border-[1.5px] border-dashed border-current/40 text-[8px] font-extrabold tracking-wider uppercase opacity-70",
        className,
      )}
    >
      {label}
    </div>
  );
}

/** PLACEHOLDER — any Alfabética illustration/photo. Keeps the layout while the asset is missing. */
export function BrandImagePlaceholder({ className, label = "Imagen Alfabética" }: { className?: string; label?: string }) {
  return (
    <div
      data-placeholder="alfabetica-image"
      className={cn(
        "flex items-center justify-center rounded-2xl border-[1.5px] border-dashed border-current/35 text-[11px] font-bold tracking-wider uppercase opacity-60",
        className,
      )}
    >
      {label}
    </div>
  );
}
