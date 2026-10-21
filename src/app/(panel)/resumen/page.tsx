import type { Metadata } from "next";
import { isMockOnly } from "@/config/env.server";
import { DashboardComingSoon } from "@/features/dashboard/components/dashboard-coming-soon";
import { DashboardView } from "@/features/dashboard/components/dashboard-view";

export const metadata: Metadata = { title: "Resumen" };

/** GET /dashboard/summary only exists in the mock server, so outside demo mode Resumen is "Próximamente". */
export default function ResumenPage() {
  return isMockOnly() ? <DashboardView /> : <DashboardComingSoon />;
}
