/** ClickUp list/task ids: alphanumeric, 5–20 chars. Accepts a pasted URL or "#id" and extracts the id. */
export const CLICKUP_ID_PATTERN = /^[A-Za-z0-9]{5,20}$/;

export function normalizeClickupId(raw: string): string {
  const value = raw.trim();
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) {
    try {
      const last = new URL(value).pathname.split("/").filter(Boolean).pop();
      if (last) return last;
    } catch {
      return value;
    }
  }
  return value.replace(/^#/, "");
}

/** ISO yyyy-mm-dd + n days → ISO yyyy-mm-dd (UTC-safe). Null when inputs are invalid. */
export function addDaysIso(start: string, days: number): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start) || !Number.isInteger(days) || days <= 0) return null;
  const date = new Date(`${start}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return null;
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}
