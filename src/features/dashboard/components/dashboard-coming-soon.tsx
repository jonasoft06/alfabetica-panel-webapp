"use client";

import Link from "next/link";
import { ArrowRightIcon, CheckIcon, HomeIcon } from "lucide-react";
import { useSession } from "@/core/auth/session-provider";
import { SpineCard } from "@/shared/components/data/spine-card";
import { usePageSubtitle } from "@/shared/components/layout/page-meta";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";

const UPCOMING = [
  "Proyectos, portafolio y producción de un vistazo",
  "Actividad semanal de las últimas ocho semanas",
  "Lo que necesita tu atención: portadas, enlaces con ClickUp y títulos inactivos",
];

/** Shown outside demo mode: panel-api has no GET /dashboard/summary yet. */
export function DashboardComingSoon() {
  const { user } = useSession();
  usePageSubtitle("Próximamente · módulo en desarrollo");
  const firstName = user?.name?.split(" ")[0] ?? "";

  return (
    <SpineCard className="flex min-h-[calc(100dvh-220px)] items-center justify-center px-5 py-12 md:px-8">
      <div className="flex w-full max-w-[600px] flex-col items-center text-center">
        <span className="flex size-16 items-center justify-center rounded-2xl bg-turquoise/15 text-turquoise-dark">
          <HomeIcon className="size-7" />
        </span>
        <Badge tone="turquoise" size="md" className="mt-4">
          PRÓXIMAMENTE
        </Badge>
        <h2 className="mt-3 font-display text-2xl font-bold md:text-[26px]">Hola{firstName ? `, ${firstName}` : ""}: el resumen aún se está armando</h2>
        <p className="mt-2 max-w-[520px] text-sm text-muted-foreground">
          Esta vista reunirá el estado del catálogo en una sola pantalla. Mientras tanto, cada módulo muestra sus propios números.
        </p>
        <div className="mt-6 w-full rounded-2xl bg-muted px-5 py-4 text-left">
          <p className="eyebrow">Lo que vivirá aquí</p>
          <ul className="mt-3 space-y-2.5">
            {UPCOMING.map((item) => (
              <li key={item} className="flex gap-2.5 text-[13px] text-eerie/80">
                <CheckIcon className="mt-0.5 size-3.5 shrink-0 text-turquoise-dark" strokeWidth={3} />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <Button asChild size="lg" className="mt-5">
          <Link href="/proyectos">
            Ir a Proyectos <ArrowRightIcon />
          </Link>
        </Button>
      </div>
    </SpineCard>
  );
}
