"use client";

import { useQuery } from "@tanstack/react-query";
import { dashboardApi, dashboardKeys } from "../api/dashboard-api";

export function useDashboardSummary() {
  return useQuery({ queryKey: dashboardKeys.summary(), queryFn: dashboardApi.summary });
}
