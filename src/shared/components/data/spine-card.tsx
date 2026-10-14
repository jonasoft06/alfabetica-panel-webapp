import { cn } from "@/shared/lib/cn";

/** Card with the colored left "spine" used across the mockup (book-spine metaphor). */
export function SpineCard({ className, spine = "bg-module", children, ...props }: React.ComponentProps<"section"> & { spine?: string }) {
  return (
    <section className={cn("relative overflow-hidden rounded-2xl bg-card shadow-card", className)} {...props}>
      <span aria-hidden className={cn("absolute top-4 bottom-4 left-0 z-[1] w-1 rounded-r-sm", spine)} />
      {children}
    </section>
  );
}

export function SpineCardHeader({
  title,
  description,
  actions,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("flex items-start justify-between gap-3 border-b px-5 py-4 md:px-6", className)}>
      <div className="min-w-0">
        <h2 className="font-display text-base font-bold">{title}</h2>
        {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  );
}
