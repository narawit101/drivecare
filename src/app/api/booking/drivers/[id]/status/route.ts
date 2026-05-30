import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { sendLineMessage } from "@/lib/line";
import { sendStatusUpdateFlexMessage } from "@/services/sent-line-user/status-update";
import { pusher } from "@/lib/pusher";
import { DateTime } from "luxon";
import { parseDbDateTimeTH, TH_ZONE } from "@/utils/db-datetime";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const booking_id = id;
    const { status: new_status } = await request.json();
    const driver_id = request.headers.get("x-driver-id");

    if (!driver_id) {
      return NextResponse.json(
        { message: "ไม่พบข้อมูลคนขับ" },
        { status: 401 }
      );
    }
    const ACTIVE_STATUSES = [
      'in_progress',
      'going_pickup',
      'picked_up',
      'heading_to_hospital',
      'arrived_at_hospital',
      'waiting_for_return',
      'heading_home',
      'arrived_home',
      'pending_payment',
      'paymented',
    ]

    const generalStatuses = [
      "going_pickup",
      "picked_up",
      "heading_to_hospital",
      "arrived_at_hospital",
      "waiting_for_return",
      "heading_home",
      "arrived_home",
      "pending_payment",
    ];

    const STATUS_THAI_MAP: Record<string, string> = {
      going_pickup: "คนขับกำลังเดินทางไปรับผู้ป่วย",
      picked_up: "รับผู้ป่วยเรียบร้อย",
      heading_to_hospital: "กำลังเดินทางไปโรงพยาบาล",
      arrived_at_hospital: "ถึงโรงพยาบาลแล้ว",
      waiting_for_return: "รอรับผู้ป่วยกลับ",
      heading_home: "กำลังเดินทางกลับ",
      arrived_home: "ถึงบ้านเรียบร้อย",
      pending_payment: "รอชำระเงิน",
    };

    const ALLOWED_NEXT_STATUS: Record<string, string[]> = {
      accepted: ["in_progress", "going_pickup"],
      in_progress: ["going_pickup"],
      going_pickup: ["picked_up"],
      picked_up: ["heading_to_hospital"],
      heading_to_hospital: ["arrived_at_hospital"],
      arrived_at_hospital: ["waiting_for_return"],
      waiting_for_return: ["heading_home"],
      heading_home: ["arrived_home"],
      arrived_home: ["pending_payment"],
    };


    if (!generalStatuses.includes(new_status)) {
      return NextResponse.json({ message: "สถานะไม่ถูกต้อง" }, { status: 400 });
    }

    await pool.query("BEGIN");
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
    // 🔍 ดึงสถานะปัจจุบันของงานนี้
    const current = await pool.query(
      `
  SELECT status, start_time
  FROM bookings
  WHERE booking_id = $1
    AND driver_id = $2
  FOR UPDATE
  `,
      [booking_id, driver_id]
    );

    if (current.rowCount === 0) {
      await pool.query("ROLLBACK");
      return NextResponse.json(
        { message: "ไม่พบงาน" },
        { status: 404 }
      );
    }

    const currentStatus = current.rows[0].status;
    const startTime = current.rows[0].start_time as unknown;

    //  ตรวจสอบการเริ่มงานล่วงหน้า (Start Time Restriction)
    // คนขับจะกดเริ่มงาน (in_progress หรือ going_pickup) ได้ไม่เกิน 1 ชั่วโมงก่อนเวลากำหนดการเท่านั้น
    if (startTime && (new_status === "in_progress" || new_status === "going_pickup")) {
      const nowTH = DateTime.now().setZone(TH_ZONE);
      const startTimeTH = parseDbDateTimeTH(startTime);
      if (!startTimeTH) {
        await pool.query("ROLLBACK");
        return NextResponse.json(
          { message: "ข้อมูลวัน/เวลาไม่ถูกต้อง" },
          { status: 400 },
        );
      }
      const startWindowTH = startTimeTH.minus({ hours: 1 });

      if (nowTH < startWindowTH) {
        await pool.query("ROLLBACK");
        return NextResponse.json(
          { message: `คุณสามารถเริ่มงานได้ก่อนเวลานัดหมายล่วงหน้าไม่เกิน 1 ชั่วโมงเท่านั้น (เริ่มเปิดให้กดได้ตั้งแต่เวลา ${startWindowTH.toFormat("HH:mm")} น.)` },
          { status: 403 }
        );
      }
    }

    // ❌ กันการข้ามลำดับสถานะ
    if (!ALLOWED_NEXT_STATUS[currentStatus]?.includes(new_status)) {
      await pool.query("ROLLBACK");
      return NextResponse.json(
        { message: "ลำดับสถานะไม่ถูกต้อง ต้องกดเริ่มงานก่อน" },
        { status: 429 }
      );
    }

    const active = await pool.query(
      `
  SELECT booking_id
  FROM bookings
  WHERE driver_id = $1
    AND booking_id != $2
    AND status = ANY($3)
  FOR UPDATE
  `,
      [driver_id, booking_id, ACTIVE_STATUSES]
    );

    if (active.rows.length > 0) {
      await pool.query("ROLLBACK");
      return NextResponse.json(
        { message: "คุณมีงานที่กำลังดำเนินการอยู่ ไม่สามารถเริ่มงานอื่นได้" },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `
  UPDATE bookings b
  SET status = $1
  FROM users u
  WHERE b.booking_id = $2
    AND b.driver_id = $3
    AND b.user_id = u.user_id
  RETURNING b.status, u.line_id,b.user_id
  `,
      [new_status, booking_id, driver_id]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { message: "ไม่พบงานหรือไม่มีสิทธิ์แก้ไข" },
        { status: 404 }
      );
    }

    await pool.query(
      `INSERT INTO logs (booking_id, event_type, event_action, message, actor_id, actor_type)
       VALUES ($1, 'STATUS_UPDATE', $2, $3, $4, 'driver')`,
      [booking_id, new_status, `${new_status}`, driver_id]
    );

    await pool.query("COMMIT");
    const bookingUserId = result.rows[0]?.user_id;

    // Realtime for admin (best-effort)
    try {
      await pusher.trigger("private-admin", "booking-updated", {
        booking_id,
        status: new_status,
        type: "DRIVER_STATUS_UPDATE",
        driver_id,
      });

      if (bookingUserId) {
        await pusher.trigger(`private-user-${bookingUserId}`, "booking-updated", {
          booking_id,
          status: new_status,
          type: "STATUS_UPDATE",
        });
      }
    } catch (e) {
      console.error("PUSHER TRIGGER ERROR (ignored):", e);
    }

    const thaiStatus = STATUS_THAI_MAP[new_status] || new_status;
    const lineId = result.rows[0].line_id;

    try {
      if (lineId) {
        await sendStatusUpdateFlexMessage(
          lineId,
          parseInt(booking_id),
          thaiStatus,
          new_status
        );
      }
    } catch (err) {
      console.error("❌ LINE FLEX PUSH FAILED", err);
      // Fallback to text message if flex fails
      try {
        if (lineId) {
          await sendLineMessage(
            lineId,
            `🚑 สถานะการเดินทางของคุณถูกอัปเดต\n${thaiStatus}`
          );
        }
      } catch (fallbackErr) {
        console.error("❌ LINE FALLBACK PUSH FAILED", fallbackErr);
      }
    }

    return NextResponse.json({
      message: "อัปเดตสถานะสำเร็จ",
      status: result.rows[0].status,
    });
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { message: "เกิดข้อผิดพลาดในการอัปเดตสถานะ" },
      { status: 500 }
    );
  }
}
