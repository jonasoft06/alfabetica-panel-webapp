import type { PublicationListItem, PublicationType } from "@/contracts/publication";

export type TypeFilter = "all" | PublicationType;
export type StateFilter = "all" | "published" | "draft";

const normalize = (value: string) => value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Client-side search + type + published-state filter (GET /publications has no query params). */
export function filterPublications(items: PublicationListItem[], { query, type, state }: { query: string; type: TypeFilter; state: StateFilter }) {
  const q = normalize(query.trim());
  return items
    .filter((i) => !q || normalize(`${i.title} ${i.subtitle ?? ""}`).includes(q))
    .filter((i) => type === "all" || i.type === type)
    .filter((i) => state === "all" || (state === "published") === i.isPublished);
}

/** "tienda.example.com" from a URL, or null when it is not parseable. */
export function hostOf(url: string | null): string | null {
  if (!url) return null;
  try {
    return new URL(url).host.replace(/^www\./, "");
  } catch {
    return null;
  }
}
