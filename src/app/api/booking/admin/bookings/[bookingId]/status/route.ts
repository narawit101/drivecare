import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { sendLineMessage } from "@/lib/line";
import { pusher } from "@/lib/pusher";

const ALLOWED_STATUSES = new Set([
    "pending",
    "accepted",
    "in_progress",
    "going_pickup",
    "picked_up",
    "heading_to_hospital",
    "arrived_at_hospital",
    "waiting_for_return",
    "heading_home",
    "arrived_home",
    "pending_payment",
    "paymented",
    "success",
    "cancelled",
]);

const STATUS_THAI_MAP: Record<string, string> = {
    pending: "รอมอบหมาย",
    accepted: "รับงานแล้ว",
    in_progress: "กำลังดำเนินงาน",
    going_pickup: "กำลังไปรับผู้ป่วย",
    picked_up: "รับผู้ป่วยแล้ว",
    heading_to_hospital: "กำลังไปโรงพยาบาล",
    arrived_at_hospital: "ถึงโรงพยาบาลแล้ว",
    waiting_for_return: "รอรับกลับ",
    heading_home: "กำลังเดินทางกลับ",
    arrived_home: "ถึงบ้านแล้ว",
    pending_payment: "รอชำระเงิน",
    paymented: "ชำระเงินแล้ว",
    success: "ปิดงานเรียบร้อย",
    cancelled: "ยกเลิกแล้ว",
};

export async function PATCH(
    request: NextRequest,
    ctx: { params: Promise<{ bookingId: string }> }
) {
    const adminId = request.headers.get("x-admin-id");

    if (!adminId) {
        return NextResponse.json({ message: "ไม่ได้รับสิทธิ์" }, { status: 401 });
    }

    const { bookingId } = await ctx.params;
    const id = Number(bookingId);

    if (!Number.isFinite(id)) {
        return NextResponse.json({ message: "bookingId ไม่ถูกต้อง" }, { status: 400 });
    }

    let body: { status?: string };
    try {
        body = (await request.json()) as { status?: string };
    } catch {
        return NextResponse.json({ message: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
    }

    const nextStatus = (body.status ?? "").trim();
    if (!ALLOWED_STATUSES.has(nextStatus)) {
        return NextResponse.json({ message: "สถานะไม่ถูกต้อง" }, { status: 400 });
    }

    if (nextStatus === "pending") {
        return NextResponse.json(
            { message: "ไม่สามารถตั้งสถานะกลับเป็นรอมอบหมายได้" },
            { status: 400 }
        );
    }

    try {
        await pool.query("BEGIN");

        const bookingInfo = await pool.query(
            `
            SELECT
                b.status,
                b.driver_id,
                b.user_id,
                u.line_id AS user_line_id,
                d.line_id AS driver_line_id
            FROM bookings b
            JOIN users u ON b.user_id = u.user_id
            LEFT JOIN drivers d ON b.driver_id = d.driver_id
            WHERE b.booking_id = $1
            FOR UPDATE OF b
            `,
            [id]
        );

        if (bookingInfo.rowCount === 0) {
            await pool.query("ROLLBACK");
            return NextResponse.json({ message: "ไม่พบการจอง" }, { status: 404 });
        }

        const currentStatus = (bookingInfo.rows[0]?.status ?? "").trim();
        const driverId = bookingInfo.rows[0]?.driver_id as number | null;
        const userId = bookingInfo.rows[0]?.user_id as number | null;
        const userLineId = bookingInfo.rows[0]?.user_line_id as string | null;
        const driverLineId = bookingInfo.rows[0]?.driver_line_id as string | null;

        // ✅ ถ้าปิดงานแล้ว ไม่ให้เปลี่ยนสถานะใดๆ (รวมถึงปิดซ้ำ)
        if (currentStatus === "success") {
            await pool.query("ROLLBACK");
            return NextResponse.json(
                { message: "ปิดงานแล้ว ไม่สามารถเปลี่ยนสถานะได้" },
                { status: 400 }
            );
        }

        // ✅ ถ้ายกเลิกแล้ว ไม่ให้เปลี่ยนสถานะใดๆ
        if (currentStatus === "cancelled") {
            await pool.query("ROLLBACK");
            return NextResponse.json(
                { message: "งานนี้ถูกยกเลิกแล้ว ไม่สามารถเปลี่ยนสถานะได้" },
                { status: 400 }
            );
        }

        // ✅ ตาม requirement: งานรอมอบหมาย (pending) เปลี่ยนสถานะไม่ได้
        if (currentStatus === "pending") {
            await pool.query("ROLLBACK");
            return NextResponse.json(
                { message: "งานสถานะรอมอบหมาย ยังไม่สามารถเปลี่ยนสถานะได้" },
                { status: 400 }
            );
        }

        // ✅ ถ้ายังไม่มีคนขับ ให้กันการอัปเดตสถานะการเดินทาง
        if (!driverId) {
            await pool.query("ROLLBACK");
            return NextResponse.json(
                { message: "ยังไม่มีคนขับ ไม่สามารถเปลี่ยนสถานะได้" },
                { status: 400 }
            );
        }

        const updated = await pool.query(
            `
            UPDATE bookings
            SET status = $1
            WHERE booking_id = $2
            RETURNING booking_id, status
            `,
            [nextStatus, id]
        );

        const thaiStatus = STATUS_THAI_MAP[nextStatus] || nextStatus;

        await pool.query(
            `
            INSERT INTO logs (
                booking_id, event_type, event_action, message, actor_id, actor_type
            ) VALUES ($1, $2, $3, $4, $5, $6)
            `,
            [
                id,
                "STATUS_UPDATE",
                nextStatus,
                `แอดมินอัปเดตสถานะเป็น ${thaiStatus}`,
                adminId,
                "admin",
            ]
        );

        await pool.query("COMMIT");

        // ✅ REALTIME: แจ้งไปหา driver job-detail + admin หน้าอื่น (best-effort)
        try {
            const payload = {
                booking_id: id,
                status: nextStatus,
                type: "ADMIN_STATUS_UPDATE",
            };

            if (driverId) {
                await pusher.trigger(`private-driver-${driverId}`, "booking-updated", payload);
            }

            // แจ้งผู้ป่วยด้วย (ให้ UI update แบบเดียวกับ driver status update)
            if (userId) {
                await pusher.trigger(`private-user-${userId}`, "booking-updated", {
                    booking_id: id,
                    status: nextStatus,
                    type: "STATUS_UPDATE",
                });
            }

            // optional: ให้ admin หน้าอื่น refresh ได้
            await pusher.trigger("private-admin", "booking-updated", { ...payload, user_id: userId ?? undefined });
        } catch (e) {
            console.error("PUSHER TRIGGER ERROR (ignored):", e);
        }

        // ✅ ส่ง LINE (best-effort)
        try {
            // ตาม requirement: ถ้าแอดมินยกเลิกงาน ส่งไปหา "คนขับ" + "ผู้ป่วย"
            if (nextStatus === "cancelled") {
                const userIdTrimmed = (userLineId ?? "").trim();
                const driverIdTrimmed = (driverLineId ?? "").trim();

                if (driverIdTrimmed) {
                    try {
                        await sendLineMessage(
                            driverIdTrimmed,
                            `🚫 งานถูกยกเลิกโดยแอดมิน\nรหัสการจอง: ${id}`
                        );
                    } catch (lineError) {
                        console.error("LINE PUSH FAILED (ignored):", lineError);
                    }

                }

                if (userIdTrimmed) {
                    try {
                        await sendLineMessage(
                            userIdTrimmed,
                            `🚫 แอดมินยกเลิกการจองของคุณแล้ว\n${thaiStatus}`
                        );
                    } catch (lineError) {
                        console.error("LINE PUSH FAILED (ignored):", lineError);
                    }

                }
            } else {
                const userIdTrimmed = (userLineId ?? "").trim();
                if (userIdTrimmed) {
                    try {
                        await sendLineMessage(
                            userIdTrimmed,
                            `🚑 สถานะการจองของคุณถูกอัปเดต\n${thaiStatus}`
                        );
                    } catch (err) {
                        console.error("LINE PUSH FAILED (ignored):", err);
                    }

                }
            }
        } catch (lineError) {
            console.error("LINE PUSH FAILED (ignored):", lineError);
        }

        return NextResponse.json(
            { message: "อัปเดตสถานะสำเร็จ", booking: updated.rows[0] },
            { status: 200 }
        );
    } catch (error) {
        try {
            await pool.query("ROLLBACK");
        } catch {
            // ignore
        }
        console.error("ADMIN UPDATE BOOKING STATUS ERROR:", error);
        return NextResponse.json({ message: "ไม่สามารถอัปเดตสถานะได้" }, { status: 500 });
    }
}
