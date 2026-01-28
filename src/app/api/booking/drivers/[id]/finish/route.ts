import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { DateTime } from "luxon";
import { sendLineMessage } from "@/lib/line";
import { pusher } from "@/lib/pusher";


export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
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

    const updateResult = await pool.query(
      `
        UPDATE bookings
        SET status = 'success'
        WHERE booking_id = $1
            AND driver_id = $2
            AND status = 'paymented'
        RETURNING booking_id, status
        `,
      [booking_id, driver_id]
    );

    if (updateResult.rowCount === 0) {
      return NextResponse.json(
        { message: "ไม่สามารถปิดงานได้" },
        { status: 400 }
      );
    }

    await pool.query(
      `
      INSERT INTO logs (
        booking_id,
        event_type,
        event_action,
        message,
        actor_id,
        actor_type
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      `,
      [
        booking_id,
        "FINISH",
        "SUCCESS",
        "คนขับกดปิดงานเรียบร้อย",
        driver_id,
        "driver",
      ]
    );

    // Realtime: แจ้ง admin ให้ timeline/job เปลี่ยนทันที (best-effort)
    try {
      await pusher.trigger("private-admin", "booking-updated", {
        booking_id,
        status: "success",
        type: "DRIVER_FINISH_JOB",
        driver_id,
      });
    } catch (e) {
      console.error("PUSHER TRIGGER ERROR (ignored):", e);
    }

    const driverResult = await pool.query(
      `
      SELECT line_id , first_name
      FROM drivers
      WHERE driver_id = $1
      `,
      [driver_id]
    );

    if (driverResult.rows.length > 0) {
      const { line_id, first_name } = driverResult.rows[0];

      if (line_id) {
        try {
          await sendLineMessage(
            line_id,
            `✅ งานเสร็จสมบูรณ์\n\nคุณ ${first_name}\nได้ปิดงานหมายเลข #${booking_id} เรียบร้อยแล้ว`
          );
        } catch (e) {
          console.error("LINE SEND ERROR (ignored):", e);
        }
      }
    }

    return NextResponse.json({
      message: "ปิดงานสำเร็จ"
    }, { status: 201 });
  } catch (error) {
    console.log(error)
    return NextResponse.json({ message: "เกิดข้อผิดพลาด" }, { status: 500 })
  }
}
