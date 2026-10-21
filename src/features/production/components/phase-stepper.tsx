import { useId } from "react";
import { CheckIcon } from "lucide-react";
import type { ProductionPhase, ProductionPhaseRef } from "@/contracts/production";
import { cn } from "@/shared/lib/cn";
import { computePhaseProgress, type StepState } from "../lib/phase-progress";

/**
 * Stepper of the client-facing phases. Read-only for ClickUp (the phase comes from the list); with
 * `onSelect` (manual mode) the cards become a radio group: native radios give arrow-key navigation.
 */
export function PhaseStepper({
  phases,
  current,
  finished,
  onSelect,
  disabled,
}: {
  phases: ProductionPhase[];
  current: ProductionPhaseRef | null;
  finished: boolean;
  onSelect?: (code: string) => void;
  disabled?: boolean;
}) {
  const name = useId();
  const { steps } = computePhaseProgress(phases, current, finished);
  const selectable = !!onSelect;
  const cardClass = (state: StepState, checked: boolean) =>
    cn(
      "flex items-center gap-3 rounded-xl border-[1.5px] p-3",
      checked ? "border-bubblegum-dark bg-bubblegum/15" : "border-border bg-card",
      selectable && !disabled && "transition-colors hover:border-bubblegum-dark/60 has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/30",
      selectable && disabled && "opacity-70",
    );
  const content = (state: StepState, phase: ProductionPhase, i: number) => (
    <>
      <span
        aria-hidden
        className={cn(
          "flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-extrabold",
          state === "done" ? "bg-bubblegum text-eerie" : state === "current" ? "bg-bubblegum-dark text-white" : "bg-eerie/10 text-eerie/60",
        )}
      >
        {state === "done" ? <CheckIcon className="size-3.5" /> : i + 1}
      </span>
      <span className={cn("text-[13px] leading-snug font-bold", state === "upcoming" && "text-eerie/60")}>
        {phase.label}
        <span className="sr-only">{state === "done" ? " (completada)" : state === "current" ? " (actual)" : ""}</span>
      </span>
    </>
  );

  if (selectable) {
    return (
      <div role="radiogroup" aria-label="Fase actual" className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
        {steps.map(({ phase, state }, i) => {
          const checked = phase.code === current?.code;
          return (
            <label key={phase.id} className={cardClass(state, checked)}>
              <input
                type="radio"
                name={name}
                value={phase.code}
                checked={checked}
                disabled={disabled}
                onChange={() => onSelect(phase.code)}
                className="sr-only"
              />
              {content(state, phase, i)}
            </label>
          );
        })}
      </div>
    );
  }

  return (
    <ol aria-label="Fases de producción" className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
      {steps.map(({ phase, state }, i) => (
        <li key={phase.id} aria-current={state === "current" ? "step" : undefined} className={cardClass(state, state === "current")}>
          {content(state, phase, i)}
        </li>
      ))}
    </ol>
  );
}
