const LOCALE = "es-MX";

const relativeFormatter = new Intl.RelativeTimeFormat(LOCALE, { numeric: "auto" });
const dateFormatter = new Intl.DateTimeFormat(LOCALE, { day: "numeric", month: "short", year: "numeric" });
/** Same style as dateFormatter but pinned to UTC: used for calendar dates built at UTC midnight. */
const calendarDateFormatter = new Intl.DateTimeFormat(LOCALE, { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const longDateFormatter = new Intl.DateTimeFormat(LOCALE, { weekday: "long", day: "numeric", month: "long" });

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 365 * 24 * 3600],
  ["month", 30 * 24 * 3600],
  ["week", 7 * 24 * 3600],
  ["day", 24 * 3600],
  ["hour", 3600],
  ["minute", 60],
];

/** "hace 2 días", "hace 1 semana"… Capitalized for list cells. */
export function formatRelative(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const seconds = (new Date(value).getTime() - Date.now()) / 1000;
  const abs = Math.abs(seconds);
  if (abs < 60) return "Hace unos instantes";
  for (const [unit, size] of UNITS) {
    if (abs >= size) {
      const text = relativeFormatter.format(Math.round(seconds / size), unit);
      return text.charAt(0).toUpperCase() + text.slice(1);
    }
  }
  return "Hace unos instantes";
}

/** "12 mar 2026" */
export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "—";
  return dateFormatter.format(new Date(value)).replace(".", "");
}

/**
 * Calendar date "yyyy-mm-dd" (not a timestamp) → "12 mar 2026", with no timezone conversion.
 * `new Date("2026-03-12")` is UTC midnight, which in UTC-6 renders as March 11; building the date at
 * UTC and formatting in UTC keeps the same day everywhere. Returns `fallback` for null/invalid input.
 */
export function formatCalendarDate(value: string | null | undefined, fallback = "—"): string {
  const match = value ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(value) : null;
  if (!match) return fallback;
  const [, year, month, day] = match.map(Number);
  return calendarDateFormatter.format(new Date(Date.UTC(year, month - 1, day))).replace(".", "");
}

/** "jueves 17 de septiembre" */
export function formatLongDate(value: string | Date = new Date()): string {
  return longDateFormatter.format(new Date(value));
}

/** Formats a decimal coming from the API as string or number ("385.00" → "$385"). */
export function formatCurrency(value: string | number | null | undefined, currency = "MXN"): string {
  if (value === null || value === undefined || value === "") return "—";
  const amount = typeof value === "string" ? Number(value) : value;
  return new Intl.NumberFormat(LOCALE, {
    style: "currency",
    currency,
    maximumFractionDigits: Number.isInteger(amount) ? 0 : 2,
  }).format(amount);
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
}

/** Pluralizes a Spanish noun with a simple rule set ("1 proyecto", "3 proyectos"). */
export function plural(count: number, singular: string, pluralForm = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

export function initials(name: string | null | undefined): string {
  if (!name) return "?";
  return name.trim().charAt(0).toUpperCase();
}
