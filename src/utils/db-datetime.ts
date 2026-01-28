import { DateTime } from "luxon";

export const TH_ZONE = "Asia/Bangkok";

function hasExplicitOffset(isoLike: string): boolean {
  // Matches Z / z or a numeric offset at the end (+07:00, -0330)
  return /([zZ]|[+-]\d{2}:?\d{2})$/.test(isoLike);
}

export function parseDbDateTimeTH(value: unknown): DateTime | null {
  if (value == null) return null;

  if (value instanceof Date) {
    return DateTime.fromJSDate(value).setZone(TH_ZONE);
  }

  if (typeof value === "string") {
    const text = value.trim();
    if (!text) return null;

    // Date-only (DATE column)
    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
      const dt = DateTime.fromISO(text, { zone: TH_ZONE });
      return dt.isValid ? dt : null;
    }

    // ISO strings (may include timezone offsets)
    if (text.includes("T")) {
      // If the ISO string has no offset (e.g. from <input type="datetime-local">),
      // interpret it as Thailand local time to avoid server-environment drift.
      const dt = hasExplicitOffset(text)
        ? DateTime.fromISO(text, { setZone: true })
        : DateTime.fromISO(text, { zone: TH_ZONE });
      return dt.isValid ? dt.setZone(TH_ZONE) : null;
    }

    // SQL timestamp without timezone
    const dt = DateTime.fromSQL(text, { zone: TH_ZONE });
    return dt.isValid ? dt : null;
  }

  return null;
}

export function formatSqlDateTime(dt: DateTime): string {
  return dt.setZone(TH_ZONE).toFormat("yyyy-LL-dd HH:mm:ss");
}
