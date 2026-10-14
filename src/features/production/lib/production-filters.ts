import type { ProductionListItem } from "@/contracts/production";

export type ProductionSort = "stage-asc" | "stage-desc";
export type LinkFilter = "all" | "linked" | "unlinked";

const normalize = (value: string) => value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export function filterProductions(items: ProductionListItem[], { query, link, sort }: { query: string; link: LinkFilter; sort: ProductionSort }) {
  const q = normalize(query.trim());
  const order = (p: ProductionListItem) => p.currentStage?.sortOrder ?? 0;
  return items
    .filter((p) => (link === "all" ? true : link === "linked" ? !!p.clickupListId : !p.clickupListId))
    .filter((p) => !q || normalize(p.title).includes(q) || normalize(p.publicCode).includes(q))
    .sort((a, b) => (sort === "stage-asc" ? order(a) - order(b) : order(b) - order(a)) || a.title.localeCompare(b.title, "es"));
}
