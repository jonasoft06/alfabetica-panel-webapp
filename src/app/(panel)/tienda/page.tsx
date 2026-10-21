import { Suspense } from "react";
import type { Metadata } from "next";
import { isMockOnly } from "@/config/env.server";
import { StoreComingSoon } from "@/features/store/components/store-coming-soon";
import { StoreView } from "@/features/store/components/store-view";

export const metadata: Metadata = { title: "Tienda" };

/**
 * The store only runs against the mock server for now: outside demo mode the page renders the
 * "Próximamente" screen directly, so no publication or media request can be made.
 */
export default function TiendaPage() {
  if (!isMockOnly()) return <StoreComingSoon />;
  return (
    <Suspense>
      <StoreView />
    </Suspense>
  );
}
