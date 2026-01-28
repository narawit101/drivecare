import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { pusher } from "@/lib/pusher";
import { sendLineMessage } from "@/lib/line";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const booking_id = id;

    const adminId = request.headers.get("x-admin-id");
    if (!adminId) {
      return NextResponse.json({ message: "ไม่ได้รับสิทธิ์" }, { status: 401 });
    }
    const { status } = await request.json();

    if (!["verified", "rejected"].includes(status)) {
      return NextResponse.json(
        { message: "status ไม่ถูกต้อง" },
        { status: 400 },
      );
    }

    await pool.query("BEGIN");

    /* ---------------- 🔍 ตรวจ booking ---------------- */
    const bookingRes = await pool.query(
      `
      SELECT b.status, b.payment_status, b.user_id, b.driver_id, u.line_id
      FROM bookings b
      JOIN users u ON b.user_id = u.user_id
      WHERE b.booking_id = $1
      FOR UPDATE
      `,
      [booking_id],
    );

    if (bookingRes.rowCount === 0) {
      await pool.query("ROLLBACK");
      return NextResponse.json({ message: "ไม่พบการจอง" }, { status: 404 });
    }

    const booking = bookingRes.rows[0];

    const canVerify =
      (booking.status === "paymented" || booking.status === "success") &&
      booking.payment_status === "waiting_verify";

    if (!canVerify) {
      await pool.query("ROLLBACK");
      return NextResponse.json(
        { message: "ไม่สามารถตรวจสลิปในสถานะนี้ได้" },
        { status: 400 },
      );
    }

    /* ---------------- ✏️ update payment_status ---------------- */
    const newPaymentStatus =
      status === "verified" ? "verified" : "rejected"; // 🔥 rejected → ให้ลูกค้าอัปใหม่

    await pool.query(
      `
      UPDATE bookings
      SET payment_status = $1
      WHERE booking_id = $2
      `,
      [newPaymentStatus, booking_id],
    );
    /* ---------------- 🧾 log ---------------- */
    await pool.query(
      `
      INSERT INTO logs
      (booking_id, event_type, event_action, message, actor_id, actor_type)
      VALUES ($1, 'PAYMENT_VERIFY', $2, $3, $4, 'admin')
      `,
      [booking_id, newPaymentStatus, `payment_${newPaymentStatus}`, adminId],
    );

    await pool.query("COMMIT");

    /* ---------------- 🔔 REALTIME ---------------- */
    const payload = {
      type:
        status === "verified" ? "ADMIN_VERIFY_PAYMENT" : "ADMIN_REJECT_PAYMENT",
      booking_id,
      payment_status: newPaymentStatus,
      can_upload_again: status === "rejected",
    };

    // ลูกค้า
    pusher.trigger(
      `private-user-${booking.user_id}`,
      "booking-updated",
      payload,
    );

    // คนขับ
    if (booking.driver_id) {
      pusher.trigger(
        `private-driver-${booking.driver_id}`,
        "booking-updated",
        payload,
      );
    }

    // admin (refresh list)
    pusher.trigger("private-admin", "booking-updated", payload);

    /* ---------------- 💬 LINE ---------------- */
    if (booking.line_id) {
      const msg =
        status === "verified"
          ? "✅ การชำระเงินของคุณได้รับการตรวจสอบแล้ว"
          : `❌ การชำระเงินไม่ผ่านการตรวจสอบกรุณาไปที่หน้าชำระเงินเพื่ออัปโหลดสลิปใหม่อีกครั้ง
            เลขที่การจอง: ${booking_id}`;

      try {
        await sendLineMessage(booking.line_id, msg);
      } catch (err) {
        console.error("LINE ERROR:", err);
      }
    }

    return NextResponse.json({
      message: "อัปเดตสถานะสลิปสำเร็จ",
      payment_status: newPaymentStatus,
    });
  } catch (error) {
    console.error(error);
    await pool.query("ROLLBACK");
    return NextResponse.json({ message: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
