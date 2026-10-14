"use client";

import { RotateCwIcon, TriangleAlertIcon } from "lucide-react";
import { describeError } from "@/core/http/api-error";
import { Button } from "@/shared/ui/button";

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center px-6 py-14 text-center">
      <span className="flex size-12 items-center justify-center rounded-2xl bg-tangerine/15 text-tangerine">
        <TriangleAlertIcon className="size-5" />
      </span>
      <h3 className="mt-4 font-display text-lg font-bold">No pudimos cargar la información</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{describeError(error)}</p>
      {onRetry && (
        <Button variant="outline" className="mt-5" onClick={onRetry}>
          <RotateCwIcon /> Reintentar
        </Button>
      )}
    </div>
  );
}
