import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { calculatePrice } from "@/services/calculatePrice";
import { sendLineMessage } from "@/lib/line";
import { DateTime } from "luxon";
import { pusher } from "@/lib/pusher";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const booking_id = id;
    const driver_id = request.headers.get("x-driver-id");

    if (!driver_id) {
      return NextResponse.json(
        { message: "ไม่พบข้อมูลคนขับ" },
        { status: 401 },
      );
    }
    const bookingRes = await pool.query(
      `SELECT 
        b.start_time,
        b.status,
        b.payment_status,
        b.user_id,
        u.line_id
       FROM bookings b
       JOIN users u ON b.user_id = u.user_id
       WHERE b.booking_id = $1
       AND b.driver_id = $2`,
      [booking_id, driver_id],
    );

    if (bookingRes.rowCount === 0) {
      return NextResponse.json(
        { message: "ไม่พบงานหรือไม่มีสิทธิ์" },
        { status: 404 },
      );
    }

    const { start_time, status, payment_status, line_id } = bookingRes.rows[0];

    if (status === "pending_payment" || payment_status === "waiting_verify") {
      return NextResponse.json(
        { message: "งานนี้ถูกปิดและรอชำระเงินแล้ว" },
        { status: 400 },
      );
    }

    const startTime = DateTime.fromJSDate(start_time).setZone("Asia/Bangkok");

    const now = DateTime.now().setZone("Asia/Bangkok");

    const payload = {
      start_time: startTime.toJSDate(),
      end_time: now.toJSDate(),
      rate_price: 50,
    };

    const result = await calculatePrice(payload);
    // console.log(totalPrice)

    const { diff_hours, total_price } = result;
    await pool.query(
      `UPDATE bookings
       SET 
         end_time = $1,
         total_hours = $2,
         total_price = $3,
         status = 'pending_payment'
       WHERE booking_id = $4`,
      [now.toJSDate(), diff_hours, total_price, booking_id],
    );

    await pool.query(
      `INSERT INTO logs (
        booking_id, event_type, event_action, message, actor_id, actor_type
      ) VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        booking_id,
        "PAYMENT",
        "WAITING_PAYMENT",
        "คนขับกดเปลี่ยนสถานะเป็นรอการชำระเงิน",
        driver_id,
        "driver",
      ],
    );

    // Realtime: แจ้ง admin ให้ timeline/job เปลี่ยนทันที (best-effort)
    try {
      await pusher.trigger("private-admin", "booking-updated", {
        booking_id,
        status: "pending_payment",
        type: "DRIVER_WAITING_PAYMENT",
        driver_id,
      });

      const user_id = bookingRes.rows[0].user_id;
      if (user_id) {
        await pusher.trigger(`private-user-${user_id}`, "booking-updated", {
          booking_id,
          status: "pending_payment",
          type: "STATUS_UPDATE",
        });
      }
    } catch (e) {
      console.error("PUSHER TRIGGER ERROR (ignored):", e);
    }
    if (line_id) {
      const lineMessage = `
🚑 การเดินทางของคุณสำเร็จแล้ว

⏱ ระยะเวลา: ${diff_hours.toFixed(2)} ชั่วโมง
💰 ค่าบริการทั้งหมด: ${total_price.toLocaleString()} บาท

กรุณาชำระเงินและแนบสลิปผ่านแอปพลิเคชันของเราเพื่อยืนยันการชำระเงิน
ขอบคุณที่ใช้บริการ 🙏
      `.trim();

      try {
        await sendLineMessage(line_id, lineMessage);
      } catch (lineError) {
        console.error("LINE SEND ERROR:", lineError);
        // ❗ ไม่ throw เพื่อไม่ให้ API พัง
      }
    }

    return NextResponse.json(
      {
        message: "แจ้งผู้ป่วยให้ชำระเงินเรียบร้อยแล้ว",
        total_hours: diff_hours,
        total_price,
        end_time: now.toFormat("dd/MM/yyyy HH:mm"),
      },
      { status: 200 },
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "ไม่สามารถบันทึกเวลาจบงานได้" },
      { status: 500 },
    );
  }
}
