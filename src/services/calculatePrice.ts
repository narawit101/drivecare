import { en } from "zod/v4/locales";

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

  const start = new Date(start_time);
  const end = new Date(end_time);

  const driff = Math.ceil(end.getTime() - start.getTime());
  // console.log(start.getTime())

  const driff_hours = driff / (1000 * 60 * 60);
  const calculate_price = Math.ceil(driff_hours * rate_price);

  const output = {
    diff_hours: Number(driff_hours.toFixed(2)),
    rate: rate_price,
    total_price: calculate_price,
  };
  return output;
}
