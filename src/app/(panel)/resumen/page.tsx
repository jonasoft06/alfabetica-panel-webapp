import type { Metadata } from "next";
import { DashboardView } from "@/features/dashboard/components/dashboard-view";

export const metadata: Metadata = { title: "Resumen" };

export default function ResumenPage() {
  return <DashboardView />;
}
