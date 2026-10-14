import type { PortfolioListItem } from "@/contracts/portfolio";

export type PortfolioFilter = "all" | "published" | "unpublished" | "noCover";
export type PortfolioSort = "published" | "title" | "recent";

export const SORT_LABELS: Record<PortfolioSort, string> = {
  published: "Publicados primero",
  title: "Título A–Z",
  recent: "Más recientes",
};

export const FILTER_LABELS: Record<PortfolioFilter, string> = {
  all: "Todos",
  published: "Publicados",
  unpublished: "No publicados",
  noCover: "Sin portada",
};

const normalize = (value: string) => value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

const byOrder = (a: PortfolioListItem, b: PortfolioListItem) => (a.displayOrder ?? Number.MAX_SAFE_INTEGER) - (b.displayOrder ?? Number.MAX_SAFE_INTEGER);

export function matchesFilter(item: PortfolioListItem, filter: PortfolioFilter) {
  switch (filter) {
    case "published":
      return item.isPublished;
    case "unpublished":
      return !item.isPublished;
    case "noCover":
      return !item.cover;
    default:
      return true;
  }
}

export function matchesQuery(item: PortfolioListItem, query: string) {
  const q = normalize(query.trim());
  return !q || normalize(`${item.title} ${item.subtitle ?? ""}`).includes(q);
}

/** Published titles in the order they appear on the home page. */
export function publishedInOrder(items: PortfolioListItem[]) {
  return items.filter((i) => i.isPublished).sort(byOrder);
}

/** Client-side search + filter + sort (GET /portfolios returns the whole list). */
export function filterPortfolio(items: PortfolioListItem[], { query, filter, sort }: { query: string; filter: PortfolioFilter; sort: PortfolioSort }) {
  const list = items.filter((i) => matchesFilter(i, filter) && matchesQuery(i, query));
  const recent = (a: PortfolioListItem, b: PortfolioListItem) => b.updatedAt.localeCompare(a.updatedAt);
  if (sort === "title") return list.sort((a, b) => a.title.localeCompare(b.title, "es"));
  if (sort === "recent") return list.sort(recent);
  return list.sort((a, b) => Number(b.isPublished) - Number(a.isPublished) || (a.isPublished && b.isPublished ? byOrder(a, b) : recent(a, b)));
}

/** Items whose position changed → one PUT /projects/:id/portfolio per entry (displayOrder is 1-based). */
export function changedOrders(original: PortfolioListItem[], orderedIds: string[]) {
  const originalIndex = new Map(original.map((item, index) => [item.id, index]));
  return orderedIds
    .map((id, index) => ({ id, displayOrder: index + 1 }))
    .filter(({ id }, index) => originalIndex.get(id) !== index)
    .map(({ id, displayOrder }) => ({ item: original.find((i) => i.id === id)!, displayOrder }));
}

export function moveItem<T>(list: T[], from: number, to: number) {
  const next = list.slice();
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}
