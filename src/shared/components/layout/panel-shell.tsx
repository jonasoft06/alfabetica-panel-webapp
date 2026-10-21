"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { navItemFor } from "@/config/navigation";
import { useSession } from "@/core/auth/session-provider";
import { Button } from "@/shared/ui/button";
import { BrandLogo } from "./brand-mark";
import { Masthead } from "./masthead";
import { MobileTopBar } from "./mobile-nav";
import { PageMetaProvider } from "./page-meta";
import { Sidebar } from "./sidebar";

const SIDEBAR_KEY = "alf.sidebar.expanded";

function readExpanded() {
  try {
    return window.localStorage.getItem(SIDEBAR_KEY) === "1";
  } catch {
    return false;
  }
}

/** Authenticated layout: restores the session, then renders sidebar + masthead + content. */
export function PanelShell({ children }: { children: React.ReactNode }) {
  const { status, bootstrap } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const item = navItemFor(pathname);
  // Safe lazy read: the shell only renders the sidebar after the client-side session check.
  const [expanded, setExpanded] = useState(() => typeof window !== "undefined" && readExpanded());
  // Expose the module accent on <html> too, so portaled modals/menus/toasts inherit it.
  useEffect(() => {
    const root = document.documentElement.style;
    root.setProperty("--module", item.accent);
    root.setProperty("--module-strong", item.accentStrong);
  }, [item.accent, item.accentStrong]);

  useEffect(() => {
    if (status === "idle") void bootstrap();
    if (status === "unauthenticated") router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [status, bootstrap, router, pathname]);

  const toggle = () =>
    setExpanded((value) => {
      try {
        window.localStorage.setItem(SIDEBAR_KEY, value ? "0" : "1");
      } catch {}
      return !value;
    });

  if (status === "unavailable") {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center" role="alert">
        <BrandLogo className="size-12" loading="eager" />
        <p className="max-w-sm text-sm text-muted-foreground">No pudimos conectar con el servidor. Tu sesión sigue activa; revisa tu red e intenta de nuevo.</p>
        <Button variant="outline" onClick={() => void bootstrap()}>
          Reintentar
        </Button>
      </div>
    );
  }

  if (status !== "authenticated") {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4" role="status" aria-live="polite">
        <BrandLogo className="size-12 animate-pulse" loading="eager" />
        <p className="text-sm text-muted-foreground">Abriendo tu espacio de trabajo…</p>
      </div>
    );
  }

  return (
    <PageMetaProvider>
      <div className="flex min-h-dvh" style={{ "--module": item.accent, "--module-strong": item.accentStrong } as React.CSSProperties}>
        <Sidebar expanded={expanded} />
        <div className="flex min-w-0 flex-1 flex-col md:gap-4 md:py-[18px] md:pr-[18px]">
          <Masthead onToggleSidebar={toggle} />
          <MobileTopBar />
          <main id="contenido" className="flex-1 px-4 pt-4 pb-[calc(env(safe-area-inset-bottom)+6rem)] md:rounded-3xl md:bg-card/60 md:p-6 md:pb-6 md:shadow-card">
            {children}
          </main>
        </div>
      </div>
    </PageMetaProvider>
  );
}
