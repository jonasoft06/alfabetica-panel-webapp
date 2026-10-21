import { PUBLISHED_PHASE_CODE, type ProductionStatus } from "@/contracts/production";

/**
 * Client copy of panel-api `manual-state.ts`, applied as the user edits so the form never sends a status
 * and phase that disagree. The server stays the authority: the form is reset from its response.
 *
 *   PUBLISHED phase  <=>  FINISHED status
 *   NOT_STARTED      =>   no phase
 *   IN_PRODUCTION    =>   any phase but PUBLISHED, or none yet
 */
export interface StatusAndPhase {
  status: ProductionStatus;
  /** "" = no phase (select value). */
  phaseCode: string;
}

export function withStatus(current: StatusAndPhase, status: ProductionStatus): StatusAndPhase {
  if (status === "FINISHED") return { status, phaseCode: PUBLISHED_PHASE_CODE };
  if (status === "NOT_STARTED") return { status, phaseCode: "" };
  // Back to IN_PRODUCTION from FINISHED: the real phase is unknown, so it is left unset.
  return { status, phaseCode: current.phaseCode === PUBLISHED_PHASE_CODE ? "" : current.phaseCode };
}

export function withPhase(current: StatusAndPhase, phaseCode: string): StatusAndPhase {
  if (phaseCode === PUBLISHED_PHASE_CODE) return { status: "FINISHED", phaseCode };
  // A finished production keeps PUBLISHED: clearing the phase is not allowed there (the UI disables it).
  if (!phaseCode) return current.status === "FINISHED" ? current : { ...current, phaseCode };
  return { status: "IN_PRODUCTION", phaseCode };
}
