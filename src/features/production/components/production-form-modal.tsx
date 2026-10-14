"use client";

import { useEffect, useId, useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckIcon } from "lucide-react";
import type { ProductionListItem, ProductionStage } from "@/contracts/production";
import { ApiError } from "@/core/http/api-error";
import { notify } from "@/shared/components/feedback/notify";
import { Field } from "@/shared/components/form/field";
import { formatDate, formatRelative } from "@/shared/lib/format";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Modal, ModalBody, ModalContent, ModalDescription, ModalFooter, ModalHeader, ModalTitle } from "@/shared/ui/modal";
import { Skeleton } from "@/shared/ui/skeleton";
import { useProductionDetail, useUpdateProduction } from "../hooks/use-production";
import { normalizeClickupId } from "../lib/clickup";
import {
  computeEndDate,
  emptyProductionForm,
  productionFormSchema,
  toFormValues,
  toUpsertPayload,
  type ProductionFormValues,
} from "../schemas/production-form.schema";
import { StageStepper } from "./stage-stepper";

export interface ProductionFormModalProps {
  target: ProductionListItem | null;
  stages: ProductionStage[];
  canWrite: boolean;
  onClose: () => void;
}

export function ProductionFormModal(props: ProductionFormModalProps) {
  return (
    <Modal open={!!props.target} onOpenChange={(open) => !open && props.onClose()}>
      {props.target && <ProductionFormContent key={props.target.projectId} {...props} target={props.target} />}
    </Modal>
  );
}

function ProductionFormContent({ target, stages, canWrite, onClose }: ProductionFormModalProps & { target: ProductionListItem }) {
  const { data: production, isPending: loading } = useProductionDetail(target.projectId);
  const update = useUpdateProduction();
  const ids = { code: useId(), clickup: useId(), start: useId(), days: useId(), end: useId() };

  const form = useForm<ProductionFormValues>({ resolver: zodResolver(productionFormSchema), defaultValues: emptyProductionForm, mode: "onTouched" });
  const { register, handleSubmit, reset, setValue, setError, control, formState } = form;
  const { errors, isSubmitting, isDirty } = formState;

  useEffect(() => {
    if (production) reset(toFormValues(production));
  }, [production, reset]);

  const [startDate, estimatedTotalDays, clickupListId, currentStageId] = useWatch({
    control,
    name: ["startDate", "estimatedTotalDays", "clickupListId", "currentStageId"],
  });
  const endDate = useMemo(() => computeEndDate({ startDate, estimatedTotalDays }), [startDate, estimatedTotalDays]);
  const linked = !!clickupListId.trim();
  const currentStage = stages.find((s) => s.id === currentStageId);

  const onSubmit = handleSubmit(async (values) => {
    if (!isDirty) return onClose();
    try {
      await update.mutateAsync({ projectId: target.projectId, body: toUpsertPayload(values) });
      notify.success("Producción actualizada", target.title);
      onClose();
    } catch (error) {
      if (error instanceof ApiError && error.isConflict) return setError("publicCode", { message: "Ese código ya está en uso por otra producción." });
      notify.error(error, "No se pudieron guardar los cambios");
    }
  });

  const readOnly = !canWrite;

  return (
    <ModalContent size="lg">
      <ModalHeader>
        <ModalTitle>{target.title}</ModalTitle>
        <ModalDescription>
          Producción{production ? ` · actualizada ${formatRelative(production.updatedAt).toLowerCase()}` : ""}
          {readOnly && " · solo lectura"}
        </ModalDescription>
      </ModalHeader>

      <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col" noValidate>
        <ModalBody className="space-y-6">
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-11" />
              <Skeleton className="h-11" />
              <Skeleton className="h-32" />
            </div>
          ) : (
            <>
              <section aria-label="Enlace con ClickUp" className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-display text-base font-bold">Enlace con ClickUp</h3>
                  <Badge tone={linked ? "turquoise" : "neutral"}>{linked ? "Enlazado" : "Sin enlace"}</Badge>
                </div>
                <div className="grid gap-5 md:grid-cols-2">
                  <Field
                    label="Código al público"
                    htmlFor={ids.code}
                    required
                    error={errors.publicCode?.message}
                    hint="Lo ve el cliente al consultar su pedido."
                  >
                    <Input
                      id={ids.code}
                      className="font-mono"
                      placeholder="ALF-HIM-2026"
                      disabled={readOnly}
                      aria-invalid={!!errors.publicCode}
                      {...register("publicCode")}
                    />
                  </Field>
                  <Field
                    label="ID de la lista en ClickUp"
                    htmlFor={ids.clickup}
                    optional
                    error={errors.clickupListId?.message}
                    hint="Pega el ID o la URL; 5 a 20 letras o números."
                  >
                    <Input
                      id={ids.clickup}
                      className="font-mono"
                      placeholder="86a1m4t"
                      autoComplete="off"
                      disabled={readOnly}
                      aria-invalid={!!errors.clickupListId}
                      {...register("clickupListId", {
                        onBlur: (e) => setValue("clickupListId", normalizeClickupId(e.target.value), { shouldValidate: true, shouldDirty: true }),
                      })}
                    />
                  </Field>
                </div>
                {production?.clickupListId && (
                  <p className="rounded-xl bg-turquoise/10 px-3.5 py-2.5 text-xs font-semibold text-turquoise-dark">
                    {production.lastSyncedAt
                      ? `Sincronizado ${formatRelative(production.lastSyncedAt).toLowerCase()}`
                      : "Aún sin sincronizar: usa “Actualizar desde ClickUp”."}
                  </p>
                )}
              </section>

              <section aria-label="Datos de producción" className="space-y-3">
                <h3 className="font-display text-base font-bold">Datos de producción</h3>
                <div className="grid gap-5 sm:grid-cols-3">
                  <Field label="Inicio" htmlFor={ids.start} optional error={errors.startDate?.message}>
                    <Input id={ids.start} type="date" disabled={readOnly} aria-invalid={!!errors.startDate} {...register("startDate")} />
                  </Field>
                  <Field label="Días estimados" htmlFor={ids.days} optional error={errors.estimatedTotalDays?.message}>
                    <Input
                      id={ids.days}
                      inputMode="numeric"
                      placeholder="90"
                      disabled={readOnly}
                      aria-invalid={!!errors.estimatedTotalDays}
                      {...register("estimatedTotalDays")}
                    />
                  </Field>
                  <Field label="Término estimado" htmlFor={ids.end} hint="Calculado: inicio + días.">
                    <Input id={ids.end} readOnly tabIndex={-1} value={endDate ? formatDate(endDate) : "—"} className="bg-muted" />
                  </Field>
                </div>
              </section>

              <section aria-label="Etapa actual" className="space-y-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="font-display text-base font-bold">Etapa actual</h3>
                  <p className="text-xs text-muted-foreground">
                    {currentStage ? `Se mostrará al cliente como “${currentStage.clientLabel}”` : "Elige la etapa en la que va el título."}
                  </p>
                </div>
                <StageStepper
                  stages={stages}
                  value={currentStageId}
                  onChange={(id) => setValue("currentStageId", id, { shouldDirty: true })}
                  disabled={readOnly}
                />
                <p className="text-xs text-muted-foreground">Los estados de ClickUp bajo cada etapa son informativos: así se asigna la etapa al sincronizar.</p>
              </section>
            </>
          )}
        </ModalBody>

        <ModalFooter>
          <div className="flex flex-col-reverse gap-2 md:flex-row">
            <Button type="button" variant="outline" onClick={onClose}>
              {readOnly ? "Cerrar" : "Cancelar"}
            </Button>
            {!readOnly && (
              <Button type="submit" disabled={isSubmitting || loading}>
                <CheckIcon />
                {isSubmitting ? "Guardando…" : "Guardar cambios"}
              </Button>
            )}
          </div>
        </ModalFooter>
      </form>
    </ModalContent>
  );
}
