import type { DashboardSummary } from "@/contracts/dashboard";
import { endpoints } from "@/core/http/endpoints";
import { http } from "@/core/http/http-client";

export const dashboardApi = {
  /** TODO(api): proposed GET /dashboard/summary */
  summary: () => http.get<DashboardSummary>(endpoints.dashboard.summary()),
};

export const dashboardKeys = {
  all: ["dashboard"] as const,
  summary: () => [...dashboardKeys.all, "summary"] as const,
};
