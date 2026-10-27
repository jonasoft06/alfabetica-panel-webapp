"use client";

import { useId, useRef, useState } from "react";
import { ImagePlusIcon, Trash2Icon, UploadIcon } from "lucide-react";
import type { MediaItem } from "@/contracts/media";
import { ConfirmDialog } from "@/shared/components/feedback/confirm-dialog";
import { ErrorState } from "@/shared/components/feedback/error-state";
import { notify } from "@/shared/components/feedback/notify";
import { plural } from "@/shared/lib/format";
import { ACCEPTED_IMAGE_TYPES } from "@/core/media/prepare-image";
import { IMAGE_TOO_LARGE_MESSAGE } from "@/core/media/upload-flow";
import { Button } from "@/shared/ui/button";
import { ModalBody, ModalFooter } from "@/shared/ui/modal";
import { Skeleton } from "@/shared/ui/skeleton";
import { useDeleteMedia, useUploadCover, useUploadGalleryImages } from "../hooks/use-publication-mutations";
import { usePublicationMedia } from "../hooks/use-publications";

const ACCEPT = ACCEPTED_IMAGE_TYPES.join(",");

/** Hidden file input + the button that opens it (keeps the native picker accessible). */
function FilePicker({
  label,
  icon,
  multiple,
  busy,
  disabled,
  onFiles,
  variant = "outline",
}: {
  label: string;
  icon: React.ReactNode;
  multiple?: boolean;
  busy: boolean;
  disabled?: boolean;
  onFiles: (files: File[]) => void;
  variant?: "outline" | "default";
}) {
  const ref = useRef<HTMLInputElement>(null);
  const id = useId();
  return (
    <>
      <input
        ref={ref}
        id={id}
        type="file"
        accept={ACCEPT}
        multiple={multiple}
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          e.target.value = "";
          if (files.length) onFiles(files);
        }}
      />
      <Button type="button" variant={variant} size="sm" disabled={busy || disabled} onClick={() => ref.current?.click()}>
        {icon} {busy ? "Subiendo…" : label}
      </Button>
    </>
  );
}

export function PublicationMediaPanel({
  projectId,
  title,
  canWrite,
  onClose,
  className,
}: {
  projectId: string;
  title: string;
  canWrite: boolean;
  onClose: () => void;
  className?: string;
}) {
  const { data, error, isPending, refetch } = usePublicationMedia(projectId);
  const uploadCover = useUploadCover(projectId);
  const uploadGallery = useUploadGalleryImages(projectId);
  const deleteMedia = useDeleteMedia(projectId);
  const [toDelete, setToDelete] = useState<{ media: MediaItem; kind: "cover" | "gallery" } | null>(null);

  const onCover = (files: File[]) =>
    uploadCover.mutate(files[0], {
      onSuccess: () => notify.success("Portada actualizada", title),
      onError: (e) => notify.error(e, "No se pudo subir la portada"),
    });

  const onGallery = (files: File[]) =>
    uploadGallery.mutate(files, {
      onSuccess: ({ total, failed, tooLarge }) =>
        failed === 0
          ? notify.success(total === 1 ? "Imagen agregada" : `${total} imágenes agregadas`, title)
          : notify.error(
              null,
              "Galería incompleta",
              `${plural(failed, "imagen")} no se pudo subir.${tooLarge ? ` ${IMAGE_TOO_LARGE_MESSAGE}` : ""}`,
            ),
    });

  const confirmDelete = () => {
    if (!toDelete) return;
    const { media, kind } = toDelete;
    deleteMedia.mutate(media.id, {
      onSuccess: () => {
        setToDelete(null);
        notify.removed(kind === "cover" ? "Portada eliminada" : "Imagen eliminada", title);
      },
      onError: (e) => notify.error(e, "No se pudo eliminar la imagen"),
    });
  };

  return (
    <div className={className}>
      <ModalBody className="space-y-7">
        {error ? (
          <ErrorState error={error} onRetry={() => refetch()} />
        ) : isPending ? (
          <div className="space-y-4">
            <Skeleton className="h-44" />
            <Skeleton className="h-32" />
          </div>
        ) : (
          <>
            <section aria-labelledby="store-cover">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 id="store-cover" className="font-display text-base font-bold">
                    Portada
                  </h3>
                  <p className="text-xs text-muted-foreground">Se convierte a WebP en tu navegador. JPG, PNG o WebP, hasta 15 MB.</p>
                </div>
                {canWrite && (
                  <div className="flex gap-2">
                    {data.cover && (
                      <Button type="button" variant="outline" size="sm" onClick={() => setToDelete({ media: data.cover!, kind: "cover" })}>
                        <Trash2Icon /> Quitar
                      </Button>
                    )}
                    <FilePicker
                      label={data.cover ? "Reemplazar" : "Subir portada"}
                      icon={<UploadIcon />}
                      busy={uploadCover.isPending}
                      onFiles={onCover}
                      variant={data.cover ? "outline" : "default"}
                    />
                  </div>
                )}
              </div>
              <div className="mt-3 flex items-center justify-center rounded-2xl bg-muted p-4">
                {data.cover ? (
                  // eslint-disable-next-line @next/next/no-img-element -- presigned/CDN URL
                  <img src={data.cover.url} alt={`Portada de ${title}`} className="max-h-[260px] rounded-md object-contain shadow-md" />
                ) : (
                  <div className="flex h-40 w-full flex-col items-center justify-center gap-2 rounded-xl border-[1.5px] border-dashed border-eerie/20 text-center text-sm text-muted-foreground">
                    <ImagePlusIcon className="size-6" />
                    Sin portada
                  </div>
                )}
              </div>
            </section>

            <section aria-labelledby="store-gallery">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 id="store-gallery" className="font-display text-base font-bold">
                    Galería
                  </h3>
                  <p className="text-xs text-muted-foreground">{plural(data.gallery.length, "imagen", "imágenes")}</p>
                </div>
                {canWrite && <FilePicker label="Agregar imágenes" icon={<ImagePlusIcon />} multiple busy={uploadGallery.isPending} onFiles={onGallery} />}
              </div>
              {data.gallery.length === 0 ? (
                <p className="mt-3 rounded-2xl border-[1.5px] border-dashed border-eerie/20 px-4 py-8 text-center text-sm text-muted-foreground">
                  Aún no hay imágenes en la galería.
                </p>
              ) : (
                <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {data.gallery.map((media, i) => (
                    <li key={media.id} className="group relative overflow-hidden rounded-xl bg-muted">
                      {/* eslint-disable-next-line @next/next/no-img-element -- presigned/CDN URL */}
                      <img src={media.url} alt={`Imagen ${i + 1} de ${title}`} className="aspect-[4/3] w-full object-cover" loading="lazy" />
                      {canWrite && (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon-sm"
                          aria-label={`Eliminar imagen ${i + 1}`}
                          onClick={() => setToDelete({ media, kind: "gallery" })}
                          className="absolute top-2 right-2 bg-card hover:border-destructive/40 hover:text-destructive"
                        >
                          <Trash2Icon />
                        </Button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </ModalBody>
      <ModalFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Cerrar
        </Button>
      </ModalFooter>

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(open) => !open && setToDelete(null)}
        icon="trash"
        title={toDelete?.kind === "cover" ? "Quitar la portada" : "Eliminar esta imagen"}
        description={
          <>
            Se eliminará de <strong className="text-eerie">{title}</strong>. Esta acción no se puede deshacer.
          </>
        }
        safeguard={{ type: "none" }}
        confirmLabel="Eliminar"
        pending={deleteMedia.isPending}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
