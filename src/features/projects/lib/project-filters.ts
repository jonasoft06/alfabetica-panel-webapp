import type { ProjectListItem } from "@/contracts/projects";

export type RelationFilter = "all" | "portfolio" | "publication" | "production";
export type SortDirection = "desc" | "asc";

const normalize = (value: string) => value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export const updatedAtOf = (project: ProjectListItem) => project.updatedAt ?? project.createdAt;

/** Client-side search + relation filter + sort (GET /projects has no search/pagination). */
export function filterProjects(items: ProjectListItem[], { query, relation, sort }: { query: string; relation: RelationFilter; sort: SortDirection }) {
  const q = normalize(query.trim());
  return items
    .filter((p) => !q || normalize(`${p.title} ${p.subtitle ?? ""} ${p.client ?? ""}`).includes(q))
    .filter(
      (p) =>
        relation === "all" ||
        (relation === "portfolio" && p.hasPortfolio) ||
        (relation === "publication" && p.hasPublication) ||
        (relation === "production" && p.hasProduction),
    )
    .sort((a, b) => (sort === "desc" ? updatedAtOf(b).localeCompare(updatedAtOf(a)) : updatedAtOf(a).localeCompare(updatedAtOf(b))));
}
