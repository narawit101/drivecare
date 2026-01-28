import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { pusher } from "@/lib/pusher";
import { sendLineMessage } from "@/lib/line";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  const adminId = req.headers.get("x-admin-id");
  if (!adminId) {
    return NextResponse.json({ message: "ไม่ได้รับสิทธิ์" }, { status: 401 });
  }

  const { bookingId } = await params;
  const id = Number(bookingId);

  if (!Number.isFinite(id)) {
    return NextResponse.json({ message: "bookingId ไม่ถูกต้อง" }, { status: 400 });
  }

  try {
    await pool.query("BEGIN");

    // Capture related ids before deleting
    const bookingInfoRes = await pool.query(
      `SELECT 
        b.booking_id,
        b.driver_id,
        b.user_id,
        b.status,
        u.line_id AS user_line_id,
        d.line_id AS driver_line_id
      FROM bookings b
      LEFT JOIN users u ON u.user_id = b.user_id
      LEFT JOIN drivers d ON d.driver_id = b.driver_id
      WHERE b.booking_id = $1
      FOR UPDATE OF b`,
      [id]
    );

    if ((bookingInfoRes.rowCount ?? 0) === 0) {
      await pool.query("ROLLBACK");
      return NextResponse.json({ message: "ไม่พบการจอง" }, { status: 404 });
    }

    const bookingInfo = bookingInfoRes.rows[0] as {
      booking_id: number;
      driver_id: number | null;
      user_id: number | null;
      status: string | null;
      user_line_id: string | null;
      driver_line_id: string | null;
    };

    await pool.query(`DELETE FROM locations WHERE booking_id = $1`, [id]);
    await pool.query(`DELETE FROM logs WHERE booking_id = $1`, [id]);

    const deleted = await pool.query(`DELETE FROM bookings WHERE booking_id = $1`, [id]);

    await pool.query("COMMIT");

    // LINE: notify user + driver (if available). Never block deletion.
    const deletedTextUser = `❌ การจอง #${bookingInfo.booking_id} ถูกยกเลิกโดยผู้ดูแลระบบ`;
    const deletedTextDriver = `❌ งาน #${bookingInfo.booking_id} ถูกยกเลิกโดยผู้ดูแลระบบ`;

    if (bookingInfo.user_line_id) {
      try {
        await sendLineMessage(bookingInfo.user_line_id, deletedTextUser);
      } catch (e) {
        console.error("LINE SEND ERROR (ignored):", e);
      }
    }

    if (bookingInfo.driver_line_id) {
      try {
        await sendLineMessage(bookingInfo.driver_line_id, deletedTextDriver);
      } catch (e) {
        console.error("LINE SEND ERROR (ignored):", e);
      }
    }

    // Realtime: remove from driver pool list (หน้าแรก/งานว่าง)
    try {
      await pusher.trigger("private-driver", "booking.deleted", {
        booking_id: bookingInfo.booking_id,
        type: "ADMIN_DELETE_BOOKING",
      });
    } catch (e) {
      console.error("PUSHER TRIGGER ERROR (ignored):", e);
    }

    // Realtime: if booking had assigned driver, notify that driver too
    if (bookingInfo.driver_id) {
      try {
        await pusher.trigger(`private-driver-${bookingInfo.driver_id}`, "booking-updated", {
          booking_id: bookingInfo.booking_id,
          status: bookingInfo.status,
          type: "BOOKING_DELETED",
        });
      } catch (e) {
        console.error("PUSHER TRIGGER ERROR (ignored):", e);
      }
    }

    // Realtime: notify the booking owner (user) as well
    if (bookingInfo.user_id) {
      try {
        await pusher.trigger(`private-user-${bookingInfo.user_id}`, "booking-updated", {
          booking_id: bookingInfo.booking_id,
          status: bookingInfo.status,
          type: "BOOKING_DELETED",
        });
      } catch (e) {
        console.error("PUSHER TRIGGER ERROR (ignored):", e);
      }
    }

    // Realtime: update admin pages if open
    try {
      await pusher.trigger("private-admin", "booking-updated", {
        booking_id: bookingInfo.booking_id,
        status: bookingInfo.status,
        type: "ADMIN_DELETE_BOOKING",
      });
    } catch (e) {
      console.error("PUSHER TRIGGER ERROR (ignored):", e);
    }

    return NextResponse.json({ message: "ลบการจองสำเร็จ" }, { status: 200 });
  } catch (error) {
    try {
      await pool.query("ROLLBACK");
    } catch {
      // ignore
    }

    console.error("ADMIN DELETE BOOKING ERROR:", error);
    return NextResponse.json({ message: "ไม่สามารถลบการจองได้" }, { status: 500 });
  }
}
