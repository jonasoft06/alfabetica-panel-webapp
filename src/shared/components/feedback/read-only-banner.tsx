import Link from "next/link";
import { InfoIcon } from "lucide-react";
import { cn } from "@/shared/lib/cn";

/** Shown when the user can read a module but lacks its permission to write. */
export function ReadOnlyBanner({
  moduleLabel,
  children,
  className,
  showLink = true,
}: {
  moduleLabel: string;
  children?: React.ReactNode;
  className?: string;
  /** Hide the "Ver colaboradores" link (e.g. inside the Colaboradores module itself). */
  showLink?: boolean;
}) {
  return (
    <div
      role="status"
      className={cn("flex flex-col gap-2 rounded-2xl bg-tan-sun/25 px-4 py-3 text-[13px] text-eerie/80 md:flex-row md:items-center md:gap-3", className)}
    >
      <InfoIcon className="hidden size-4 shrink-0 text-tan-sun-dark md:block" />
      <p className="flex-1">
        {children ?? (
          <>
            Puedes consultar la información, pero no crear, editar ni eliminar: esas acciones requieren el módulo{" "}
            <strong className="font-bold text-eerie">{moduleLabel}</strong>. Pídeselo a un administrador desde Colaboradores.
          </>
        )}
      </p>
      {showLink && (
        <Link href="/colaboradores" className="shrink-0 text-xs font-bold text-tan-sun-dark hover:underline">
          Ver colaboradores →
        </Link>
      )}
    </div>
  );
}
