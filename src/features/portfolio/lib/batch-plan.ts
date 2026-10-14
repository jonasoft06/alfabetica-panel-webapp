import type { PortfolioListItem } from "@/contracts/portfolio";
import { plural } from "@/shared/lib/format";

export interface BatchPlan {
  /** Unpublished selected items that fit in the free slots (in list order). */
  toPublish: PortfolioListItem[];
  /** Published selected items. */
  toUnpublish: PortfolioListItem[];
  /** Unpublished selected items that do not fit under the limit. */
  overflow: number;
  withoutCover: number;
  freeSlots: number;
}

/** Pure planning for "Publicar" / "Quitar de la web" over a selection, respecting `maxItems`. */
export function planBatch(selected: PortfolioListItem[], published: number, maxItems: number): BatchPlan {
  const freeSlots = Math.max(0, maxItems - published);
  const unpublished = selected.filter((i) => !i.isPublished);
  return {
    toPublish: unpublished.slice(0, freeSlots),
    toUnpublish: selected.filter((i) => i.isPublished),
    overflow: Math.max(0, unpublished.length - freeSlots),
    withoutCover: selected.filter((i) => !i.cover).length,
    freeSlots,
  };
}

export function describePlan(plan: BatchPlan, selectedCount: number, maxItems: number): string[] {
  const notes: string[] = [];
  if (plan.overflow > 0) {
    const unpublished = plan.toPublish.length + plan.overflow;
    notes.push(
      plan.freeSlots === 0
        ? `La web ya muestra ${maxItems} títulos: quita alguno para publicar.`
        : `Solo ${plan.freeSlots === 1 ? "queda 1 espacio" : `quedan ${plan.freeSlots} espacios`} en la web: se publicarán ${plan.toPublish.length} de los ${unpublished}.`,
    );
  } else if (selectedCount > 0 && plan.toPublish.length === 0 && plan.toUnpublish.length === selectedCount) {
    notes.push("Todos los seleccionados ya están publicados.");
  }
  if (plan.withoutCover > 0) notes.push(plan.withoutCover === 1 ? "Uno de ellos no tiene portada" : `${plan.withoutCover} no tienen portada`);
  return notes;
}

export const titlesLabel = (n: number) => plural(n, "título");
