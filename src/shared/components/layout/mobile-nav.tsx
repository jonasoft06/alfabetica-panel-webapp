"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOutIcon, MenuIcon } from "lucide-react";
import { NAV_ITEMS, navItemFor } from "@/config/navigation";
import { useSession } from "@/core/auth/session-provider";
import { cn } from "@/shared/lib/cn";
import { Avatar } from "@/shared/ui/avatar";
import { Sheet, SheetContent, SheetTitle } from "@/shared/ui/sheet";
import { BrandMark } from "./brand-mark";
import { usePageMeta } from "./page-meta";
import { UserMenu } from "./user-menu";

/** Primary modules in the bottom bar; the rest live in the "Más" drawer. */
const BOTTOM_KEYS = ["dashboard", "projects", "portfolio", "production"] as const;

export function MobileTopBar() {
  const pathname = usePathname();
  const item = navItemFor(pathname);
  const { subtitle } = usePageMeta();
  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b bg-background/90 px-4 pt-[max(env(safe-area-inset-top),0.75rem)] pb-3 backdrop-blur md:hidden">
      <span aria-hidden className="h-9 w-1 rounded-full" style={{ background: item.accent }} />
      <div className="min-w-0 flex-1">
        <h1 className="font-display text-lg leading-tight font-bold">{item.label}</h1>
        {subtitle && <p className="truncate text-[11px] text-muted-foreground">{subtitle}</p>}
      </div>
      <UserMenu compact />
    </header>
  );
}

export function MobileBottomNav() {
  const pathname = usePathname();
  const active = navItemFor(pathname);
  const { user, signOut } = useSession();
  const [open, setOpen] = useState(false);
  const bottom = NAV_ITEMS.filter((item) => (BOTTOM_KEYS as readonly string[]).includes(item.key));
  const moreActive = !(BOTTOM_KEYS as readonly string[]).includes(active.key);

  const tab = "flex flex-1 flex-col items-center justify-center gap-1 rounded-xl py-1.5 text-[10px] font-bold transition-colors";

  return (
    <>
      <nav
        aria-label="Módulos"
        className="fixed inset-x-0 bottom-0 z-40 border-t bg-card/95 px-2 pt-1.5 pb-[max(env(safe-area-inset-bottom),0.5rem)] backdrop-blur md:hidden"
      >
        <div className="flex gap-1">
          {bottom.map((item) => {
            const isActive = item.key === active.key;
            const Icon = item.icon;
            return (
              <Link
                key={item.key}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(tab, isActive ? "text-eerie" : "text-eerie/45")}
                style={isActive ? { color: item.accentStrong } : undefined}
              >
                <Icon className="size-5" strokeWidth={isActive ? 2.25 : 1.75} />
                {item.shortLabel}
              </Link>
            );
          })}
          <button type="button" onClick={() => setOpen(true)} className={cn(tab, moreActive ? "text-eerie" : "text-eerie/45")} aria-haspopup="dialog">
            <MenuIcon className="size-5" strokeWidth={1.75} />
            Más
          </button>
        </div>
      </nav>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent>
          <div className="flex items-center gap-3 border-b px-5 pt-[max(env(safe-area-inset-top),1.25rem)] pb-5">
            <BrandMark className="size-9 text-eerie" />
            <SheetTitle className="font-display text-lg font-bold">Alfabética</SheetTitle>
          </div>
          <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = item.key === active.key;
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn("flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold", isActive ? "bg-muted" : "hover:bg-muted/60")}
                >
                  <span
                    className="flex size-9 items-center justify-center rounded-xl"
                    style={{ background: `color-mix(in oklch, ${item.accent} 18%, transparent)`, color: item.accentStrong }}
                  >
                    <Icon className="size-[18px]" />
                  </span>
                  {item.label}
                </Link>
              );
            })}
          </nav>
          {user && (
            <div className="flex items-center gap-3 border-t p-4 pb-[max(env(safe-area-inset-bottom),1rem)]">
              <Avatar name={user.name ?? user.email} seed={user.id} className="bg-grape" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{user.name ?? user.email}</p>
                <p className="truncate text-xs text-muted-foreground">{user.role?.name ?? "Sin rol"}</p>
              </div>
              <button
                type="button"
                onClick={() => void signOut()}
                className="rounded-xl p-2.5 text-destructive hover:bg-destructive/10"
                aria-label="Cerrar sesión"
              >
                <LogOutIcon className="size-5" />
              </button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
