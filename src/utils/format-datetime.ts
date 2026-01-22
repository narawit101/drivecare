import { DateTime } from "luxon";

const TH_ZONE = "Asia/Bangkok";

/**
 * วันที่ภาษาไทย (พ.ศ.) (เช่น 12 มกราคม 2569)
 */
export const formatThaiDate = (utc?: string) => {
  if (!utc) return "-";

  const dt = DateTime.fromISO(utc, { zone: "utc" });

  if (!dt.isValid) return "-";

  const th = dt.setZone(TH_ZONE).setLocale("th");
  return `${th.toFormat("d LLLL")} ${th.year + 543}`;
};

/**
 * เวลาไทย (เช่น 14:30 น.)
 */
export const formatThaiTime = (utc?: string) => {
  if (!utc) return "-";

  const dt = DateTime.fromISO(utc, { zone: "utc" });

  if (!dt.isValid) return "-";

  return (
    dt
      .setZone(TH_ZONE)
      .setLocale("th")
      .toFormat("HH:mm") + " น."
  );
};

export const formatThaiShortDate = (utc?: string) => {
  if (!utc) return "-";

  const dt = DateTime.fromISO(utc, { zone: "utc" });

  if (!dt.isValid) return "-";

  const th = dt.setZone(TH_ZONE).setLocale("th");
  return `${th.toFormat("d LLL")} ${th.year + 543}`;
};

/**
 * วัน + วันที่ภาษาไทย (พ.ศ.) (เช่น พุธ 12 มกราคม 2569)
 */
export const formatThaiWeekdayDate = (utc?: string) => {
  if (!utc) return "-";

  const dt = DateTime.fromISO(utc, { zone: "utc" });
  if (!dt.isValid) return "-";

  const th = dt.setZone(TH_ZONE).setLocale("th");
  const weekday = th.toFormat("cccc").replace(/^วัน/, "");
  return `${weekday} ${th.toFormat("d LLLL")} ${th.year + 543}`;
};

/**
 * 14 01 2569 (Thai Buddhist year)
 */

export const formatThaiNumericDate = (utc?: string) => {
  if (!utc) return "-";

  const dt = DateTime.fromISO(utc, { zone: "utc" });
  if (!dt.isValid) return "-";

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

  const dt = DateTime.fromISO(utc, { zone: "utc" });
  if (!dt.isValid) return "-";

  const en = dt.setZone(TH_ZONE);

  return `${en.day.toString().padStart(2, "0")} ${en.month
    .toString()
    .padStart(2, "0")} ${en.year}`;
};

export const formatToSearchDate = (utc: string): string => {
  if (!utc) return "";

  return new Date(utc).toLocaleDateString("en-CA", {
    timeZone: "Asia/Bangkok",
  });
};

/**
 * วันที่วันนี้แบบไทย (พ.ศ.) พร้อมวัน (เช่น พุธ 17 มกราคม 2569)
 */
export const formatThaiTodayWeekdayDate = () => {
  const th = DateTime.now().setZone(TH_ZONE).setLocale("th");
  const weekday = th.toFormat("cccc").replace(/^วัน/, "");
  return `${weekday} ${th.toFormat("d LLLL")} ${th.year + 543}`;
};