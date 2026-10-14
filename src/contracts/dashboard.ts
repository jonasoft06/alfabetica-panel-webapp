/** @api proposed — GET /dashboard/summary (Resumen). Aggregates only; no new tables needed. */
export interface DashboardSummary {
  projects: { total: number; createdThisWeek: number; weekly: number[] };
  portfolio: { total: number; published: number; maxItems: number; weekly: number[] };
  store: { total: number; published: number; weekly: number[] };
  production: { total: number; linked: number; lastSyncedAt: string | null; weekly: number[] };
  attention: AttentionItem[];
}

export type AttentionReason = "MISSING_PORTFOLIO_COVER" | "MISSING_PRICE" | "MISSING_CLICKUP_LINK" | "STALE_PROJECT";

export interface AttentionItem {
  projectId: string;
  title: string;
  reason: AttentionReason;
  detail: string;
}
