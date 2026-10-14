import { cn } from "@/shared/lib/cn";

/** Empty bookshelf illustration (pure CSS) used by "sin resultados" / "vacío" states. */
export function ShelfIllustration({ className }: { className?: string }) {
  const books = ["h-24 w-[78px]", "h-28 w-[78px]", "h-[104px] w-[78px]", "h-[90px] w-[78px]"];
  return (
    <div aria-hidden className={cn("flex flex-col items-center", className)}>
      <div className="flex items-end gap-2.5">
        {books.map((size, i) => (
          <div key={i} className={cn("rounded-sm border border-dashed border-eerie/20 border-l-[6px] border-l-eerie/10", size)} />
        ))}
      </div>
      <div className="mt-3 h-1.5 w-[330px] max-w-full rounded-full bg-eerie/10" />
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
  footnote,
  illustration = <ShelfIllustration />,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  footnote?: React.ReactNode;
  illustration?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center px-6 py-14 text-center md:py-20", className)}>
      {illustration && <div className="mb-8 w-full max-w-[340px] scale-75 md:scale-100">{illustration}</div>}
      <h3 className="font-display text-xl font-bold md:text-[22px]">{title}</h3>
      {description && <p className="mt-2 max-w-md text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
      {footnote && <p className="mt-5 text-xs text-muted-foreground/80">{footnote}</p>}
    </div>
  );
}
