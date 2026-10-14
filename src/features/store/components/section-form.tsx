"use client";

import { useId } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckIcon } from "lucide-react";
import { Field } from "@/shared/components/form/field";
import { Button } from "@/shared/ui/button";
import { Input, Textarea } from "@/shared/ui/input";
import { SECTION_DESCRIPTION_MAX, SECTION_LABEL_MAX, sectionFormSchema, type SectionFormValues } from "../schemas/section-form.schema";

/** Inline create/edit form for a publication section (label ≤ 17, description ≤ 220). */
export function SectionForm({
  initial = { label: "", description: "" },
  submitLabel,
  pending,
  onSubmit,
  onCancel,
}: {
  initial?: SectionFormValues;
  submitLabel: string;
  pending: boolean;
  onSubmit: (values: SectionFormValues) => void;
  onCancel: () => void;
}) {
  const uid = useId();
  const { register, handleSubmit, control, formState } = useForm<SectionFormValues>({
    resolver: zodResolver(sectionFormSchema),
    defaultValues: initial,
    mode: "onTouched",
  });
  const { errors } = formState;
  const [label, description] = useWatch({ control, name: ["label", "description"] });
  const counter = (value: string, max: number) => (
    <span className={value.length > max ? "font-bold text-destructive" : undefined}>
      {value.length}/{max}
    </span>
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4 rounded-2xl border-[1.5px] border-tangerine/40 bg-tangerine/[0.04] p-4">
      <Field label="Nombre" htmlFor={`${uid}-label`} required error={errors.label?.message} hint={counter(label, SECTION_LABEL_MAX)}>
        <Input id={`${uid}-label`} placeholder="Ej. Capítulo 1" autoFocus aria-invalid={!!errors.label} {...register("label")} />
      </Field>
      <Field
        label="Descripción"
        htmlFor={`${uid}-description`}
        optional
        error={errors.description?.message}
        hint={counter(description, SECTION_DESCRIPTION_MAX)}
      >
        <Textarea
          id={`${uid}-description`}
          rows={3}
          placeholder="Qué contiene esta sección."
          aria-invalid={!!errors.description}
          {...register("description")}
        />
      </Field>
      <div className="flex flex-col-reverse gap-2 md:flex-row md:justify-end">
        <Button type="button" variant="outline" size="sm" onClick={onCancel} disabled={pending}>
          Cancelar
        </Button>
        <Button type="submit" size="sm" disabled={pending}>
          <CheckIcon /> {pending ? "Guardando…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
