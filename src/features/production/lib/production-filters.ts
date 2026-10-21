import type { ProductionListItem, ProductionStatus } from "@/contracts/production";

export type StatusFilter = "all" | ProductionStatus;
export type ProductionSort = "delivery-asc" | "delivery-desc";

const normalize = (value: string) => value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Productions without an estimated end date go last in both directions ("yyyy-mm-dd" compares as text). */
function compareDelivery(a: ProductionListItem, b: ProductionListItem, sort: ProductionSort) {
  if (!a.estimatedEndDate || !b.estimatedEndDate) return a.estimatedEndDate ? -1 : b.estimatedEndDate ? 1 : 0;
  return sort === "delivery-asc" ? a.estimatedEndDate.localeCompare(b.estimatedEndDate) : b.estimatedEndDate.localeCompare(a.estimatedEndDate);
}

export function filterProductions(items: ProductionListItem[], { query, status, sort }: { query: string; status: StatusFilter; sort: ProductionSort }) {
  const q = normalize(query.trim());
  const matches = (p: ProductionListItem) =>
    !q || normalize(p.projectTitle).includes(q) || normalize(p.publicCode).includes(q) || (!!p.authorName && normalize(p.authorName).includes(q));
  return items
    .filter((p) => (status === "all" || p.status === status) && matches(p))
    .sort((a, b) => compareDelivery(a, b, sort) || a.projectTitle.localeCompare(b.projectTitle, "es"));
}
