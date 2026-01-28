import { DateTime } from "luxon";
import { parseDbDateTimeTH, TH_ZONE } from "@/utils/db-datetime";

/**
 * วันที่ภาษาไทย (พ.ศ.) (เช่น 12 มกราคม 2569)
 */
export const formatThaiDate = (value?: unknown) => {
  const dt = parseDbDateTimeTH(value);
  if (!dt) return "-";

  const th = dt.setZone(TH_ZONE).setLocale("th");
  return `${th.toFormat("d LLLL")} ${th.year + 543}`;
};

/**
 * เวลาไทย (เช่น 14:30 น.)
 */
export const formatThaiTime = (value?: unknown) => {
  const dt = parseDbDateTimeTH(value);
  if (!dt) return "-";

  return dt.setZone(TH_ZONE).setLocale("th").toFormat("HH:mm") + " น.";
};

export const formatThaiShortDate = (value?: unknown) => {
  const dt = parseDbDateTimeTH(value);
  if (!dt) return "-";

  const th = dt.setZone(TH_ZONE).setLocale("th");
  return `${th.toFormat("d LLL")} ${th.year + 543}`;
};

/**
 * วัน + วันที่ภาษาไทย (พ.ศ.) (เช่น พุธ 12 มกราคม 2569)
 */
export const formatThaiWeekdayDate = (utc?: string) => {
  if (!utc) return "-";

  const dt = parseDbDateTimeTH(utc);
  if (!dt) return "-";

  const th = dt.setZone(TH_ZONE).setLocale("th");
  const weekday = th.toFormat("cccc").replace(/^วัน/, "");
  return `${weekday} ${th.toFormat("d LLLL")} ${th.year + 543}`;
};

/**
 * 14 01 2569 (Thai Buddhist year)
 */

export const formatThaiNumericDate = (utc?: string) => {
  if (!utc) return "-";

  const dt = parseDbDateTimeTH(utc);
  if (!dt) return "-";

  const th = dt.setZone(TH_ZONE);

  return `${th.day.toString().padStart(2, "0")} ${th.month
    .toString()
    .padStart(2, "0")} ${th.year + 543}`;
};

/**
 * 14 01 2026 (Gregorian year)
 */
export const formatEngNumericDate = (utc?: string) => {
  if (!utc) return "-";

  const dt = parseDbDateTimeTH(utc);
  if (!dt) return "-";

  const en = dt.setZone(TH_ZONE);

  return `${en.day.toString().padStart(2, "0")} ${en.month
    .toString()
    .padStart(2, "0")} ${en.year}`;
};

export const formatToSearchDate = (value: unknown): string => {
  const dt = parseDbDateTimeTH(value);
  if (!dt) return "";
  return dt.setZone(TH_ZONE).toFormat("yyyy-LL-dd");
};

/**
 * วันที่วันนี้แบบไทย (พ.ศ.) พร้อมวัน (เช่น พุธ 17 มกราคม 2569)
 */
export const formatThaiTodayWeekdayDate = () => {
  const th = DateTime.now().setZone(TH_ZONE).setLocale("th");
  const weekday = th.toFormat("cccc").replace(/^วัน/, "");
  return `${weekday} ${th.toFormat("d LLLL")} ${th.year + 543}`;
};