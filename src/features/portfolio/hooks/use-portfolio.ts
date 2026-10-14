"use client";

import { useQuery } from "@tanstack/react-query";
import { portfolioApi, portfolioKeys } from "../api/portfolio-api";

export function usePortfolio() {
  return useQuery({ queryKey: portfolioKeys.list(), queryFn: () => portfolioApi.list() });
}

/** Cover + gallery of one portfolio (GET /projects/:id/media?scope=PORTFOLIO — proposed). */
export function usePortfolioMedia(projectId: string | null) {
  return useQuery({ queryKey: portfolioKeys.media(projectId ?? ""), queryFn: () => portfolioApi.media(projectId!), enabled: !!projectId });
}
