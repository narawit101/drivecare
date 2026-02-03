import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { sendLineMessage } from "@/lib/line";
import { sendDriverAcceptedFlexMessage } from "@/services/sent-line-user/driver-accepted";
import { pusher } from "@/lib/pusher";
import { DateTime } from "luxon";
import { parseDbDateTimeTH, TH_ZONE } from "@/utils/db-datetime";



export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> } // 1. เปลี่ยน params ให้เป็น Promise
) {
  try {
    const { id } = await params;
    const booking_id = id;
    const driver_id = request.headers.get("x-driver-id");

    if (!driver_id) {
      return NextResponse.json(
        { message: "ไม่พบข้อมูลคนขับ" },
        { status: 401 }
      );
    }

    await pool.query("BEGIN");

    const timeCheck = await pool.query(
      `
  SELECT booking_date, start_time
  FROM bookings
  WHERE booking_id = $1
  `,
      [booking_id]
    );

    if (timeCheck.rows.length === 0) {
      await pool.query("ROLLBACK");
      return NextResponse.json({ message: "ไม่พบงาน" }, { status: 404 });
    }

    const nowTH = DateTime.now().setZone(TH_ZONE);

    const bookingDateRaw = timeCheck.rows[0].booking_date;
    const bookingDate = parseDbDateTimeTH(bookingDateRaw)?.startOf("day");

    const startTimeRaw = timeCheck.rows[0].start_time;
    const startTime = parseDbDateTimeTH(startTimeRaw);

    if (!bookingDate || !startTime) {
      await pool.query("ROLLBACK");
      return NextResponse.json(
        { message: "ข้อมูลวัน/เวลาไม่ถูกต้อง" },
        { status: 400 },
      );
    }

    // รวมวันที่ + เวลา (กรณี DB แยก)
    const bookingStart = bookingDate.set({
      hour: startTime.hour,
      minute: startTime.minute,
    });

    // ❌ ถ้าเลยเวลาเริ่มงานแล้ว → ห้ามรับ

    const lateLimit = bookingStart.plus({ minutes: 30 });

    if (nowTH > lateLimit) {
      await pool.query("ROLLBACK");
      return NextResponse.json(
        { message: "งานนี้เลยเวลาเริ่มเกินกำหนดแล้ว" },
        { status: 400 }
      );
    }
    const checkStatus = await pool.query(
      `
    SELECT status 
    FROM drivers
    WHERE driver_id = $1
    `,
      [driver_id]
    );
    const driverStatus = checkStatus.rows[0]?.status;

    if (driverStatus !== "active") {
      await pool.query("ROLLBACK");
      return NextResponse.json(
        { message: "บัญชีของคุณไม่ออนไลน์ในขณะนี้" },
        { status: 403 }
      );
    }
    const checkVerify = await pool.query(
      "SELECT verified FROM drivers WHERE driver_id = $1",
      [driver_id]
    );

    const driverVerified = checkVerify.rows[0]?.verified;
    if (driverVerified !== "approved") {
      await pool.query("ROLLBACK");
      return NextResponse.json(
        { message: "บัญชีของคุณยังไม่ผ่านการอนุมัติ" },
        { status: 403 }
      );
    }

    const check = await pool.query(
      `SELECT booking_id 
       FROM bookings 
       WHERE booking_id = $1
         AND status = 'pending'
         AND driver_id IS NULL
       FOR UPDATE`,
      [booking_id]
    );

    if (check.rows.length === 0) {
      await pool.query("ROLLBACK");
      return NextResponse.json(
        { message: "งานนี้ถูกรับไปแล้ว" },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `UPDATE bookings
       SET driver_id = $1,
           status = 'accepted'
       WHERE booking_id = $2
       RETURNING booking_id, driver_id, status`,
      [driver_id, booking_id]
    );

    await pool.query(
      `INSERT INTO logs (
        booking_id, event_type, event_action, message, actor_id,actor_type
      ) VALUES ($1, $2, $3, $4, $5,$6)`,
      [booking_id,
        "ACCEPTED",
        "Accepted_Work",
        "มีคนขับรับงานแล้ว",
        driver_id,
        "driver"
      ]
    )

    await pool.query("COMMIT");

    const bookingIdNumber = Number(booking_id);
    const driverIdNumber = Number(driver_id);

    // NOTE: driver "self-accept" is not the same as "admin assigned".
    // Emit on driver-specific channel so job-detail (which subscribes to private-driver-{id}) updates realtime.
    await pusher.trigger(`private-driver-${driverIdNumber}`, "booking-updated", {
      booking_id: bookingIdNumber,
      driver_id: driverIdNumber,
      status: "accepted",
      type: "DRIVER_ACCEPT_JOB",
    });

    // Keep existing global driver channel for any screens that use it.
    await pusher.trigger("private-driver", "booking.accepted", {
      booking_id: bookingIdNumber,
      driver_id: driverIdNumber,
    });

    // แจ้ง admin ด้วย (ให้หน้า overview/โมดอลที่ฟัง booking-updated อัปเดตได้ทันที)
    await pusher.trigger("private-admin", "booking-updated", {
      booking_id: bookingIdNumber,
      driver_id: driverIdNumber,
      status: "accepted",
      type: "DRIVER_ACCEPT_JOB",
    });

    const info = await pool.query(
      `
  SELECT 
    u.line_id,
    u.first_name AS user_first_name,
    d.first_name AS driver_first_name,
    d.last_name AS driver_last_name,
    d.phone_number AS driver_phone,
    d.car_brand,
    d.car_model,
    d.car_plate
  FROM bookings b
  JOIN users u ON b.user_id = u.user_id
  JOIN drivers d ON b.driver_id = d.driver_id
  WHERE b.booking_id = $1
  `,
      [booking_id]
    );

    const data = info.rows[0];

    // 1. ตรวจสอบว่ามีข้อมูล data และ line_id หรือไม่
    if (data && data.line_id && data.line_id.trim() !== "") {
      try {
        await sendDriverAcceptedFlexMessage(
          data.line_id,
          data.driver_first_name,
          data.driver_last_name,
          data.driver_phone,
          data.car_brand,
          data.car_model,
          data.car_plate,
          parseInt(booking_id)
        );
      } catch (lineError) {
        console.error("LINE FLEX Notify Error (ignored):", lineError);
        // Fallback to text message if flex fails
        try {
          const fallbackMessage = 
`🚗 มีคนขับรับงานของคุณแล้ว
👤 คนขับ: ${data.driver_first_name} ${data.driver_last_name}
📞 เบอร์โทร: ${data.driver_phone}
🚘 รถ: ${data.car_brand}-${data.car_model} (${data.car_plate})
ขอให้เดินทางโดยสวัสดิภาพ 🙏`;
          await sendLineMessage(data.line_id, fallbackMessage);
        } catch (fallbackError) {
          console.error("LINE FALLBACK Notify Error (ignored):", fallbackError);
        }
      }
    }

    return NextResponse.json(
      { message: "รับงานสำเร็จ", booking: result.rows[0] },
      { status: 201 }
    );

  } catch (error) {
    console.log("Error logic:", error);
    // ตรวจสอบให้แน่ใจว่าได้ Rollback หากเกิด error ระหว่างทาง
    try { await pool.query("ROLLBACK"); } catch (e) { /* ignore rollback error */ }

    return NextResponse.json(
      { message: "ไม่สามารถรับงานได้" },
      { status: 500 }
    );
  }
}