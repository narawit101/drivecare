import { DateTime } from "luxon";
import { parseDbDateTimeTH } from "@/utils/db-datetime";

interface type {
  start_time: string | Date;
  end_time: string | Date;
  rate_price: number;
}

export async function calculatePrice({
  start_time,
  end_time,
  rate_price,
}: type) {
  if (!start_time || !end_time || !rate_price) {
    throw new Error("Missing paremeter");
  }

  const toMillis = (value: string | Date): number => {
    if (value instanceof Date) return value.getTime();

    const iso = DateTime.fromISO(value, { setZone: true });
    if (iso.isValid) return iso.toMillis();

    const th = parseDbDateTimeTH(value);
    if (th) return th.toMillis();

    throw new Error("Invalid datetime");
  };

  const startMs = toMillis(start_time);
  const endMs = toMillis(end_time);

  const driff = Math.ceil(endMs - startMs);
  // console.log(start.getTime())

  const driff_hours = driff / (1000 * 60 * 60);
  const calculate_price = Math.ceil((driff_hours * rate_price)+50);

  const output = {
    diff_hours: Number(driff_hours.toFixed(2)),
    rate: rate_price,
    total_price: calculate_price,
  };
  return output;
}
