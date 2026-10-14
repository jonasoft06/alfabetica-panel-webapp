import type { ProjectListItem } from "@/contracts/projects";
import { RELATIONS, type RelationKey } from "@/shared/lib/relations";
import { cn } from "@/shared/lib/cn";

export function activeRelations(project: Pick<ProjectListItem, "hasPortfolio" | "hasPublication" | "hasProduction">): RelationKey[] {
  return [project.hasPortfolio && "portfolio", project.hasPublication && "publication", project.hasProduction && "production"].filter(Boolean) as RelationKey[];
}

export function RelationChips({ relations, className }: { relations: RelationKey[]; className?: string }) {
  if (!relations.length) return <span className="text-xs text-muted-foreground">Sin relaciones</span>;
  return (
    <ul className={cn("flex flex-wrap gap-1.5", className)} aria-label="Relaciones">
      {relations.map((key) => (
        <li key={key} className={cn("rounded-full px-2 py-1 text-[10px] leading-none font-extrabold", RELATIONS[key].chip)}>
          {RELATIONS[key].label}
        </li>
      ))}
    </ul>
  );
}
