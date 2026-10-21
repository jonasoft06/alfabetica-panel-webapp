/** ClickUp list ids are numeric strings (UpsertProductionDto: /^\d+$/). */
export const CLICKUP_LIST_ID_PATTERN = /^\d+$/;

/**
 * Accepts a pasted list URL (…/v/li/901312345678 or …/li/901312345678/…) or "#id" and returns the id.
 * Anything else comes back trimmed, so validation can explain what is wrong.
 */
export function normalizeClickupId(raw: string): string {
  const value = raw.trim();
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) {
    try {
      const parts = new URL(value).pathname.split("/").filter(Boolean);
      const afterLi = parts.indexOf("li");
      const candidate = afterLi >= 0 ? parts[afterLi + 1] : parts.findLast((part) => CLICKUP_LIST_ID_PATTERN.test(part));
      if (candidate) return candidate;
    } catch {
      return value;
    }
  }
  return value.replace(/^#/, "");
}
