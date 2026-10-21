"use client";

import { useEffect, useId, useState } from "react";
import { Controller, useForm, useWatch, type UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckIcon, LinkIcon, RefreshCwIcon, UnlinkIcon } from "lucide-react";
import {
  BOOK_TYPES,
  PRODUCTION_STATUSES,
  PUBLISHED_PHASE_CODE,
  type BookType,
  type ProductionDetail,
  type ProductionListItem,
  type ProductionPhase,
  type ProductionStatus,
  type UpsertProductionRequest,
} from "@/contracts/production";
import { ApiError } from "@/core/http/api-error";
import { ConfirmDialog } from "@/shared/components/feedback/confirm-dialog";
import { notify } from "@/shared/components/feedback/notify";
import { Field } from "@/shared/components/form/field";
import { formatCalendarDate, formatRelative } from "@/shared/lib/format";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Modal, ModalBody, ModalContent, ModalDescription, ModalFooter, ModalHeader, ModalTitle } from "@/shared/ui/modal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Skeleton } from "@/shared/ui/skeleton";
import { useProductionDetail, useSyncProduction, useUpdateProduction } from "../hooks/use-production";
import { normalizeClickupId } from "../lib/clickup";
import { withPhase, withStatus } from "../lib/manual-state";
import { PRODUCTION_ERROR_MESSAGES } from "../lib/production-errors";
import {
  BOOK_TYPE_LABELS,
  DATE_TBD,
  LINK_CONFIRMATION,
  SOURCE_LABELS,
  STATUS_LABELS,
  STATUS_TONES,
  UNLINK_CONFIRMATION,
} from "../lib/production-labels";
import { emptyProductionForm, hasManualChanges, productionFormSchema, toFormValues, toUpsertPayload, type ProductionFormValues } from "../schemas/production-form.schema";
import { PhaseStepper } from "./phase-stepper";

/** Link errors that belong next to the ClickUp field instead of a toast. */
const FIELD_ERRORS = new Set(["CLICKUP_LIST_ALREADY_LINKED", "CLICKUP_LIST_NOT_FOUND", "CLICKUP_LIST_NOT_IN_PRODUCTION", "CLICKUP_LIST_UNMAPPED_STAGE"]);
/** Radix Select items cannot use "" as value. */
const NONE = "none";

export interface ProductionFormModalProps {
  target: ProductionListItem | null;
  phases: ProductionPhase[];
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

/**
 * MANUAL: book type, status, phase and dates are edited here; CLICKUP: they are read from the list (read-only)
 * with Sincronizar / Desvincular. The author is editable in both. Every save is one PUT and the form is reset
 * from its response, so the server's status/phase adjustments show right away.
 */
function ProductionFormContent({ target, phases, canWrite, onClose }: ProductionFormModalProps & { target: ProductionListItem }) {
  const { data: production, isPending: loading, error: loadError } = useProductionDetail(target.projectId);
  const update = useUpdateProduction();
  const sync = useSyncProduction();
  const ids = { author: useId(), clickup: useId() };
  const [confirming, setConfirming] = useState<{ kind: "link"; body: UpsertProductionRequest } | { kind: "unlink" } | null>(null);

  const form = useForm<ProductionFormValues>({ resolver: zodResolver(productionFormSchema), defaultValues: emptyProductionForm, mode: "onTouched" });
  const { register, handleSubmit, reset, setValue, setError, control, formState } = form;
  const { errors, isSubmitting, isDirty, dirtyFields } = formState;

  // A sync refreshes the cached detail: keep whatever the user is typing.
  useEffect(() => {
    if (production) reset(toFormValues(production), { keepDirtyValues: true });
  }, [production, reset]);

  const manual = production?.source === "MANUAL";
  const readOnly = !canWrite;
  const clickupListId = useWatch({ control, name: "clickupListId" });
  const linking = manual && !!dirtyFields.clickupListId && !!clickupListId.trim();

  const save = async (body: UpsertProductionRequest) => {
    try {
      const saved = await update.mutateAsync({ projectId: target.projectId, body });
      // Unlinking keeps pending author edits; any other save shows exactly what the server stored.
      reset(toFormValues(saved), { keepDirtyValues: body.clickupListId === null });
      const summary = `${target.projectTitle} · ${saved.currentPhase?.label ?? STATUS_LABELS[saved.status]}`;
      if (body.clickupListId) notify.success("Lista vinculada y sincronizada", summary);
      else if (body.clickupListId === null) notify.success("Producción desvinculada de ClickUp", "Ahora puedes editar el avance manualmente.");
      else notify.success("Producción actualizada", summary);
    } catch (error) {
      if (error instanceof ApiError && error.code && FIELD_ERRORS.has(error.code)) {
        setError("clickupListId", { message: PRODUCTION_ERROR_MESSAGES[error.code as keyof typeof PRODUCTION_ERROR_MESSAGES] });
      } else {
        notify.error(error, "No se pudieron guardar los cambios", PRODUCTION_ERROR_MESSAGES);
      }
    }
  };

  const onSubmit = handleSubmit(async (values) => {
    if (!isDirty) return onClose();
    const body = toUpsertPayload(values, dirtyFields, { manual });
    if (body.clickupListId) return setConfirming({ kind: "link", body });
    await save(body);
  });

  const onConfirm = async () => {
    if (!confirming) return;
    // Errors show as a toast or under the ClickUp field, so the confirmation closes either way.
    await save(confirming.kind === "link" ? confirming.body : { clickupListId: null });
    setConfirming(null);
  };

  const runSync = () =>
    sync.mutate(target.projectId, {
      onSuccess: (synced) => notify.success("Sincronizado con ClickUp", `${target.projectTitle} · ${synced.currentPhase?.label ?? STATUS_LABELS[synced.status]}`),
      onError: (e) => notify.error(e, "No se pudo sincronizar con ClickUp", PRODUCTION_ERROR_MESSAGES),
    });

  const busy = isSubmitting || update.isPending || sync.isPending;

  return (
    <ModalContent size="lg">
      <ModalHeader>
        <ModalTitle>{target.projectTitle}</ModalTitle>
        <ModalDescription>
          Producción{production ? ` · actualizada ${formatRelative(production.updatedAt).toLowerCase()}` : ""}
          {readOnly && " · solo lectura"}
        </ModalDescription>
      </ModalHeader>

      <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col" noValidate>
        <ModalBody className="space-y-6">
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-24" />
              <Skeleton className="h-20" />
              <Skeleton className="h-32" />
            </div>
          ) : loadError || !production ? (
            <p role="alert" className="rounded-xl bg-destructive/10 px-3.5 py-2.5 text-sm font-semibold text-destructive">
              No se pudo cargar esta producción. Cierra y vuelve a abrirla.
            </p>
          ) : (
            <>
              {manual ? (
                <ManualTracking production={production} phases={phases} form={form} disabled={readOnly || busy} />
              ) : (
                <ClickupTracking
                  production={production}
                  phases={phases}
                  canWrite={canWrite}
                  syncing={sync.isPending}
                  disabled={busy}
                  onSync={runSync}
                  onUnlink={() => setConfirming({ kind: "unlink" })}
                />
              )}

              <section aria-label="Datos de producción" className="space-y-3">
                <h3 className="font-display text-base font-bold">Datos de producción</h3>
                <div className="grid gap-5 md:grid-cols-2">
                  <Field label="Autor" htmlFor={ids.author} optional error={errors.authorName?.message}>
                    <Input id={ids.author} placeholder="Ej. Mariana Ruiz" disabled={readOnly} aria-invalid={!!errors.authorName} {...register("authorName")} />
                  </Field>
                  {manual && (
                    <Field
                      label="Vincular con ClickUp"
                      htmlFor={ids.clickup}
                      optional
                      error={errors.clickupListId?.message}
                      hint="Pega el ID o la URL de la lista. Al guardar se valida y sincroniza."
                    >
                      <Input
                        id={ids.clickup}
                        className="font-mono"
                        inputMode="numeric"
                        placeholder="901312345678"
                        autoComplete="off"
                        disabled={readOnly}
                        aria-invalid={!!errors.clickupListId}
                        {...register("clickupListId", {
                          onBlur: (e) => setValue("clickupListId", normalizeClickupId(e.target.value), { shouldValidate: true, shouldDirty: true }),
                        })}
                      />
                    </Field>
                  )}
                </div>
              </section>
            </>
          )}
        </ModalBody>

        <ModalFooter>
          <div className="flex flex-col-reverse gap-2 md:flex-row">
            <Button type="button" variant="outline" onClick={onClose}>
              {readOnly || !isDirty ? "Cerrar" : "Cancelar"}
            </Button>
            {!readOnly && (
              <Button type="submit" disabled={busy || loading || !production || !isDirty}>
                {linking ? <LinkIcon /> : <CheckIcon />}
                {isSubmitting || update.isPending ? (linking ? "Validando con ClickUp…" : "Guardando…") : "Guardar cambios"}
              </Button>
            )}
          </div>
        </ModalFooter>
      </form>

      <ConfirmDialog
        open={!!confirming}
        onOpenChange={(open) => !open && !update.isPending && setConfirming(null)}
        title={confirming?.kind === "unlink" ? "¿Desvincular de ClickUp?" : "¿Vincular con ClickUp?"}
        description={
          confirming?.kind === "unlink" ? (
            UNLINK_CONFIRMATION
          ) : (
            <>
              {LINK_CONFIRMATION}
              {hasManualChanges(dirtyFields) && " Los cambios sin guardar de esta sección también se descartarán."}
            </>
          )
        }
        confirmLabel={confirming?.kind === "unlink" ? "Desvincular" : "Vincular"}
        confirmIcon={confirming?.kind === "unlink" ? <UnlinkIcon /> : <LinkIcon />}
        pending={update.isPending}
        onConfirm={onConfirm}
      />
    </ModalContent>
  );
}

function TrackingHeader({ production, showStatus }: { production: ProductionDetail; showStatus: boolean }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <h3 className="font-display text-base font-bold">Seguimiento</h3>
        <Badge tone={production.source === "CLICKUP" ? "turquoise" : "tan"}>{SOURCE_LABELS[production.source]}</Badge>
      </div>
      {showStatus && (
        <Badge tone={STATUS_TONES[production.status]} size="md">
          {STATUS_LABELS[production.status]}
        </Badge>
      )}
    </div>
  );
}

function PublicCode({ code }: { code: string }) {
  return <code className="rounded-md bg-card px-2 py-0.5 font-mono text-xs font-bold">{code}</code>;
}

/** Manual mode: the tracking fields are part of the form; status and phase stay consistent as they change. */
function ManualTracking({
  production,
  phases,
  form,
  disabled,
}: {
  production: ProductionDetail;
  phases: ProductionPhase[];
  form: UseFormReturn<ProductionFormValues>;
  disabled: boolean;
}) {
  const { control, register, setValue, getValues } = form;
  const ids = { bookType: useId(), status: useId(), due: useId(), end: useId() };
  const [status, phaseCode] = useWatch({ control, name: ["status", "currentPhaseCode"] });
  const phase = phases.find((p) => p.code === phaseCode);

  const apply = (next: { status: ProductionStatus; phaseCode: string }) => {
    setValue("status", next.status, { shouldDirty: true });
    setValue("currentPhaseCode", next.phaseCode, { shouldDirty: true });
  };
  const current = () => ({ status: getValues("status"), phaseCode: getValues("currentPhaseCode") });

  return (
    <section aria-label="Seguimiento" className="space-y-4">
      <TrackingHeader production={production} showStatus={false} />
      <p className="rounded-xl bg-muted px-3.5 py-2.5 text-xs font-semibold text-muted-foreground">
        Captura el avance manualmente o vincula una lista de ClickUp para sincronizarlo.
      </p>

      <div className="flex items-center justify-between gap-3 text-[13px]">
        <span className="text-muted-foreground">Código al público</span>
        <PublicCode code={production.publicCode} />
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Tipo de libro" htmlFor={ids.bookType} optional>
          <Controller
            control={control}
            name="bookType"
            render={({ field }) => (
              <Select value={field.value || NONE} onValueChange={(v) => field.onChange(v === NONE ? "" : (v as BookType))} disabled={disabled}>
                <SelectTrigger id={ids.bookType} onBlur={field.onBlur}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Sin definir</SelectItem>
                  {BOOK_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {BOOK_TYPE_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>
        <Field label="Estado" htmlFor={ids.status}>
          <Select value={status} onValueChange={(v) => apply(withStatus(current(), v as ProductionStatus))} disabled={disabled}>
            <SelectTrigger id={ids.status}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRODUCTION_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {STATUS_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Entrega de la etapa" htmlFor={ids.due} optional>
          <Input id={ids.due} type="date" disabled={disabled} {...register("currentStageDueDate")} />
        </Field>
        <Field label="Término estimado" htmlFor={ids.end} optional>
          <Input id={ids.end} type="date" disabled={disabled} {...register("estimatedEndDate")} />
        </Field>
      </div>

      {phases.length > 0 && (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[13px] font-bold">
              Fase actual <span className="font-medium text-muted-foreground">· {phase?.label ?? "Sin fase"}</span>
            </p>
            {phaseCode && status !== "FINISHED" && !disabled && (
              <Button type="button" size="sm" variant="ghost" onClick={() => apply(withPhase(current(), ""))}>
                Quitar fase
              </Button>
            )}
          </div>
          <PhaseStepper
            phases={phases}
            current={phase ?? null}
            finished={status === "FINISHED"}
            disabled={disabled}
            onSelect={(code) => apply(withPhase(current(), code))}
          />
          <p className="text-[11px] text-muted-foreground">
            Elegir una fase pasa el estado a «En producción»; «{phases.find((p) => p.code === PUBLISHED_PHASE_CODE)?.label ?? "Publicado"}» lo marca
            como terminado.
          </p>
        </div>
      )}
    </section>
  );
}

/** ClickUp mode: everything is read from the list (read-only) plus the per-production sync and the unlink. */
function ClickupTracking({
  production,
  phases,
  canWrite,
  syncing,
  disabled,
  onSync,
  onUnlink,
}: {
  production: ProductionDetail;
  phases: ProductionPhase[];
  canWrite: boolean;
  syncing: boolean;
  disabled: boolean;
  onSync: () => void;
  onUnlink: () => void;
}) {
  const rows: [string, React.ReactNode][] = [
    ["Código al público", <PublicCode key="code" code={production.publicCode} />],
    ["Tipo de libro", production.bookType ? BOOK_TYPE_LABELS[production.bookType] : "—"],
    ["Etapa en ClickUp", production.currentStageName ?? "—"],
    ["Entrega de la etapa", formatCalendarDate(production.currentStageDueDate, DATE_TBD)],
    ["Término estimado", formatCalendarDate(production.estimatedEndDate, DATE_TBD)],
  ];

  return (
    <section aria-label="Seguimiento" className="space-y-3">
      <TrackingHeader production={production} showStatus />
      <dl className="grid gap-x-6 gap-y-2 rounded-2xl bg-muted px-4 py-3.5 sm:grid-cols-2">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-3 text-[13px]">
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="text-right font-semibold">{value}</dd>
          </div>
        ))}
      </dl>
      {phases.length > 0 && <PhaseStepper phases={phases} current={production.currentPhase} finished={production.status === "FINISHED"} />}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-turquoise/10 px-3.5 py-2.5">
        <p className="text-xs font-semibold text-turquoise-dark">
          Lista <span className="font-mono">#{production.clickupListId}</span> · Última sincronización:{" "}
          {production.lastSyncedAt ? formatRelative(production.lastSyncedAt).toLowerCase() : "nunca"}
        </p>
        {canWrite && (
          <div className="flex gap-2">
            <Button type="button" size="sm" variant="outline" onClick={onUnlink} disabled={disabled}>
              <UnlinkIcon /> Desvincular
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={onSync} disabled={disabled} aria-busy={syncing}>
              <RefreshCwIcon className={syncing ? "animate-spin" : undefined} />
              {syncing ? "Sincronizando…" : "Sincronizar"}
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
