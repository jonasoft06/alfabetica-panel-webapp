import { z } from "zod";

export const SECTION_LABEL_MAX = 17;
export const SECTION_DESCRIPTION_MAX = 220;

/** Mirrors CreateSectionDto / UpdateSectionDto. */
export const sectionFormSchema = z.object({
  label: z.string().trim().min(1, "Escribe el nombre de la sección.").max(SECTION_LABEL_MAX, `Máximo ${SECTION_LABEL_MAX} caracteres.`),
  description: z.string().trim().max(SECTION_DESCRIPTION_MAX, `Máximo ${SECTION_DESCRIPTION_MAX} caracteres.`),
});

export type SectionFormValues = z.infer<typeof sectionFormSchema>;
