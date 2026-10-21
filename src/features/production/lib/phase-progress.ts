import type { ProductionPhase, ProductionPhaseRef } from "@/contracts/production";

export type StepState = "done" | "current" | "upcoming";

export interface PhaseProgress {
  /** 1-based position of the current phase (0 when none). */
  position: number;
  total: number;
  steps: { phase: ProductionPhase; state: StepState }[];
}

/** Pure: where a production sits in the shared, ordered phase catalog. A finished book has every phase done. */
export function computePhaseProgress(phases: ProductionPhase[], current: ProductionPhaseRef | null, finished = false): PhaseProgress {
  const ordered = [...phases].sort((a, b) => a.sortOrder - b.sortOrder);
  const index = finished ? ordered.length - 1 : ordered.findIndex((p) => p.code === current?.code);
  const stateOf = (i: number): StepState => {
    if (index < 0 || i > index) return "upcoming";
    return i < index || finished ? "done" : "current";
  };
  return { position: index + 1, total: ordered.length, steps: ordered.map((phase, i) => ({ phase, state: stateOf(i) })) };
}
