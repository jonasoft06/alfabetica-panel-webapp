import { Suspense } from "react";
import type { Metadata } from "next";
import { StoreView } from "@/features/store/components/store-view";

export const metadata: Metadata = { title: "Tienda" };

export default function TiendaPage() {
  return (
    <Suspense>
      <StoreView />
    </Suspense>
  );
}
