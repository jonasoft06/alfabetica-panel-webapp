"use client";

import { useEffect, useId, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckIcon, PlusIcon } from "lucide-react";
import type { ProjectDetail } from "@/contracts/projects";
import type { PublicationType } from "@/contracts/publication";
import { clientEnv } from "@/config/env.client";
import { usePermission } from "@/core/auth/session-provider";
import { notify } from "@/shared/components/feedback/notify";
import { Field } from "@/shared/components/form/field";
import { TagInput } from "@/shared/components/form/tag-input";
import { formatRelative, plural } from "@/shared/lib/format";
import type { RelationKey } from "@/shared/lib/relations";
import { Button } from "@/shared/ui/button";
import { Input, Textarea } from "@/shared/ui/input";
import { Modal, ModalBody, ModalContent, ModalDescription, ModalFooter, ModalHeader, ModalTitle } from "@/shared/ui/modal";
import { Skeleton } from "@/shared/ui/skeleton";
import { useProject } from "../hooks/use-projects";
import { useAddRelation, useCreateProject, useUpdateProject } from "../hooks/use-project-mutations";
import { emptyProjectForm, projectFormSchema, toCreatePayload, toUpdatePayload, type ProjectFormValues } from "../schemas/project-form.schema";
import { PUBLICATION_TYPE_LABELS, RelationManager, RelationSelector } from "./relation-cards";

type Mode = { kind: "create" } | { kind: "edit"; projectId: string };

export interface ProjectFormModalProps {
  mode: Mode | null;
  onClose: () => void;
  /** Relations already scheduled for removal (deferred, undoable). */
  hiddenRelations: (projectId: string) => RelationKey[];
  onRequestRemoveRelation: (project: ProjectDetail, relation: RelationKey) => void;
  onRequestDelete: (project: { id: string; title: string }) => void;
  onView: (projectId: string) => void;
}

function toFormValues(project: ProjectDetail): ProjectFormValues {
  return {
    title: project.title,
    subtitle: project.subtitle ?? "",
    issueYear: project.issueYear ? String(project.issueYear) : "",
    description: project.description ?? "",
    client: project.client ?? "",
    tags: project.tags,
  };
}

export function ProjectFormModal(props: ProjectFormModalProps) {
  return (
    <Modal open={!!props.mode} onOpenChange={(open) => !open && props.onClose()}>
      {props.mode && <ProjectFormContent key={props.mode.kind === "edit" ? props.mode.projectId : "create"} {...props} mode={props.mode} />}
    </Modal>
  );
}

function ProjectFormContent({ mode, onClose, hiddenRelations, onRequestRemoveRelation, onRequestDelete, onView }: ProjectFormModalProps & { mode: Mode }) {
  const isEdit = mode.kind === "edit";
  const { data: project, isPending: loading } = useProject(isEdit ? mode.projectId : null);
  const storeEnabled = clientEnv.features.store;
  const canPublication = usePermission("publication");
  const ids = { title: useId(), subtitle: useId(), year: useId(), description: useId(), client: useId(), tags: useId() };

  const [relations, setRelations] = useState<RelationKey[]>(["portfolio"]);
  const [publicationType, setPublicationType] = useState<PublicationType>("SALE");
  const create = useCreateProject();
  const update = useUpdateProject();
  const addRelation = useAddRelation();

  const form = useForm<ProjectFormValues>({ resolver: zodResolver(projectFormSchema), defaultValues: emptyProjectForm, mode: "onTouched" });
  const { register, handleSubmit, control, reset, formState } = form;
  const { errors, isSubmitting, dirtyFields, isDirty } = formState;

  useEffect(() => {
    if (project) reset(toFormValues(project));
  }, [project, reset]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      if (mode.kind === "create") {
        const withPublication = relations.includes("publication") && storeEnabled && canPublication;
        const created = await create.mutateAsync({
          body: {
            ...toCreatePayload(values),
            ...(relations.includes("portfolio") ? { portfolio: {} } : {}),
            ...(withPublication ? { publication: { type: publicationType } } : {}),
          },
          withProduction: relations.includes("production"),
        });
        const labels = relations
          .filter((r) => r !== "publication" || withPublication)
          .map((r) => ({ portfolio: "Portafolio", publication: "Tienda", production: "Producción" })[r]);
        notify.success("Proyecto creado", `${created.title}${labels.length ? ` · con ${labels.join(" y ")}` : ""}`, {
          label: "Ver",
          onClick: () => onView(created.id),
        });
      } else {
        if (!isDirty) return onClose();
        const saved = await update.mutateAsync({ id: mode.projectId, body: toUpdatePayload(values, dirtyFields) });
        notify.success("Cambios guardados", saved.title);
      }
      onClose();
    } catch (error) {
      notify.error(error, isEdit ? "No se pudieron guardar los cambios" : "No se pudo crear el proyecto");
    }
  });

  const active: RelationKey[] = project
    ? ([project.portfolio && "portfolio", project.publication && "publication", project.production && "production"].filter(Boolean) as RelationKey[]).filter(
        (r) => !hiddenRelations(project.id).includes(r),
      )
    : [];
  const summaries: Partial<Record<RelationKey, string | null>> = project
    ? {
        portfolio:
          project.portfolio &&
          `${project.portfolio.isPublished ? "Publicado en la web" : "No publicado"} · ${project.portfolio.coverMediaId ? "portada confirmada" : "sin portada"}`,
        publication:
          project.publication && `${PUBLICATION_TYPE_LABELS[project.publication.type]} · ${project.publication.isPublished ? "publicado" : "sin publicar"}`,
        production: project.production && `${project.production.publicCode}`,
      }
    : {};

  const selectedCount = relations.filter((r) => r !== "publication" || (storeEnabled && canPublication)).length;

  return (
    <ModalContent size="lg">
      <ModalHeader>
        <ModalTitle>{isEdit ? "Editar proyecto" : "Nuevo proyecto"}</ModalTitle>
        <ModalDescription>
          {isEdit
            ? project
              ? `${project.title} · actualizado ${formatRelative(project.updatedAt).toLowerCase()}`
              : "Cargando…"
            : "Solo el título es obligatorio; lo demás puedes completarlo después."}
        </ModalDescription>
      </ModalHeader>

      <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col" noValidate>
        <ModalBody className="space-y-5">
          {isEdit && loading ? (
            <div className="space-y-4">
              <Skeleton className="h-11" />
              <Skeleton className="h-11" />
              <Skeleton className="h-24" />
            </div>
          ) : (
            <>
              <div className="grid gap-5 md:grid-cols-[1fr_240px]">
                <Field
                  label="Título"
                  htmlFor={ids.title}
                  required
                  error={errors.title?.message}
                  hint={!isEdit && "Así aparecerá en el listado, en el portafolio y en la tienda."}
                >
                  <Input
                    id={ids.title}
                    placeholder="Ej. Historia de México — Vol. II"
                    autoFocus={!isEdit}
                    aria-invalid={!!errors.title}
                    {...register("title")}
                  />
                </Field>
                <Field label="Año" htmlFor={ids.year} optional error={errors.issueYear?.message}>
                  <Input
                    id={ids.year}
                    inputMode="numeric"
                    placeholder={String(new Date().getFullYear())}
                    maxLength={4}
                    aria-invalid={!!errors.issueYear}
                    {...register("issueYear")}
                  />
                </Field>
              </div>
              <div className="grid gap-5 md:grid-cols-[1fr_240px]">
                <Field label="Subtítulo" htmlFor={ids.subtitle} optional error={errors.subtitle?.message}>
                  <Input id={ids.subtitle} placeholder="Ej. Serie secundaria · 2.º grado" {...register("subtitle")} />
                </Field>
                <Field label="Cliente" htmlFor={ids.client} optional error={errors.client?.message}>
                  <Input id={ids.client} placeholder="Ej. SEP Jalisco" {...register("client")} />
                </Field>
              </div>
              <Field label="Descripción" htmlFor={ids.description} optional error={errors.description?.message}>
                <Textarea
                  id={ids.description}
                  rows={3}
                  placeholder="Una o dos líneas sobre el contenido del título, su enfoque y a quién va dirigido."
                  {...register("description")}
                />
              </Field>
              <Field label="Tags" htmlFor={ids.tags} optional error={errors.tags?.message} hint="Enter o coma para agregar.">
                <Controller control={control} name="tags" render={({ field }) => <TagInput id={ids.tags} value={field.value} onChange={field.onChange} />} />
              </Field>

              <section aria-labelledby={`${ids.title}-rel`} className="pt-1">
                <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                  <h3 id={`${ids.title}-rel`} className="font-display text-base font-bold">
                    Relaciones del proyecto
                  </h3>
                  <p className={isEdit ? "text-xs font-semibold text-destructive" : "text-xs text-muted-foreground"}>
                    {isEdit ? "Quitar una relación borra su información" : "Puedes elegir una, varias o ninguna"}
                  </p>
                </div>
                {isEdit && project ? (
                  <RelationManager
                    active={active}
                    summaries={summaries}
                    storeEnabled={storeEnabled}
                    busy={addRelation.isPending ? addRelation.variables?.relation : null}
                    onAdd={(relation) =>
                      addRelation.mutate(
                        { id: project.id, relation },
                        {
                          onSuccess: () =>
                            notify.success(
                              "Relación agregada",
                              `${project.title} · ${{ portfolio: "Portafolio", publication: "Tienda", production: "Producción" }[relation]}`,
                            ),
                          onError: (e) => notify.error(e, "No se pudo agregar la relación"),
                        },
                      )
                    }
                    onRemove={(relation) => onRequestRemoveRelation(project, relation)}
                  />
                ) : (
                  <RelationSelector
                    value={relations}
                    onChange={setRelations}
                    publicationType={publicationType}
                    onPublicationTypeChange={setPublicationType}
                    storeEnabled={storeEnabled}
                    canPublication={canPublication}
                  />
                )}
                {!isEdit && <p className="mt-3 text-xs text-muted-foreground">Cada relación se puede agregar o quitar más adelante desde el proyecto.</p>}
              </section>
            </>
          )}
        </ModalBody>

        <ModalFooter className="md:justify-between">
          {isEdit && project ? (
            <button
              type="button"
              onClick={() => onRequestDelete(project)}
              className="self-center text-sm font-bold text-destructive hover:underline md:self-auto"
            >
              Eliminar proyecto
            </button>
          ) : (
            <p className="hidden text-xs text-muted-foreground md:block">
              {plural(selectedCount, "relación seleccionada", "relaciones seleccionadas")}
              {!storeEnabled && " · Venta aún no disponible"}
            </p>
          )}
          <div className="flex flex-col-reverse gap-2 md:flex-row">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || (isEdit && loading)}>
              {isEdit ? <CheckIcon /> : <PlusIcon />}
              {isSubmitting ? "Guardando…" : isEdit ? "Guardar cambios" : "Crear proyecto"}
            </Button>
          </div>
        </ModalFooter>
      </form>
    </ModalContent>
  );
}
