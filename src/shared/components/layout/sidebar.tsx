"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItemFor, navItemsFor, UPCOMING_LABEL } from "@/config/navigation";
import { useRuntimeConfig } from "@/core/runtime/runtime-config";
import { cn } from "@/shared/lib/cn";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip";
import { BrandLogo } from "./brand-mark";

/** Desktop navigation rail (88px) that can expand to show labels. */
export function Sidebar({ expanded }: { expanded: boolean }) {
  const pathname = usePathname();
  const active = navItemFor(pathname);
  const items = navItemsFor(useRuntimeConfig().mockOnly);

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-dvh shrink-0 flex-col items-stretch py-6 transition-[width] duration-200 md:flex",
        expanded ? "w-[232px] px-4" : "w-[88px] px-5",
      )}
    >
      <div className={cn("mb-10 flex items-center gap-3", expanded ? "px-1" : "justify-center")}>
        <BrandLogo className="size-9" loading="eager" />
        {expanded && <span className="font-display text-lg font-bold">Alfabética</span>}
      </div>
      <nav aria-label="Módulos" className="flex flex-col gap-2">
        {items.map((item) => {
          const isActive = item.key === active.key;
          const Icon = item.icon;
          const link = (
            <Link
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              style={{ "--item-accent": item.accentStrong } as React.CSSProperties}
              className={cn(
                "group relative flex h-12 items-center gap-3 rounded-2xl text-sm font-semibold transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/30",
                expanded ? "px-3.5" : "justify-center",
                isActive ? "bg-card text-[var(--item-accent)] shadow-card" : "text-eerie/55 hover:bg-card/70 hover:text-eerie",
              )}
            >
              {isActive && <span aria-hidden className="absolute top-3 bottom-3 -left-5 w-1.5 rounded-r-md" style={{ background: item.accent }} />}
              <span className="relative">
                <Icon className="size-5" strokeWidth={1.75} />
                {item.upcoming && <span aria-hidden className="absolute -top-1 -right-1.5 size-2 rounded-full bg-tan-sun" />}
              </span>
              {expanded ? (
                <span className="flex min-w-0 flex-col leading-tight">
                  <span className="truncate">{item.label}</span>
                  {item.upcoming && <span className="text-[10px] font-extrabold text-tan-sun-dark">{UPCOMING_LABEL}</span>}
                </span>
              ) : (
                item.upcoming && <span className="sr-only">{UPCOMING_LABEL}</span>
              )}
            </Link>
          );
          return expanded ? (
            <div key={item.key}>{link}</div>
          ) : (
            <Tooltip key={item.key}>
              <TooltipTrigger asChild>{link}</TooltipTrigger>
              <TooltipContent side="right">{item.upcoming ? `${item.label} · ${UPCOMING_LABEL}` : item.label}</TooltipContent>
            </Tooltip>
          );
        })}
      </nav>
    </aside>
  );
}
