import pool from "@/lib/db";
import { pusher } from "@/lib/pusher";
import { NextResponse, NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const driver_id = request.headers.get("x-driver-id");

    if (!driver_id) {
      return NextResponse.json(
        { message: "ไม่พบข้อมูลคนขับ" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { booking_id, report_type, message } = body;

    if (!booking_id || !report_type || !message) {
      return NextResponse.json(
        { message: "กรุณากรอกข้อมูลให้ครบถ้วน" },
        { status: 400 }
      );
    }

    // 2. Security Check: ตรวจสอบว่า User คนนี้เกี่ยวข้องกับ Booking นี้จริงไหม
    const checkOwner = await pool.query(
      `SELECT booking_id FROM bookings WHERE booking_id = $1 AND driver_id = $2`,
      [booking_id, driver_id]
    );

    if (checkOwner.rowCount === 0) {
      return NextResponse.json(
        { message: "คุณไม่มีสิทธิ์รายงานรายการจองนี้" },
        { status: 403 }
      );
    }

    const duplicateCheck = await pool.query(
      `
  SELECT report_id
  FROM reports
  WHERE booking_id = $1
    AND actor_id = $2
    AND actor_type = 'driver'
  `,
      [booking_id, driver_id]
    );

    if (duplicateCheck.rows.length > 0) {
      return NextResponse.json(
        { message: "คุณได้รายงานรายการนี้ไปแล้ว" },
        { status: 409 }
      );
    }

    const result = await pool.query(
      `INSERT INTO reports (booking_id,report_type, message, actor_id, actor_type) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [booking_id, report_type, message, driver_id, 'driver']
    );

    await pool.query(
      `INSERT INTO logs (
        booking_id, event_type, event_action, message, actor_id, actor_type
      ) VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        booking_id,
        "REPORT_FROM_DRIVER",
        report_type,
        `${message}`,
        driver_id,
        "driver"
      ]
    );

    const findUserId = await pool.query(
      `
      SELECT  b.user_id, b.driver_id
      FROM bookings b
      JOIN users u ON b.user_id = u.user_id
      WHERE b.booking_id = $1
      FOR UPDATE
      `,
      [booking_id]
    );

    if (findUserId.rowCount === 0) {
      await pool.query("ROLLBACK");
      return NextResponse.json({ message: "ไม่พบการจอง" }, { status: 404 });
    }

    const userId = findUserId.rows[0].user_id;
    console.log("User ID for notification:", userId);

    if (userId) {
      await pusher.trigger(`private-user-${userId}`, 'report-created', {
        type: "REPORT_FROM_DRIVER",
        report: result.rows[0],
      });
      await pusher.trigger("private-admin", "report-created", {
        type: "REPORT_FROM_DRIVER",
        report: result.rows[0],
      });
    }



    return NextResponse.json(
      { message: "รายงานสำเร็จ", result: result.rows[0] },
      { status: 201 }
    );
  } catch (error) {
    console.error("Report Error:", error);
    return NextResponse.json(
      { message: "ไม่สามารถส่งรายงานได้ในขณะนี้" },
      { status: 500 }
    );
  }
}
