"use client";

import { useEffect, useId, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckIcon, TriangleAlertIcon } from "lucide-react";
import type { PublicationDetail, PublicationType } from "@/contracts/publication";
import { ConfirmDialog } from "@/shared/components/feedback/confirm-dialog";
import { notify } from "@/shared/components/feedback/notify";
import { Field } from "@/shared/components/form/field";
import { TagInput } from "@/shared/components/form/tag-input";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { ModalBody, ModalFooter } from "@/shared/ui/modal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Switch } from "@/shared/ui/switch";
import { useUpdatePublication } from "../hooks/use-publication-mutations";
import { CURRENCIES, TYPE_DESCRIPTIONS } from "../lib/publication-types";
import { publicationFormSchema, toFormValues, toUpsertPayload, TYPE_SPECIFIC_FIELDS, type PublicationFormValues } from "../schemas/publication-form.schema";

const TYPES: PublicationType[] = ["SALE", "LINK", "DOI"];

export function PublicationDetailsForm({
  projectId,
  title,
  detail,
  canWrite,
  onClose,
  className,
}: {
  projectId: string;
  title: string;
  detail: PublicationDetail;
  canWrite: boolean;
  onClose: () => void;
  className?: string;
}) {
  const uid = useId();
  const id = (name: string) => `${uid}-${name}`;
  const update = useUpdatePublication(projectId);
  const [pendingTypeChange, setPendingTypeChange] = useState(false);

  const form = useForm<PublicationFormValues>({ resolver: zodResolver(publicationFormSchema), defaultValues: toFormValues(detail), mode: "onTouched" });
  const { register, handleSubmit, control, reset, formState } = form;
  const { errors, dirtyFields, isDirty } = formState;
  const type = useWatch({ control, name: "type" });
  const typeChanged = type !== detail.type;

  useEffect(() => reset(toFormValues(detail)), [detail, reset]);

  const save = async (values: PublicationFormValues) => {
    try {
      await update.mutateAsync(toUpsertPayload(values, dirtyFields, detail.type));
      notify.success("Ficha guardada", title);
    } catch (error) {
      notify.error(error, "No se pudo guardar la ficha");
    } finally {
      setPendingTypeChange(false);
    }
  };

  const onSubmit = handleSubmit((values) => (typeChanged ? setPendingTypeChange(true) : save(values)));
  const saving = update.isPending;

  return (
    <>
      <form onSubmit={onSubmit} className={cn("min-h-0 flex-1 flex-col", className)} noValidate>
        <ModalBody className="space-y-6">
          <fieldset disabled={!canWrite || saving} className="m-0 min-w-0 space-y-6 border-0 p-0">
            {/* ---- type ---- */}
            <section aria-labelledby={id("type")}>
              <h3 id={id("type")} className="font-display text-base font-bold">
                Tipo de publicación
              </h3>
              <Controller
                control={control}
                name="type"
                render={({ field }) => (
                  <div role="radiogroup" aria-labelledby={id("type")} className="mt-3 grid gap-2.5 md:grid-cols-3">
                    {TYPES.map((t) => {
                      const active = field.value === t;
                      return (
                        <button
                          key={t}
                          type="button"
                          role="radio"
                          aria-checked={active}
                          onClick={() => field.onChange(t)}
                          className={cn(
                            "rounded-2xl border-[1.5px] p-3.5 text-left transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60",
                            active ? "border-tangerine bg-tangerine/10" : "border-border bg-card hover:bg-muted",
                          )}
                        >
                          <span className="flex items-center justify-between text-sm font-bold">
                            {TYPE_DESCRIPTIONS[t].title}
                            {active && <CheckIcon className="size-4 text-tangerine" strokeWidth={3} />}
                          </span>
                          <span className="mt-1 block text-xs text-muted-foreground">{TYPE_DESCRIPTIONS[t].hint}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              />
              {typeChanged && (
                <p role="status" className="mt-3 flex gap-2.5 rounded-xl bg-tan-sun/25 px-3.5 py-3 text-[13px] text-eerie/85">
                  <TriangleAlertIcon className="mt-0.5 size-4 shrink-0 text-tan-sun-dark" />
                  <span>
                    Al guardar se borrarán los datos propios de «{TYPE_DESCRIPTIONS[detail.type].title}»:{" "}
                    {TYPE_SPECIFIC_FIELDS[detail.type].join(", ").toLowerCase()}.
                  </span>
                </p>
              )}
            </section>

            {/* ---- type-specific ---- */}
            {type === "SALE" && (
              <section aria-label="Datos de venta" className="grid gap-5 md:grid-cols-2">
                <Field label="Precio" htmlFor={id("price")} required error={errors.price?.message}>
                  <Input id={id("price")} inputMode="decimal" placeholder="385.00" aria-invalid={!!errors.price} {...register("price")} />
                </Field>
                <Field label="Existencias" htmlFor={id("quantity")} required error={errors.quantity?.message}>
                  <Input id={id("quantity")} inputMode="numeric" placeholder="48" aria-invalid={!!errors.quantity} {...register("quantity")} />
                </Field>
                <Field
                  label="Precio de comparación"
                  htmlFor={id("compare")}
                  optional
                  error={errors.compareAtPrice?.message}
                  hint="Precio anterior, se muestra tachado."
                >
                  <Input id={id("compare")} inputMode="decimal" placeholder="450.00" aria-invalid={!!errors.compareAtPrice} {...register("compareAtPrice")} />
                </Field>
                <Field label="SKU" htmlFor={id("sku")} optional error={errors.sku?.message}>
                  <Input id={id("sku")} placeholder="ALF-014" {...register("sku")} />
                </Field>
              </section>
            )}
            {type === "LINK" && (
              <section aria-label="Datos del enlace">
                <Field
                  label="Enlace externo"
                  htmlFor={id("url")}
                  required
                  error={errors.externalUrl?.message}
                  hint="Página donde se compra o consulta el título."
                >
                  <Input
                    id={id("url")}
                    type="url"
                    inputMode="url"
                    placeholder="https://tienda.ejemplo.com/titulo"
                    aria-invalid={!!errors.externalUrl}
                    {...register("externalUrl")}
                  />
                </Field>
              </section>
            )}
            {type === "DOI" && (
              <p className="rounded-xl bg-muted px-4 py-3 text-[13px] text-muted-foreground">
                Las publicaciones DOI son de acceso abierto: no llevan precio ni existencias. Sube el PDF de cada capítulo en la pestaña{" "}
                <strong className="text-eerie">Secciones</strong>.
              </p>
            )}

            {/* ---- common metadata ---- */}
            <section aria-labelledby={id("meta")} className="space-y-5">
              <h3 id={id("meta")} className="font-display text-base font-bold">
                Ficha bibliográfica
              </h3>
              <Field label="Autores" htmlFor={id("authors")} optional error={errors.authors?.message} hint="Enter o coma para agregar.">
                <Controller
                  control={control}
                  name="authors"
                  render={({ field }) => (
                    <TagInput id={id("authors")} value={field.value} onChange={field.onChange} placeholder="Agregar autor…" maxTags={20} />
                  )}
                />
              </Field>
              <div className="grid gap-5 md:grid-cols-2">
                <Field label="Edición" htmlFor={id("edition")} optional error={errors.editionNumber?.message}>
                  <Input id={id("edition")} placeholder="1.ª" {...register("editionNumber")} />
                </Field>
                <Field label="Colección" htmlFor={id("collection")} optional error={errors.collection?.message}>
                  <Input id={id("collection")} placeholder="Serie secundaria" {...register("collection")} />
                </Field>
                <Field label="Formato" htmlFor={id("format")} optional error={errors.format?.message}>
                  <Input id={id("format")} placeholder="Impreso" {...register("format")} />
                </Field>
                <Field label="Presentación" htmlFor={id("presentation")} optional error={errors.presentation?.message}>
                  <Input id={id("presentation")} placeholder="Rústica" {...register("presentation")} />
                </Field>
                <Field label="Medidas" htmlFor={id("measures")} optional error={errors.measures?.message}>
                  <Input id={id("measures")} placeholder="21 × 27 cm" {...register("measures")} />
                </Field>
                <Field label="Páginas" htmlFor={id("pages")} optional error={errors.pages?.message}>
                  <Input id={id("pages")} inputMode="numeric" placeholder="96" aria-invalid={!!errors.pages} {...register("pages")} />
                </Field>
                <Field label="Público" htmlFor={id("audience")} optional error={errors.audience?.message}>
                  <Input id={id("audience")} placeholder="Secundaria" {...register("audience")} />
                </Field>
                <Field label="Idioma" htmlFor={id("language")} optional error={errors.language?.message}>
                  <Input id={id("language")} placeholder="Español" {...register("language")} />
                </Field>
                <Field label="ISBN" htmlFor={id("isbn")} optional error={errors.isbn?.message}>
                  <Input id={id("isbn")} placeholder="978-607-0000-00-0" aria-invalid={!!errors.isbn} {...register("isbn")} />
                </Field>
                <Field label="Moneda" htmlFor={id("currency")} error={errors.currency?.message}>
                  <Controller
                    control={control}
                    name="currency"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger id={id("currency")} aria-label="Moneda">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CURRENCIES.map((c) => (
                            <SelectItem key={c} value={c}>
                              {c}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </Field>
              </div>
            </section>

            {/* ---- publish ---- */}
            <Controller
              control={control}
              name="isPublished"
              render={({ field }) => (
                <div className="flex items-center justify-between gap-4 rounded-2xl bg-muted px-4 py-3.5">
                  <div>
                    <label htmlFor={id("published")} className="text-sm font-bold">
                      Publicado en la tienda
                    </label>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {field.value ? "Visible para el público." : "Guardado como borrador, no es visible."}
                    </p>
                  </div>
                  <Switch id={id("published")} checked={field.value} onCheckedChange={field.onChange} />
                </div>
              )}
            />
          </fieldset>
        </ModalBody>

        <ModalFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            {canWrite ? "Cancelar" : "Cerrar"}
          </Button>
          {canWrite && (
            <Button type="submit" disabled={saving || !isDirty}>
              <CheckIcon /> {saving ? "Guardando…" : "Guardar ficha"}
            </Button>
          )}
        </ModalFooter>
      </form>

      <ConfirmDialog
        open={pendingTypeChange}
        onOpenChange={(open) => !open && setPendingTypeChange(false)}
        title="Vas a cambiar el tipo de publicación"
        description={
          <>
            <strong className="text-eerie">{title}</strong> pasará de {TYPE_DESCRIPTIONS[detail.type].title} a {TYPE_DESCRIPTIONS[type].title}.
          </>
        }
        consequences={[...TYPE_SPECIFIC_FIELDS[detail.type]]}
        footnote="El resto de la ficha, la portada y la galería se conservan."
        safeguard={{ type: "checkbox", label: "Entiendo que esos datos se borrarán de forma permanente." }}
        confirmLabel="Cambiar tipo y borrar datos"
        pending={saving}
        onConfirm={() => void save(form.getValues())}
      />
    </>
  );
}
