"use client";

import Link from "next/link";
import { ArrowLeftIcon, BookOpenIcon, CheckIcon } from "lucide-react";
import { SpineCard } from "@/shared/components/data/spine-card";
import { usePageSubtitle } from "@/shared/components/layout/page-meta";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";

const UPCOMING = [
  "Títulos en venta con su tipo (SALE, LINK o DOI), precio y existencias",
  "Secciones y contenido de cada ficha de venta",
  "Resumen de ventas por mes y títulos vendidos",
];

/** Shown while NEXT_PUBLIC_FEATURE_STORE is off. */
export function StoreComingSoon() {
  usePageSubtitle("Próximamente · módulo en desarrollo");
  return (
    <SpineCard className="flex min-h-[calc(100dvh-220px)] items-center justify-center px-5 py-12 md:px-8">
      <div className="flex w-full max-w-[600px] flex-col items-center text-center">
        <span className="flex size-16 items-center justify-center rounded-2xl bg-tangerine/15 text-tangerine">
          <BookOpenIcon className="size-7" />
        </span>
        <Badge tone="tangerine" size="md" className="mt-4">
          PRÓXIMAMENTE
        </Badge>
        <h2 className="mt-3 font-display text-2xl font-bold md:text-[26px]">La Tienda todavía está en la imprenta</h2>
        <p className="mt-2 max-w-[520px] text-sm text-muted-foreground">
          Esta sección no forma parte de la primera versión del panel. Seguimos construyéndola, y mientras tanto los títulos se administran desde Proyectos y
          Portafolio.
        </p>
        <div className="mt-6 w-full rounded-2xl bg-muted px-5 py-4 text-left">
          <p className="eyebrow">Lo que vivirá aquí</p>
          <ul className="mt-3 space-y-2.5">
            {UPCOMING.map((item) => (
              <li key={item} className="flex gap-2.5 text-[13px] text-eerie/80">
                <CheckIcon className="mt-0.5 size-3.5 shrink-0 text-tangerine" strokeWidth={3} />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <Button asChild size="lg" className="mt-5">
          <Link href="/proyectos">
            <ArrowLeftIcon /> Ir a Proyectos
          </Link>
        </Button>
      </div>
    </SpineCard>
  );
}
