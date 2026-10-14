import { CheckIcon } from "lucide-react";
import type { ProductionStage } from "@/contracts/production";
import { cn } from "@/shared/lib/cn";
import { computeStageProgress } from "../lib/stage-progress";

/**
 * Selectable stepper of the shared stages (radio group). Each stage shows the ClickUp statuses that map to it (read-only).
 * Horizontal on desktop, vertical list on mobile.
 */
export function StageStepper({
  stages,
  value,
  onChange,
  disabled,
}: {
  stages: ProductionStage[];
  value: string;
  onChange: (id: string) => void;
  disabled?: boolean;
}) {
  const { steps } = computeStageProgress(stages, value || null);
  return (
    <ol role="radiogroup" aria-label="Etapa actual" className="grid gap-2 md:grid-cols-3">
      {steps.map(({ stage, state }, i) => {
        const active = state === "current";
        return (
          <li key={stage.id}>
            <button
              type="button"
              role="radio"
              aria-checked={active}
              disabled={disabled}
              onClick={() => onChange(stage.id)}
              className={cn(
                "flex h-full w-full items-start gap-3 rounded-xl border-[1.5px] p-3 text-left transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60",
                active ? "border-bubblegum-dark bg-bubblegum/15" : "border-border bg-card hover:bg-muted/60",
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-extrabold",
                  state === "done" ? "bg-bubblegum text-eerie" : active ? "bg-bubblegum-dark text-white" : "bg-eerie/10 text-eerie/60",
                )}
              >
                {state === "done" ? <CheckIcon className="size-3.5" /> : i + 1}
              </span>
              <span className="min-w-0">
                <span className="block text-[13px] leading-snug font-bold">{stage.clientLabel}</span>
                {stage.clientDescription && <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">{stage.clientDescription}</span>}
                {stage.clickupStatusMatch.length > 0 && (
                  <span className="mt-2 flex flex-wrap items-center gap-1">
                    <span className="sr-only">Estados de ClickUp:</span>
                    {stage.clickupStatusMatch.map((status) => (
                      <code key={status} className="rounded bg-eerie/[0.06] px-1.5 py-0.5 font-mono text-[10px] text-eerie/70">
                        {status}
                      </code>
                    ))}
                  </span>
                )}
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
