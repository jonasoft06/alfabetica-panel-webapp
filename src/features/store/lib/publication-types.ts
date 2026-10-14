import type { PublicationType } from "@/contracts/publication";
import type { BadgeTone } from "@/shared/ui/badge";

export const TYPE_LABELS: Record<PublicationType, string> = { SALE: "Venta", LINK: "Enlace", DOI: "DOI" };

export const TYPE_DESCRIPTIONS: Record<PublicationType, { title: string; hint: string }> = {
  SALE: { title: "Venta directa", hint: "Se vende desde la tienda: precio y existencias." },
  LINK: { title: "Enlace externo", hint: "Redirige a otra tienda o sitio de compra." },
  DOI: { title: "Publicación DOI", hint: "Acceso abierto, con capítulos en PDF." },
};

export const TYPE_TONES: Record<PublicationType, BadgeTone> = { SALE: "tangerine", LINK: "turquoise", DOI: "grape" };

/** Cover placeholder tint per type (letter tile when there is no cover). */
export const TYPE_TILES: Record<PublicationType, string> = {
  SALE: "bg-tangerine/15 text-tangerine",
  LINK: "bg-turquoise/20 text-turquoise-dark",
  DOI: "bg-grape/15 text-grape",
};

export const CURRENCIES = ["MXN", "USD", "EUR"] as const;
