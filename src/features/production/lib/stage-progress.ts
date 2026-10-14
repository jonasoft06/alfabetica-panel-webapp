import type { ProductionStage } from "@/contracts/production";

export type StepState = "done" | "current" | "upcoming";

export interface StageProgress {
  /** 1-based position of the current stage (0 when none). */
  position: number;
  total: number;
  /** 0–100 */
  percent: number;
  steps: { stage: ProductionStage; state: StepState }[];
}

/** Pure: progress of a production across the shared (ordered) stages. */
export function computeStageProgress(stages: ProductionStage[], currentStageId: string | null): StageProgress {
  const ordered = [...stages].sort((a, b) => a.sortOrder - b.sortOrder);
  const index = ordered.findIndex((s) => s.id === currentStageId);
  const total = ordered.length;
  return {
    position: index + 1,
    total,
    percent: total && index >= 0 ? Math.round(((index + 1) / total) * 100) : 0,
    steps: ordered.map((stage, i) => ({ stage, state: index < 0 ? "upcoming" : i < index ? "done" : i === index ? "current" : "upcoming" })),
  };
}

/** Progress when only the list item's current stage is known (position by sortOrder). */
export function positionOfStage(stages: ProductionStage[], stageId: string | null | undefined) {
  const ordered = [...stages].sort((a, b) => a.sortOrder - b.sortOrder);
  return { position: ordered.findIndex((s) => s.id === stageId) + 1, total: ordered.length };
}
