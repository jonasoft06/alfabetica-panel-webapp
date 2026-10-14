/** Visual identity of each project relation (facet), shared by every module. */
export const RELATIONS = {
  portfolio: { label: "Portafolio", dot: "bg-turquoise", chip: "bg-turquoise/15 text-turquoise-dark", spine: "bg-turquoise" },
  publication: { label: "Tienda", dot: "bg-tangerine", chip: "bg-tangerine/15 text-tangerine", spine: "bg-tangerine" },
  production: { label: "Producción", dot: "bg-bubblegum", chip: "bg-bubblegum/25 text-bubblegum-dark", spine: "bg-bubblegum" },
} as const;

export type RelationKey = keyof typeof RELATIONS;
