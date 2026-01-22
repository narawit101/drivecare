import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { DateTime } from "luxon";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const booking_id = id;
        const driver_id = req.headers.get("x-driver-id");

        if (!driver_id) {
            return NextResponse.json(
                { message: "unauthorized" },
                { status: 401 }
            );
        }

        // ✅ Access control:
        // - If assigned: only assigned driver can view timeline
        // - If unassigned: allow authenticated drivers to view (read-only)
        const bookingCheck = await pool.query(
            `
      SELECT booking_id, driver_id
      FROM bookings
      WHERE booking_id = $1
      `,
            [booking_id]
        );

        if (bookingCheck.rowCount === 0) {
            return NextResponse.json(
                { message: "ไม่พบงาน" },
                { status: 404 }
            );
        }

        const assignedDriverId = bookingCheck.rows[0]?.driver_id;
        const isAssigned = assignedDriverId != null && String(assignedDriverId) !== "";
        const isMine = isAssigned && String(assignedDriverId) === String(driver_id);

        if (isAssigned && !isMine) {
            return NextResponse.json(
                { message: "ไม่พบงานหรือไม่มีสิทธิ์เข้าถึง" },
                { status: 403 }
            );
        }

        // ✅ ดึง timeline จาก logs
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
                    actor_type = 'admin'
                    OR actor_type = 'user'
                    OR actor_type = 'driver'
                )
            ORDER BY create_at ASC
            `,
                        [booking_id]
                );

                // 🔒 If unassigned pool job, hide driver-only logs (if any exist)
                const rows = isAssigned ? result.rows : result.rows.filter((r) => r.actor_type !== 'driver');

        const timeline = rows.map((row) => {
            return {
                time: row.create_at,
                datetime: row.create_at,
                type: row.event_type,
                action: row.event_action,
                label: mapTimelineLabel(row),
                actor_type: row.actor_type,
            };
        });

        return NextResponse.json({ timeline });
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { message: "server error" },
            { status: 500 }
        );
    }
}

/* =========================
   MAP LOG → LABEL THAI
========================= */
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
        if (target === "driver") return msg ? `แอดมินตอบกลับรายงานของคุณ: ${msg}` : "แอดมินตอบกลับรายงานของคุณ";
        return msg ? `แอดมินตอบกลับรายงาน: ${msg}` : "แอดมินตอบกลับรายงาน";
    }
    return STATUS_MAP[log.event_action] || log.message;
}
