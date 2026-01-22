import { DateTime } from "luxon";
import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(req: Request) {
  const driver_id = req.headers.get("x-driver-id");

  if (!driver_id) {
    return NextResponse.json({ message: "unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const booking_id = searchParams.get("booking_id");

  if (!booking_id) {
    return NextResponse.json(
      { message: "missing booking_id" },
      { status: 400 },
    );
  }

  try {
    const result = await pool.query(
      `
            SELECT 
                b.booking_id,
                b.booking_date,
                b.start_time,
                b.status,
                b.create_at,
                b.total_price,
                b.total_hours,
                b.payment_status,
                b.driver_id,

                u.user_id,
                u.first_name,
                u.last_name,
                u.phone_number,
                u.profile_img,

                l.pickup_address,
                l.pickup_lat,
                l.pickup_lng,
                l.dropoff_address,
                l.dropoff_lat,
                l.dropoff_lng,

                hr.congenital_diseases, 
                hr.allergies

            FROM bookings b
            JOIN users u ON b.user_id = u.user_id
            LEFT JOIN locations l ON b.booking_id = l.booking_id
            LEFT JOIN health_records hr ON b.user_id = hr.user_id
            WHERE b.booking_id = $1
            `,
      [booking_id],
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ message: "not found" }, { status: 404 });
    }

    const job = result.rows[0];

    // ✅ Access control:
    // - If this booking is already assigned to a driver, only that driver can view it.
    // - If no driver assigned yet (pool job), any authenticated driver can view it (read-only).
    const assignedDriverId = job.driver_id;
    const isAssigned = assignedDriverId != null && String(assignedDriverId) !== "";
    const isMine = isAssigned && String(assignedDriverId) === String(driver_id);
    const readOnly = !isMine;

    if (isAssigned && !isMine) {
      return NextResponse.json(
        { message: "ไม่พบงานหรือไม่มีสิทธิ์เข้าถึง" },
        { status: 403 },
      );
    }

    // ===== logic คุมการกด ด้วย Luxon =====
    // ===== Luxon Time Guard (TH) =====
    const nowTH = DateTime.now().setZone("Asia/Bangkok");

    // วันที่ของงาน (ตัดเวลาออก)
    const bookingDateTH = DateTime.fromJSDate(job.booking_date)
      .setZone("Asia/Bangkok")
      .startOf("day");

    // เวลาเริ่มงานจริง (มีเวลา)
    // 1. เวลาปัจจุบัน

    // 2. เวลาเริ่มงาน (ดึงมาทั้งวันที่และเวลา)
    const startTimeTH = DateTime.fromJSDate(job.start_time).setZone(
      "Asia/Bangkok",
    );

    // 3. เงื่อนไขเพิ่มเติม: "สถานะงานต้องไม่ใช่สถานะที่จบไปแล้ว"
    // เช่น ถ้า status เป็น 'success' หรือ 'cancelled' ไม่ควรให้กด process ซ้ำ
    const isValidStatus =
      job.status !== "success" && job.status !== "cancelled";

    // สรุปสิทธิ์การกด: อนุญาตก่อนเริ่มงาน 1 ชั่วโมง (และหลังจากนั้น)
    const startWindowTH = startTimeTH.minus({ hours: 1 });
    const canProcess = isMine && nowTH >= startWindowTH && isValidStatus;

    let hasDriverReported = false;
    if (isMine) {
      const reportCheck = await pool.query(
        `
  SELECT actor_type
  FROM reports
  WHERE booking_id = $1
    AND actor_id = $2
  `,
        [booking_id, driver_id],
      );
      hasDriverReported = reportCheck.rows.length > 0;
    }

    // 🔒 Pool job: mask sensitive info until a driver accepts the job
    // (UI can still show schedule/route/price, but no phone/medical data)
    const safeJob = readOnly
      ? {
          ...job,
          phone_number: null,
          congenital_diseases: [],
          allergies: [],
        }
      : job;

    return NextResponse.json({
      job: safeJob,
      canProcess,
      hasDriverReported,
      readOnly,
      nowTH: nowTH.toISO(),
      bookingDateTH: bookingDateTH.toISODate(),
      startTimeTH: startTimeTH.toFormat("HH:mm"),
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: "server error" }, { status: 500 });
  }
}
