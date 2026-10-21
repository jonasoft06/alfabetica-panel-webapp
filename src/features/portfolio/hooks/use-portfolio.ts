"use client";

import { useQuery } from "@tanstack/react-query";
import { portfolioApi, portfolioKeys } from "../api/portfolio-api";

export function usePortfolio() {
  return useQuery({ queryKey: portfolioKeys.list(), queryFn: () => portfolioApi.list() });
}

/** Confirmed cover of one portfolio (GET /projects/:id/portfolio/cover). */
export function usePortfolioCover(projectId: string | null) {
  return useQuery({
    queryKey: portfolioKeys.cover(projectId ?? ""),
    queryFn: () => portfolioApi.cover(projectId!),
    select: (data) => data.cover,
    enabled: !!projectId,
  });
}

/** Gallery of one portfolio, cover excluded (GET /projects/:id/media?scope=PORTFOLIO). */
export function usePortfolioGallery(projectId: string | null) {
  return useQuery({
    queryKey: portfolioKeys.gallery(projectId ?? ""),
    queryFn: () => portfolioApi.gallery(projectId!),
    select: (data) => data.items,
    enabled: !!projectId,
  });
}
