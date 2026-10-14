import type { Metadata } from "next";
import { ProductionView } from "@/features/production/components/production-view";

export const metadata: Metadata = { title: "Producción" };

export default function Page() {
  return <ProductionView />;
}
