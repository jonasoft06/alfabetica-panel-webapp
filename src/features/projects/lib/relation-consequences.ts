import type { RelationKey } from "@/shared/lib/relations";

/** What disappears when a relation is removed (shown in the confirmation dialog). */
export const RELATION_CONSEQUENCES: Record<RelationKey, (ctx: { sections?: number }) => string[]> = {
  portfolio: () => ["Portada y galería de imágenes del portafolio", "Su estado de publicación en la web y su lugar en el orden"],
  publication: ({ sections }) => [
    "Tipo de venta, precio y existencias",
    sections ? `Las ${sections} secciones del título y su orden` : "Las secciones del título y su orden",
    "Su ficha en la tienda, portada y galería",
  ],
  production: () => ["Código al público", "Enlace con ClickUp y etapa actual"],
};

export const RELATION_DESCRIPTIONS: Record<RelationKey, string> = {
  portfolio: "Galería con portada y estado de publicación en la web.",
  publication: "Ficha de venta, enlace externo o DOI con secciones.",
  production: "Seguimiento de imprenta y enlace con ClickUp.",
};
