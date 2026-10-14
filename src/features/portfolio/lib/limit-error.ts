import type { PortfolioLimitError } from "@/contracts/portfolio";
import { ApiError } from "@/core/http/api-error";

/** Detects the 409 PORTFOLIO_LIMIT_REACHED body of POST /projects/:id/portfolio/publish. */
export function getLimitError(error: unknown): PortfolioLimitError | null {
  if (!(error instanceof ApiError) || !error.isConflict || error.code !== "PORTFOLIO_LIMIT_REACHED") return null;
  const maxItems = error.body?.maxItems;
  const currentCount = error.body?.currentCount;
  return {
    code: "PORTFOLIO_LIMIT_REACHED",
    maxItems: typeof maxItems === "number" ? maxItems : 0,
    currentCount: typeof currentCount === "number" ? currentCount : 0,
  };
}

export function limitMessage(limit: PortfolioLimitError) {
  return limit.maxItems
    ? `La web principal ya muestra ${limit.maxItems} títulos. Quita uno para publicar otro.`
    : "La web principal alcanzó su límite de títulos. Quita uno para publicar otro.";
}
