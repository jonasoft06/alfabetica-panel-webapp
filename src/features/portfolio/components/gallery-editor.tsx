"use client";

import { useEffect, useId, useRef, useState } from "react";
import { LoaderCircleIcon, PlusIcon, XIcon } from "lucide-react";
import type { MediaItem } from "@/contracts/media";
import { notify } from "@/shared/components/feedback/notify";
import { SpineCard } from "@/shared/components/data/spine-card";
import { cn } from "@/shared/lib/cn";
import { plural } from "@/shared/lib/format";
import { useUploadGalleryImage } from "../hooks/use-portfolio-mutations";
import { validateImageFile } from "../schemas/portfolio.schema";

interface PendingImage {
  key: string;
  url: string;
}

export interface GalleryEditorProps {
  projectId: string;
  title: string;
  gallery: MediaItem[];
  canWrite: boolean;
  onRequestRemove: (media: MediaItem) => void;
}

/** Gallery grid: add (click or drop files) and remove images. Uploads run one after another. */
export function GalleryEditor({ projectId, title, gallery, canWrite, onRequestRemove }: GalleryEditorProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const upload = useUploadGalleryImage();
  const [pending, setPending] = useState<PendingImage[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pendingRef = useRef<PendingImage[]>([]);

  useEffect(() => {
    pendingRef.current = pending;
  }, [pending]);
  useEffect(() => () => pendingRef.current.forEach((p) => URL.revokeObjectURL(p.url)), []);

  const addFiles = async (files: FileList | File[] | null) => {
    if (!files || !canWrite) return;
    const valid: File[] = [];
    let problem: string | null = null;
    for (const file of Array.from(files)) {
      const message = validateImageFile(file);
      if (message) problem = `${file.name}: ${message}`;
      else valid.push(file);
    }
    setError(problem);
    const queued = valid.map((file) => ({ file, entry: { key: crypto.randomUUID(), url: URL.createObjectURL(file) } }));
    setPending((p) => [...p, ...queued.map((q) => q.entry)]);
    let ok = 0;
    for (const { file, entry } of queued) {
      try {
        await upload.mutateAsync({ projectId, file, alt: `Imagen de galería de ${title}`.slice(0, 200) });
        ok++;
      } catch (e) {
        notify.error(e, `No se pudo subir ${file.name}`);
      } finally {
        URL.revokeObjectURL(entry.url);
        setPending((p) => p.filter((x) => x.key !== entry.key));
      }
    }
    if (ok) notify.success(ok === 1 ? "Imagen agregada a la galería" : `${ok} imágenes agregadas a la galería`, title);
  };

  const total = gallery.length;
  return (
    <SpineCard spine="bg-turquoise" className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-base font-bold">Galería</h3>
          <p className="mt-1 text-xs text-muted-foreground">Interiores, contraportada y detalles.</p>
        </div>
        <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-[11px] font-extrabold text-muted-foreground">
          {plural(total, "imagen", "imágenes")}
        </span>
      </div>

      <div
        onDragOver={(e) => {
          if (!canWrite) return;
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          void addFiles(e.dataTransfer.files);
        }}
        className={cn(
          "mt-4 grid grid-cols-3 gap-3 rounded-xl sm:grid-cols-4",
          dragOver && "bg-turquoise/10 outline-2 -outline-offset-2 outline-turquoise outline-dashed",
        )}
      >
        {gallery.map((media, index) => (
          <figure key={media.id} className="relative aspect-square overflow-hidden rounded-xl bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={media.url} alt={`Imagen ${index + 1} de la galería de ${title}`} loading="lazy" className="size-full object-cover" />
            {canWrite && (
              <button
                type="button"
                onClick={() => onRequestRemove(media)}
                aria-label={`Quitar imagen ${index + 1} de la galería`}
                className="absolute top-1.5 right-1.5 inline-flex size-7 items-center justify-center rounded-lg bg-card/90 text-destructive shadow-sm outline-none hover:bg-card focus-visible:ring-[3px] focus-visible:ring-ring/40"
              >
                <XIcon className="size-3.5" />
              </button>
            )}
          </figure>
        ))}
        {pending.map((p) => (
          <div key={p.key} role="status" aria-label="Subiendo imagen" className="relative aspect-square overflow-hidden rounded-xl bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.url} alt="" className="size-full object-cover opacity-50" />
            <LoaderCircleIcon className="absolute inset-0 m-auto size-5 animate-spin" />
          </div>
        ))}
        {canWrite && (
          <>
            <input
              ref={inputRef}
              id={inputId}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={(e) => {
                void addFiles(e.target.files);
                e.target.value = "";
              }}
            />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border-[1.5px] border-dashed border-eerie/25 text-xs font-semibold text-muted-foreground outline-none transition-colors hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/30"
            >
              <PlusIcon className="size-5" />
              Agregar
            </button>
          </>
        )}
      </div>
      {total === 0 && pending.length === 0 && !canWrite && (
        <p className="mt-3 text-xs text-muted-foreground">Este título aún no tiene imágenes en la galería.</p>
      )}
      {error && (
        <p role="alert" className="mt-3 text-xs font-semibold text-destructive">
          {error}
        </p>
      )}
      {canWrite && <p className="mt-3 text-xs text-muted-foreground">También puedes arrastrar los archivos sobre esta zona · JPG, PNG o WebP, hasta 15 MB.</p>}
    </SpineCard>
  );
}
