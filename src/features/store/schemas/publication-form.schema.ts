import type { PublicationDetail, PublicationType, UpsertPublicationRequest } from "@/contracts/publication";
import { z } from "zod";

const text = (max: number) => z.string().trim().max(max, `Máximo ${max} caracteres.`);

/** Optional decimal: "" or a non-negative number with up to 2 decimals. */
const money = z
  .string()
  .trim()
  .refine((v) => v === "" || /^\d+(\.\d{1,2})?$/.test(v), "Usa un importe válido, con hasta 2 decimales.");

const baseShape = {
  type: z.enum(["SALE", "LINK", "DOI"]),
  authors: z.array(z.string().trim().min(1).max(120, "Máximo 120 caracteres por autor.")).max(20, "Máximo 20 autores."),
  editionNumber: text(40),
  format: text(80),
  collection: text(120),
  measures: text(60),
  presentation: text(120),
  audience: text(120),
  language: text(40),
  isbn: text(20).refine((v) => v === "" || /^[0-9Xx-]+$/.test(v), "Solo dígitos, X y guiones."),
  pages: z
    .string()
    .trim()
    .refine((v) => v === "" || (/^\d+$/.test(v) && Number(v) >= 1), "Debe ser un entero de 1 o más."),
  currency: z.string().trim().length(3, "Usa un código de 3 letras (MXN)."),
  isPublished: z.boolean(),
  // SALE only
  price: money,
  compareAtPrice: money,
  quantity: z
    .string()
    .trim()
    .refine((v) => v === "" || /^\d+$/.test(v), "Debe ser un entero de 0 o más."),
  sku: text(64),
  // LINK only
  externalUrl: text(2048),
};

/**
 * Mirrors PublicationFieldsDto. The type-specific rules are a discriminated validation on `type`:
 * SALE requires price + quantity; LINK requires a valid http(s) URL; DOI requires neither.
 * (The form keeps one flat shape so react-hook-form can address every field.)
 */
export const publicationFormSchema = z.object(baseShape).superRefine((values, ctx) => {
  const need = (path: keyof typeof baseShape, message: string) => ctx.addIssue({ code: "custom", path: [path], message });
  switch (values.type) {
    case "SALE":
      if (values.price === "") need("price", "El precio es obligatorio para venta directa.");
      if (values.quantity === "") need("quantity", "Indica las existencias (0 si no hay).");
      break;
    case "LINK": {
      if (values.externalUrl === "") return need("externalUrl", "El enlace es obligatorio.");
      const valid = URL.canParse(values.externalUrl) && /^https?:$/.test(new URL(values.externalUrl).protocol);
      if (!valid) need("externalUrl", "Usa una dirección completa que empiece con http:// o https://.");
      break;
    }
    case "DOI":
      break;
  }
});

export type PublicationFormValues = z.infer<typeof publicationFormSchema>;

export function toFormValues(detail: PublicationDetail): PublicationFormValues {
  return {
    type: detail.type,
    authors: detail.authors,
    editionNumber: detail.editionNumber ?? "",
    format: detail.format ?? "",
    collection: detail.collection ?? "",
    measures: detail.measures ?? "",
    presentation: detail.presentation ?? "",
    audience: detail.audience ?? "",
    language: detail.language ?? "",
    isbn: detail.isbn ?? "",
    pages: detail.pages ? String(detail.pages) : "",
    currency: detail.currency ?? "MXN",
    isPublished: detail.isPublished,
    price: detail.price ?? "",
    compareAtPrice: detail.compareAtPrice ?? "",
    quantity: detail.quantity !== null ? String(detail.quantity) : "",
    sku: detail.sku ?? "",
    externalUrl: detail.externalUrl ?? "",
  };
}

const COMMON_TEXT = ["editionNumber", "format", "collection", "measures", "presentation", "audience", "language", "isbn"] as const;

type Dirty = Partial<Record<keyof PublicationFormValues, unknown>>;

/**
 * Form values → PUT /projects/:id/publication body.
 * - Sends only what changed (partial upsert); on a type change every field of the NEW type is sent.
 * - Type-specific fields of other types are never included (the API rejects them).
 * TODO(api): confirm that "" clears an optional text field (the contract has no `null` for them).
 */
export function toUpsertPayload(values: PublicationFormValues, dirty: Dirty, originalType: PublicationType): UpsertPublicationRequest {
  const typeChanged = values.type !== originalType;
  const changed = (key: keyof PublicationFormValues) => typeChanged || !!dirty[key];
  const body: UpsertPublicationRequest = {};

  if (typeChanged) body.type = values.type;
  if (dirty.authors) body.authors = values.authors;
  for (const key of COMMON_TEXT) if (dirty[key]) body[key] = values[key];
  if (dirty.pages) body.pages = values.pages ? Number(values.pages) : null;
  if (dirty.currency) body.currency = values.currency;
  if (dirty.isPublished) body.isPublished = values.isPublished;

  if (values.type === "SALE") {
    if (changed("price")) body.price = Number(values.price);
    if (changed("quantity")) body.quantity = Number(values.quantity);
    if (changed("compareAtPrice") && values.compareAtPrice !== "") body.compareAtPrice = Number(values.compareAtPrice);
    if (changed("sku") && values.sku !== "") body.sku = values.sku;
  }
  if (values.type === "LINK" && changed("externalUrl")) body.externalUrl = values.externalUrl;
  return body;
}

/** Name of the fields that hold data of a given type (used to describe what a type change clears). */
export const TYPE_SPECIFIC_FIELDS: Record<PublicationType, readonly string[]> = {
  SALE: ["Precio", "Precio de comparación", "Existencias", "SKU"],
  LINK: ["Enlace externo"],
  DOI: ["PDF de cada sección"],
};
