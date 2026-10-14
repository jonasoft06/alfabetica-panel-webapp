"use client";

import { useState } from "react";
import { restrictToVerticalAxis } from "@/shared/lib/dnd";
import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { PlusIcon } from "lucide-react";
import type { PublicationSection, PublicationType } from "@/contracts/publication";
import { ConfirmDialog } from "@/shared/components/feedback/confirm-dialog";
import { ErrorState } from "@/shared/components/feedback/error-state";
import { notify } from "@/shared/components/feedback/notify";
import { plural } from "@/shared/lib/format";
import { Button } from "@/shared/ui/button";
import { ModalBody, ModalFooter } from "@/shared/ui/modal";
import { Skeleton } from "@/shared/ui/skeleton";
import {
  useCreateSection,
  useDeleteMedia,
  useDeleteSection,
  useReorderSections,
  useUpdateSection,
  useUploadSectionPdf,
} from "../hooks/use-publication-mutations";
import { usePublicationSections } from "../hooks/use-publications";
import { validatePdf } from "../lib/pdf-validation";
import { SectionForm } from "./section-form";
import { SectionRow, type SectionRowActions } from "./section-row";

type Editing = { kind: "new" } | { kind: "edit"; id: string } | null;

const label = (sections: PublicationSection[], id: string | number) => sections.find((s) => s.id === id)?.label ?? "sección";

const announcements = (sections: PublicationSection[]) => ({
  onDragStart: ({ active }: { active: { id: string | number } }) => `Tomaste ${label(sections, active.id)}.`,
  onDragOver: ({ active, over }: { active: { id: string | number }; over: { id: string | number } | null }) =>
    over
      ? `${label(sections, active.id)} está sobre la posición ${sections.findIndex((s) => s.id === over.id) + 1}.`
      : `${label(sections, active.id)} ya no está sobre una posición.`,
  onDragEnd: ({ active, over }: { active: { id: string | number }; over: { id: string | number } | null }) =>
    over
      ? `${label(sections, active.id)} quedó en la posición ${sections.findIndex((s) => s.id === over.id) + 1}.`
      : `${label(sections, active.id)} no se movió.`,
  onDragCancel: ({ active }: { active: { id: string | number } }) => `Se canceló el movimiento de ${label(sections, active.id)}.`,
});

export function PublicationSectionsPanel({
  projectId,
  title,
  type,
  canWrite,
  onClose,
  className,
}: {
  projectId: string;
  title: string;
  type: PublicationType | undefined;
  canWrite: boolean;
  onClose: () => void;
  className?: string;
}) {
  const { data, error, isPending, refetch } = usePublicationSections(projectId);
  const create = useCreateSection(projectId);
  const update = useUpdateSection(projectId);
  const remove = useDeleteSection(projectId);
  const reorder = useReorderSections(projectId);
  const uploadPdf = useUploadSectionPdf(projectId);
  const deleteMedia = useDeleteMedia(projectId);
  const [editing, setEditing] = useState<Editing>(null);
  const [toDelete, setToDelete] = useState<PublicationSection | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const sections = data ?? [];
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const from = sections.findIndex((s) => s.id === active.id);
    const to = sections.findIndex((s) => s.id === over.id);
    reorder.mutate(
      arrayMove(sections, from, to).map((s) => s.id),
      { onError: (e) => notify.error(e, "No se pudo guardar el nuevo orden") },
    );
  };

  const actions: SectionRowActions = {
    onEdit: (section) => setEditing({ kind: "edit", id: section.id }),
    onDelete: setToDelete,
    onPickPdf: (section, file) => {
      const problem = validatePdf(file);
      if (problem) return notify.error(new Error(problem), "No se pudo subir el PDF");
      setUploadingId(section.id);
      uploadPdf.mutate(
        { sectionId: section.id, file },
        {
          onSuccess: () => notify.success("PDF subido", `${section.label} · ${file.name}`),
          onError: (e) => notify.error(e, "No se pudo subir el PDF"),
          onSettled: () => setUploadingId(null),
        },
      );
    },
    onRemovePdf: (section) =>
      section.pdf &&
      deleteMedia.mutate(section.pdf.id, {
        onSuccess: () => notify.removed("PDF quitado", section.label),
        onError: (e) => notify.error(e, "No se pudo quitar el PDF"),
      }),
  };

  const editingSection = editing?.kind === "edit" ? sections.find((s) => s.id === editing.id) : undefined;

  return (
    <div className={className}>
      <ModalBody className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="font-display text-base font-bold">Secciones</h3>
            <p className="text-xs text-muted-foreground">
              {data ? plural(sections.length, "sección", "secciones") : "Cargando…"}
              {canWrite && sections.length > 1 && " · arrastra el asa o usa el teclado (espacio y flechas) para reordenar"}
            </p>
          </div>
          {canWrite && (
            <Button type="button" size="sm" onClick={() => setEditing({ kind: "new" })} disabled={editing?.kind === "new"}>
              <PlusIcon /> Agregar sección
            </Button>
          )}
        </div>
        {type === "DOI" && (
          <p className="rounded-xl bg-grape/10 px-3.5 py-2.5 text-[13px] text-eerie/80">
            En una publicación DOI cada sección es un capítulo: sube su PDF (máx. 50 MB) para que el público pueda leerlo.
          </p>
        )}

        {error ? (
          <ErrorState error={error} onRetry={() => refetch()} />
        ) : isPending ? (
          <div className="space-y-3">
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </div>
        ) : (
          <>
            {sections.length === 0 && editing?.kind !== "new" && (
              <p className="rounded-2xl border-[1.5px] border-dashed border-eerie/20 px-4 py-10 text-center text-sm text-muted-foreground">
                Esta publicación todavía no tiene secciones.{canWrite ? " Agrega la primera con el botón de arriba." : ""}
              </p>
            )}
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              modifiers={[restrictToVerticalAxis]}
              onDragEnd={onDragEnd}
              accessibility={{
                announcements: announcements(sections),
                screenReaderInstructions: { draggable: "Para reordenar, presiona espacio, mueve con las flechas y vuelve a presionar espacio para soltar." },
              }}
            >
              <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                <ol aria-label="Secciones de la publicación" className="space-y-2.5">
                  {sections.map((section, index) =>
                    editingSection?.id === section.id ? (
                      <li key={section.id}>
                        <SectionForm
                          initial={{ label: section.label, description: section.description ?? "" }}
                          submitLabel="Guardar"
                          pending={update.isPending}
                          onCancel={() => setEditing(null)}
                          onSubmit={(values) =>
                            update.mutate(
                              { sectionId: section.id, body: { label: values.label, description: values.description || null } },
                              {
                                onSuccess: () => {
                                  setEditing(null);
                                  notify.success("Sección actualizada", values.label);
                                },
                                onError: (e) => notify.error(e, "No se pudo guardar la sección"),
                              },
                            )
                          }
                        />
                      </li>
                    ) : (
                      <SectionRow
                        key={section.id}
                        section={section}
                        position={index + 1}
                        canWrite={canWrite}
                        uploading={uploadingId === section.id}
                        actions={actions}
                      />
                    ),
                  )}
                </ol>
              </SortableContext>
            </DndContext>
            {editing?.kind === "new" && (
              <SectionForm
                submitLabel="Agregar"
                pending={create.isPending}
                onCancel={() => setEditing(null)}
                onSubmit={(values) =>
                  create.mutate(
                    { label: values.label, ...(values.description ? { description: values.description } : {}) },
                    {
                      onSuccess: () => {
                        setEditing(null);
                        notify.success("Sección agregada", `${values.label} · ${title}`);
                      },
                      onError: (e) => notify.error(e, "No se pudo agregar la sección"),
                    },
                  )
                }
              />
            )}
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
        title="Eliminar esta sección"
        description={
          <>
            Se eliminará <strong className="text-eerie">{toDelete?.label}</strong> de {title}.
          </>
        }
        consequences={["El nombre y la descripción de la sección", ...(toDelete?.pdf ? [`Su PDF (${toDelete.pdf.originalName ?? "documento.pdf"})`] : [])]}
        safeguard={{ type: "none" }}
        confirmLabel="Eliminar sección"
        pending={remove.isPending}
        onConfirm={() =>
          toDelete &&
          remove.mutate(toDelete.id, {
            onSuccess: () => {
              notify.removed("Sección eliminada", toDelete.label);
              setToDelete(null);
            },
            onError: (e) => notify.error(e, "No se pudo eliminar la sección"),
          })
        }
      />
    </div>
  );
}
