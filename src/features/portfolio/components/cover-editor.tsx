"use client";

import { useEffect, useId, useRef, useState } from "react";
import { CheckIcon, LoaderCircleIcon, Trash2Icon, UploadIcon } from "lucide-react";
import type { MediaItem } from "@/contracts/media";
import { PORTFOLIO_COVER_SIZE } from "@/contracts/portfolio";
import { UserFacingError } from "@/core/http/api-error";
import { notify } from "@/shared/components/feedback/notify";
import { SpineCard } from "@/shared/components/data/spine-card";
import { cn } from "@/shared/lib/cn";
import { formatBytes } from "@/shared/lib/format";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { useUploadCover } from "../hooks/use-portfolio-mutations";
import { validateImageFile } from "../schemas/portfolio.schema";
import { CoverThumb } from "@/shared/components/data/cover-thumb";

export interface CoverEditorProps {
  projectId: string;
  title: string;
  cover: MediaItem | null;
  canWrite: boolean;
  onRequestRemove: (media: MediaItem) => void;
}

/** Cover card: preview, replace (prepareImage → presigned upload → confirm) and remove. */
export function CoverEditor({ projectId, title, cover, canWrite, onRequestRemove }: CoverEditorProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const upload = useUploadCover();
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Object URLs are released when replaced or when the editor unmounts.
  useEffect(() => () => void (preview && URL.revokeObjectURL(preview)), [preview]);

  const pick = (file: File | undefined) => {
    if (!file) return;
    const problem = validateImageFile(file);
    setError(problem);
    if (problem) return;
    setPreview(URL.createObjectURL(file));
    upload.mutate(
      { projectId, file, alt: `Portada de ${title}`.slice(0, 200), replaceMediaId: cover?.id },
      {
        onSuccess: () => notify.success(cover ? "Portada reemplazada" : "Portada subida", title),
        onError: (e) => {
          if (e instanceof UserFacingError) setError(e.message);
          else setError(cover ? "No se pudo reemplazar la portada. Si el título quedó sin portada, sube la imagen de nuevo." : "No se pudo subir la portada. Intenta de nuevo.");
          notify.error(e, "No se pudo subir la portada");
        },
        onSettled: () => setPreview(null),
      },
    );
  };

  const shown = preview ? { url: preview } : cover;
  return (
    <SpineCard spine="bg-module" className="p-5">
      <div className="flex gap-5">
        <div className="relative w-[120px] shrink-0 md:w-[168px]">
          <CoverThumb cover={shown} title={title} className={cn("w-full rounded-lg", upload.isPending && "opacity-60")} />
          {upload.isPending && (
            <span role="status" aria-label="Subiendo portada" className="absolute inset-0 flex items-center justify-center">
              <LoaderCircleIcon className="size-6 animate-spin text-eerie" />
            </span>
          )}
          {cover && !upload.isPending && (
            <Badge tone="dark" className="absolute top-2 right-2">
              Portada
            </Badge>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-base font-bold">Portada</h3>
          <p className="mt-1 text-xs text-muted-foreground">Es la imagen que representa al título en el portafolio y en la web principal.</p>
          {canWrite && (
            <div className="mt-3 flex flex-wrap gap-2">
              <input
                ref={inputRef}
                id={inputId}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={(e) => {
                  pick(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
              <Button type="button" variant="outline" size="sm" disabled={upload.isPending} onClick={() => inputRef.current?.click()}>
                <UploadIcon /> {cover ? "Cambiar portada" : "Subir portada"}
              </Button>
              {cover && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={upload.isPending}
                  onClick={() => onRequestRemove(cover)}
                  className="border-tangerine/40 text-tangerine hover:bg-tangerine/10"
                >
                  <Trash2Icon /> Quitar
                </Button>
              )}
            </div>
          )}
          <p className="mt-3 text-xs text-muted-foreground">JPG, PNG o WebP · hasta 15 MB · se recorta al centro a {PORTFOLIO_COVER_SIZE.width} × {PORTFOLIO_COVER_SIZE.height} px (3:4)</p>
          {error ? (
            <p role="alert" className="mt-3 rounded-lg bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive">
              {error}
            </p>
          ) : cover ? (
            <p className="mt-3 flex items-center gap-2 rounded-lg bg-turquoise/10 px-3 py-2 text-xs font-semibold text-turquoise-dark">
              <CheckIcon className="size-3.5 shrink-0" />
              Portada lista{cover.width && cover.height ? ` · ${cover.width} × ${cover.height} px` : ""} · {formatBytes(cover.sizeBytes)}
            </p>
          ) : (
            <p className="mt-3 rounded-lg bg-tangerine/10 px-3 py-2 text-xs font-semibold text-tangerine">Este título aún no tiene portada.</p>
          )}
        </div>
      </div>
    </SpineCard>
  );
}
