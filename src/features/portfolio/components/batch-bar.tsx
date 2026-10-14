"use client";

import { ArrowUpIcon, InfoIcon, LoaderCircleIcon, XIcon } from "lucide-react";
import { Button } from "@/shared/ui/button";
import type { BatchPlan } from "../lib/batch-plan";

export interface BatchBarProps {
  count: number;
  plan: BatchPlan;
  notes: string[];
  pending: boolean;
  onPublish: () => void;
  onUnpublish: () => void;
  onClear: () => void;
}

/** Sticky action bar for the batch selection (above the bottom nav on mobile). */
export function BatchBar({ count, plan, notes, pending, onPublish, onUnpublish, onClear }: BatchBarProps) {
  return (
    <div
      role="region"
      aria-label="Acciones sobre la selección"
      className="fixed inset-x-3 bottom-[84px] z-40 mx-auto flex max-w-[860px] flex-col gap-3 rounded-2xl bg-eerie p-3 text-near-white shadow-2xl md:bottom-6 md:flex-row md:items-center md:gap-4 md:px-4 md:py-3"
    >
      <div className="flex items-center justify-between gap-3 md:contents">
        <p className="flex items-center gap-2.5 md:min-w-[170px]">
          <span className="font-display text-2xl leading-none font-bold">{count}</span>
          <span className="text-[13px] leading-tight font-bold">{count === 1 ? "título seleccionado" : "títulos seleccionados"}</span>
        </p>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onClear}
          aria-label="Limpiar selección"
          className="border-0 bg-near-white/10 text-near-white hover:bg-near-white/20 hover:text-near-white md:order-last"
        >
          <XIcon />
        </Button>
      </div>
      {notes.length > 0 && (
        <>
          <span aria-hidden className="hidden h-9 w-px bg-near-white/20 md:block" />
          <p role="status" className="flex flex-1 items-start gap-2 text-xs leading-snug text-near-white/80">
            <InfoIcon className="mt-px size-3.5 shrink-0 text-tan-sun" />
            <span>{notes.join(" ")}</span>
          </p>
        </>
      )}
      {notes.length === 0 && <span className="hidden flex-1 md:block" />}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={pending || plan.toUnpublish.length === 0}
          onClick={onUnpublish}
          className="h-10 flex-1 border-near-white/30 bg-transparent px-4 text-near-white hover:bg-near-white/10 hover:text-near-white md:flex-none"
        >
          Quitar de la web
        </Button>
        <Button size="sm" disabled={pending || plan.toPublish.length === 0} onClick={onPublish} className="h-10 flex-1 px-4 md:flex-none">
          {pending ? <LoaderCircleIcon className="animate-spin" /> : <ArrowUpIcon />} Publicar
        </Button>
      </div>
    </div>
  );
}
