"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MenuIcon } from "lucide-react";
import { navItemFor, navItemsFor, UPCOMING_LABEL } from "@/config/navigation";
import { useRuntimeConfig } from "@/core/runtime/runtime-config";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/shared/ui/sheet";
import { BrandLogo } from "./brand-mark";
import { usePageMeta } from "./page-meta";
import { UserMenu } from "./user-menu";

/** Mobile (< md) top bar: navigation drawer trigger, module title + subtitle and user menu. */
export function MobileTopBar() {
  const pathname = usePathname();
  const item = navItemFor(pathname);
  const { subtitle } = usePageMeta();
  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b bg-background/90 px-4 pt-[max(env(safe-area-inset-top),0.75rem)] pb-3 backdrop-blur md:hidden">
      <MobileNavDrawer />
      <span aria-hidden className="h-9 w-1 rounded-full" style={{ background: item.accent }} />
      <div className="min-w-0 flex-1">
        <h1 className="font-display text-lg leading-tight font-bold">{item.label}</h1>
        {subtitle && <p className="truncate text-[11px] text-muted-foreground">{subtitle}</p>}
      </div>
      <UserMenu compact />
    </header>
  );
}

/**
 * Hamburger + left-side drawer (same side as the desktop sidebar) with the same entries, order and "próximamente" treatment as the
 * desktop sidebar. Radix Dialog handles Esc, overlay tap, the focus trap and returning focus to the trigger.
 */
function MobileNavDrawer() {
  const pathname = usePathname();
  const active = navItemFor(pathname);
  const items = navItemsFor(useRuntimeConfig().mockOnly);
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="secondary" size="icon" className="size-10 rounded-xl" aria-label="Abrir menú">
          <MenuIcon className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" aria-describedby={undefined}>
        <div className="flex items-center gap-3 border-b px-5 pt-[max(env(safe-area-inset-top),1.25rem)] pb-5">
          <BrandLogo className="size-9" />
          <SheetTitle className="font-display text-lg font-bold">Alfabética</SheetTitle>
        </div>
        <nav aria-label="Módulos" className="flex flex-1 flex-col gap-1 overflow-y-auto p-3 pb-[max(env(safe-area-inset-bottom),0.75rem)]">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = item.key === active.key;
            return (
              <Link
                key={item.key}
                href={item.href}
                onClick={() => setOpen(false)}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold outline-none focus-visible:ring-[3px] focus-visible:ring-ring/30",
                  isActive ? "bg-muted" : "hover:bg-muted/60",
                )}
                style={isActive ? { color: item.accentStrong } : undefined}
              >
                <span
                  className="relative flex size-9 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: `color-mix(in oklch, ${item.accent} 18%, transparent)`, color: item.accentStrong }}
                >
                  <Icon className="size-[18px]" />
                  {item.upcoming && <span aria-hidden className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-tan-sun" />}
                </span>
                {item.label}
                {item.upcoming && (
                  <span className="ml-auto rounded-full bg-tan-sun/30 px-2 py-0.5 text-[10px] font-extrabold text-tan-sun-dark">{UPCOMING_LABEL}</span>
                )}
              </Link>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
