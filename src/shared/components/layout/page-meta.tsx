"use client";

import { createContext, useContext, useEffect, useState } from "react";

type PageMetaState = { subtitle: React.ReactNode | null; setSubtitle: (value: React.ReactNode | null) => void };

const PageMetaContext = createContext<PageMetaState | null>(null);

export function PageMetaProvider({ children }: { children: React.ReactNode }) {
  const [subtitle, setSubtitle] = useState<React.ReactNode | null>(null);
  return <PageMetaContext.Provider value={{ subtitle, setSubtitle }}>{children}</PageMetaContext.Provider>;
}

export function usePageMeta() {
  const context = useContext(PageMetaContext);
  if (!context) throw new Error("usePageMeta must be used inside <PageMetaProvider>");
  return context;
}

/** Sets the masthead subtitle ("24 proyectos · 16 publicados") from inside a page. */
export function usePageSubtitle(subtitle: string | null) {
  const { setSubtitle } = usePageMeta();
  useEffect(() => {
    setSubtitle(subtitle);
    return () => setSubtitle(null);
  }, [subtitle, setSubtitle]);
}
