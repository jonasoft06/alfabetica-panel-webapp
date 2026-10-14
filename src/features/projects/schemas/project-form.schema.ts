import type { UpdateProjectRequest } from "@/contracts/projects";
import { z } from "zod";

const CURRENT_YEAR = new Date().getFullYear();
const optionalText = (max: number, message: string) => z.string().trim().max(max, message);

/** Mirrors CreateProjectDto / UpdateProjectDto (title required, the rest optional). */
export const projectFormSchema = z.object({
  title: z.string().trim().min(1, "Escribe el título del proyecto.").max(160, "Máximo 160 caracteres."),
  subtitle: optionalText(160, "Máximo 160 caracteres."),
  issueYear: z
    .string()
    .trim()
    .refine((v) => v === "" || /^\d{4}$/.test(v), "Usa un año de 4 dígitos.")
    .refine((v) => v === "" || (Number(v) >= 1900 && Number(v) <= CURRENT_YEAR + 5), `Entre 1900 y ${CURRENT_YEAR + 5}.`),
  description: optionalText(1000, "Máximo 1000 caracteres."),
  client: optionalText(120, "Máximo 120 caracteres."),
  tags: z.array(z.string()).max(12, "Máximo 12 tags."),
});

export type ProjectFormValues = z.infer<typeof projectFormSchema>;

export const emptyProjectForm: ProjectFormValues = { title: "", subtitle: "", issueYear: "", description: "", client: "", tags: [] };

/** Form values → POST /projects body (empty strings are omitted). */
export function toCreatePayload(values: ProjectFormValues) {
  return {
    title: values.title,
    subtitle: values.subtitle || undefined,
    description: values.description || undefined,
    client: values.client || undefined,
    issueYear: values.issueYear ? Number(values.issueYear) : undefined,
    tags: values.tags,
  };
}

/** Only the fields the user changed → PATCH /projects/:id body (cleared fields are sent as null). */
export function toUpdatePayload(values: ProjectFormValues, dirty: Partial<Record<keyof ProjectFormValues, unknown>>): UpdateProjectRequest {
  const body: UpdateProjectRequest = {};
  if (dirty.title) body.title = values.title;
  if (dirty.subtitle) body.subtitle = values.subtitle || null;
  if (dirty.description) body.description = values.description || null;
  if (dirty.client) body.client = values.client || null;
  if (dirty.issueYear) body.issueYear = values.issueYear ? Number(values.issueYear) : null;
  if (dirty.tags) body.tags = values.tags;
  return body;
}
