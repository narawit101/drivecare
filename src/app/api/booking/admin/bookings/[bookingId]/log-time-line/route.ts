import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  const adminId = req.headers.get("x-admin-id");
  if (!adminId) {
    return NextResponse.json({ message: "unauthorized" }, { status: 401 });
  }

  const { bookingId } = await params;
  const id = Number(bookingId);

  if (!Number.isFinite(id)) {
    return NextResponse.json({ message: "bookingId ไม่ถูกต้อง" }, { status: 400 });
  }

  try {
    const result = await pool.query(
      `
      SELECT
        event_type,
        event_action,
        message,
        actor_id,
        actor_type,
        create_at
      FROM logs
      WHERE booking_id = $1
        AND (
          actor_type = 'driver'
          OR actor_type = 'admin'
          OR actor_type = 'user'
        )
      ORDER BY create_at ASC
      `,
      [id]
    );

    const timeline = result.rows.map((row) => ({
      time: row.create_at,
      label: mapTimelineLabel(row),
    }));

    return NextResponse.json({ timeline }, { status: 200 });
  } catch (error) {
    console.error("ADMIN TIMELINE ERROR:", error);
    return NextResponse.json({ message: "server error" }, { status: 500 });
  }
}

function mapTimelineLabel(log: any) {
  const STATUS_MAP: Record<string, string> = {
    going_pickup: "กำลังไปรับผู้ป่วย",
    picked_up: "รับผู้ป่วยแล้ว",
    heading_to_hospital: "กำลังเดินทางไปโรงพยาบาล",
    arrived_at_hospital: "ถึงโรงพยาบาลแล้ว",
    waiting_for_return: "รอรับผู้ป่วยกลับ",
    heading_home: "กำลังเดินทางกลับ",
    arrived_home: "ถึงบ้านเรียบร้อย",
    WAITING_PAYMENT: "รอการชำระเงิน",
    SUBMIT_SLIP: "ผู้ป่วยแจ้งโอนเงินและแนบสลิป",
    USER_CANCELLED: "ผู้ป่วยยกเลิกการจอง",
    verified: "แอดมินยืนยันการชำระเงินเรียบร้อย",
    rejected: "แอดมินปฏิเสธการชำระเงิน",
  };

  // If admin changed status, always show that the admin was the actor.
  if (log.actor_type === "admin" && log.event_type === "STATUS_UPDATE") {
    const mapped = STATUS_MAP[log.event_action] || log.message || "";
    // Avoid double-prefixing if the message already contains it.
    if (typeof mapped === "string" && mapped.includes("แอดมิน")) return mapped;
    return mapped ? `แอดมินเปลี่ยนสถานะ: ${mapped}` : "แอดมินเปลี่ยนสถานะ";
  }

  if (log.event_type === "REPORT_FROM_USER") {
    return `ผู้ป่วยรายงานปัญหา: ${log.message}`;
  }

  if (log.event_type === "REPORT_FROM_DRIVER") {
    return `คนขับรายงานปัญหา: ${log.message}`;
  }

  if (log.event_type === "REPORT_REPLY_ADMIN") {
    const target = String(log.event_action ?? "").trim();
    const msg = String(log.message ?? "").trim();
    if (target === "user") return msg ? `แอดมินตอบกลับรายงานของผู้ป่วย: ${msg}` : "แอดมินตอบกลับรายงานของผู้ป่วย";
    if (target === "driver") return msg ? `แอดมินตอบกลับรายงานของคนขับ: ${msg}` : "แอดมินตอบกลับรายงานของคนขับ";
    return msg ? `แอดมินตอบกลับรายงาน: ${msg}` : "แอดมินตอบกลับรายงาน";
  }

  return STATUS_MAP[log.event_action] || log.message;
}
