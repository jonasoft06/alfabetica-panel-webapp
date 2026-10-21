"use client";

import { useState } from "react";
import type { MediaItem } from "@/contracts/media";
import type { PortfolioListItem } from "@/contracts/portfolio";
import { ConfirmDialog } from "@/shared/components/feedback/confirm-dialog";
import { notify } from "@/shared/components/feedback/notify";
import { formatRelative } from "@/shared/lib/format";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Modal, ModalBody, ModalClose, ModalContent, ModalDescription, ModalFooter, ModalHeader, ModalTitle } from "@/shared/ui/modal";
import { Skeleton } from "@/shared/ui/skeleton";
import { useDeleteMedia } from "../hooks/use-portfolio-mutations";
import { usePortfolioCover, usePortfolioGallery } from "../hooks/use-portfolio";
import { CoverEditor } from "./cover-editor";
import { GalleryEditor } from "./gallery-editor";
import { ProjectInfoPanel } from "./project-info-panel";
import { PublishPanel } from "./publish-panel";

export interface PortfolioEditModalProps {
  item: PortfolioListItem | null;
  onClose: () => void;
  canWrite: boolean;
  publishedCount: number;
  maxItems: number;
}

type RemoveTarget = { kind: "cover" | "gallery"; media: MediaItem } | null;

export function PortfolioEditModal(props: PortfolioEditModalProps) {
  return (
    <Modal open={!!props.item} onOpenChange={(open) => !open && props.onClose()}>
      {props.item && <EditContent key={props.item.id} {...props} item={props.item} />}
    </Modal>
  );
}

function EditContent({ item, canWrite, publishedCount, maxItems }: PortfolioEditModalProps & { item: PortfolioListItem }) {
  const cover = usePortfolioCover(item.projectId);
  const gallery = usePortfolioGallery(item.projectId);
  const deleteMedia = useDeleteMedia();
  const [removeTarget, setRemoveTarget] = useState<RemoveTarget>(null);

  const confirmRemove = () => {
    if (!removeTarget) return;
    const target = removeTarget;
    deleteMedia.mutate(target.media.id, {
      onSuccess: () => {
        setRemoveTarget(null);
        notify.removed(target.kind === "cover" ? "Portada eliminada" : "Imagen eliminada de la galería", item.title);
      },
      onError: (e) => notify.error(e, "No se pudo eliminar la imagen"),
    });
  };

  return (
    <ModalContent size="lg" className="md:max-w-[1040px]">
      <ModalHeader className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <div className="min-w-0">
          <ModalTitle>{item.title}</ModalTitle>
          <ModalDescription>
            Portafolio · último cambio {formatRelative(item.updatedAt).toLowerCase()}
            {!canWrite && " · solo lectura"}
          </ModalDescription>
        </div>
        <Badge size="md" tone={item.isPublished ? "turquoise" : "neutral"} className="self-start md:mt-2">
          {item.isPublished ? "Publicado" : "No publicado"}
        </Badge>
      </ModalHeader>

      <ModalBody className="bg-muted/40">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
          <div className="space-y-5">
            {cover.isPending || gallery.isPending ? (
              <>
                <Skeleton className="h-60 rounded-2xl" />
                <Skeleton className="h-52 rounded-2xl" />
              </>
            ) : (
              <>
                <CoverEditor
                  projectId={item.projectId}
                  title={item.title}
                  cover={cover.isError ? item.cover : (cover.data ?? null)}
                  canWrite={canWrite}
                  onRequestRemove={(m) => setRemoveTarget({ kind: "cover", media: m })}
                />
                <GalleryEditor
                  projectId={item.projectId}
                  title={item.title}
                  gallery={gallery.data ?? []}
                  canWrite={canWrite}
                  onRequestRemove={(m) => setRemoveTarget({ kind: "gallery", media: m })}
                />
              </>
            )}
            {(cover.isError || gallery.isError) && (
              <p role="alert" className="text-xs font-semibold text-destructive">
                No se pudo cargar la portada y la galería. Cierra y vuelve a abrir este título.
              </p>
            )}
          </div>
          <div className="space-y-5">
            <ProjectInfoPanel projectId={item.projectId} />
            <PublishPanel item={item} publishedCount={publishedCount} maxItems={maxItems} canWrite={canWrite} />
          </div>
        </div>
      </ModalBody>

      <ModalFooter>
        {canWrite && <p className="text-xs text-muted-foreground md:mr-auto">Los cambios de portada, galería y publicación se guardan al instante.</p>}
        <ModalClose asChild>
          <Button type="button" variant="outline">
            Cerrar
          </Button>
        </ModalClose>
      </ModalFooter>

      <ConfirmDialog
        open={!!removeTarget}
        onOpenChange={(open) => !open && setRemoveTarget(null)}
        icon="trash"
        title={removeTarget?.kind === "cover" ? "Quitar la portada" : "Quitar esta imagen de la galería"}
        description={
          <>
            {removeTarget?.kind === "cover" ? "El título quedará sin portada hasta que subas otra." : "La imagen se eliminará de la galería de este título."}{" "}
            Esta acción no se puede deshacer.
          </>
        }
        safeguard={{ type: "none" }}
        confirmLabel="Quitar"
        pending={deleteMedia.isPending}
        onConfirm={confirmRemove}
      />
    </ModalContent>
  );
}
