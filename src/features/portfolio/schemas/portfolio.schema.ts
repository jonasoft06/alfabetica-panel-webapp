import { z } from "zod";
import { ACCEPTED_IMAGE_TYPES, MAX_IMAGE_BYTES } from "@/core/media/prepare-image";

/** Same constraints the API enforces on uploads (image/jpeg|png|webp, ≤ 15 MB). */
export const imageFileSchema = z
  .instanceof(File)
  .refine((f) => ACCEPTED_IMAGE_TYPES.includes(f.type), "Formato no permitido. Usa JPG, PNG o WebP.")
  .refine((f) => f.size > 0 && f.size <= MAX_IMAGE_BYTES, "La imagen debe pesar menos de 15 MB.");

/** PUT /projects/:id/portfolio (UpsertPortfolioDto). */
export const displayOrderSchema = z.object({ displayOrder: z.number().int().min(1) });

/** Returns the first validation message or null. */
export function validateImageFile(file: File): string | null {
  const result = imageFileSchema.safeParse(file);
  return result.success ? null : (result.error.issues[0]?.message ?? "Archivo no válido.");
}
