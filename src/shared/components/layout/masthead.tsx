"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { BellIcon, PanelLeftIcon } from "lucide-react";
import { navItemFor } from "@/config/navigation";
import { SearchInput } from "@/shared/components/data/search-input";
import { Button } from "@/shared/ui/button";
import { usePageMeta } from "./page-meta";
import { UserMenu } from "./user-menu";

/** Top bar: sidebar toggle, module title + subtitle, global search, notifications and user menu. */
export function Masthead({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const item = navItemFor(pathname);
  const { subtitle } = usePageMeta();
  const [query, setQuery] = useState("");

  return (
    <header className="hidden items-center gap-4 rounded-3xl bg-card px-4 py-3.5 shadow-card md:flex lg:px-5">
      <Button variant="secondary" size="icon" className="size-9 rounded-xl" onClick={onToggleSidebar} aria-label="Mostrar u ocultar etiquetas del menú">
        <PanelLeftIcon className="size-4" />
      </Button>
      <span aria-hidden className="h-8 w-px bg-border" />
      <span aria-hidden className="h-9 w-1 rounded-full" style={{ background: item.accent }} />
      <div className="min-w-0 flex-1">
        <h1 className="font-display text-lg leading-tight font-bold">{item.label}</h1>
        <p className="truncate text-xs text-muted-foreground">{subtitle ?? "Alfabética Workspace"}</p>
      </div>
      <form
        role="search"
        className="hidden w-60 lg:block"
        onSubmit={(e) => {
          e.preventDefault();
          if (query.trim()) router.push(`/proyectos?q=${encodeURIComponent(query.trim())}`);
        }}
      >
        <SearchInput value={query} onValueChange={setQuery} placeholder="Buscar proyectos…" aria-label="Buscar en proyectos" />
      </form>
      <Button variant="secondary" size="icon" className="size-10 rounded-xl" aria-label="Notificaciones (sin novedades)" title="Sin notificaciones nuevas">
        <BellIcon className="size-4" />
      </Button>
      <span aria-hidden className="h-8 w-px bg-border" />
      <UserMenu />
    </header>
  );
}
