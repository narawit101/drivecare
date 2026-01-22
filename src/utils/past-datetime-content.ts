import dayjs from "@/utils/dayjs";
import { formatThaiDate } from "@/utils/format-datetime";
import * as FormatDatetime from "@/utils/format-datetime";

class PastDatetimeContent {
  static getContent(datetime: string | Date) {
    const past = dayjs(datetime).tz("Asia/Bangkok");
    const now = dayjs().tz("Asia/Bangkok");

    const diffMinutes = now.diff(past, "minute");
    const diffHours = now.diff(past, "hour");
    const diffDays = now.diff(past, "day");

    if (diffDays > 60) {
      return FormatDatetime.formatThaiDate(
        typeof datetime === "string" ? datetime : datetime.toISOString()
      );
    }
    if (diffDays > 0) {
      return `${diffDays} วันที่แล้ว`;
    }
    if (diffHours > 0) {
      return `${diffHours} ชั่วโมงที่แล้ว`;
    }
    if (diffMinutes > 0) {
      return `${diffMinutes} นาทีที่แล้ว`;
    }
    return "เมื่อสักครู่";
  }
}

export default PastDatetimeContent;
