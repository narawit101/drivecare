import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { pusher } from "@/lib/pusher";
import { sendLineMessage } from "@/lib/line";

import { parseDbDateTimeTH } from "@/utils/db-datetime";

export async function PATCH(request: NextRequest) {
    const adminId = request.headers.get("x-admin-id");

    if (!adminId) {
        return NextResponse.json(
            { message: "ไม่ได้รับสิทธิ์ (ไม่พบ admin id)" },
            { status: 401 }
        );
    }

    try {
        const body = (await request.json()) as {
            booking_id?: number | string;
            driver_id?: number | string;
        };

        const bookingId = Number(body.booking_id);
        const driverId = Number(body.driver_id);

        if (!Number.isFinite(bookingId) || !Number.isFinite(driverId)) {
            return NextResponse.json(
                { message: "ข้อมูลไม่ถูกต้อง" },
                { status: 400 }
            );
        }

        await pool.query("BEGIN");

        const check = await pool.query(
            `SELECT booking_id, user_id
       FROM bookings
       WHERE booking_id = $1
         AND status = 'pending'
         AND driver_id IS NULL
       FOR UPDATE`,
            [bookingId]
        );

        if (check.rows.length === 0) {
            await pool.query("ROLLBACK");
            return NextResponse.json(
                { message: "งานนี้ถูกรับ/มอบหมายไปแล้ว" },
                { status: 400 }
            );
        }

        const userId = check.rows[0]?.user_id as number | null | undefined;

        const checkActiveDriver = await pool.query(
            `SELECT status
       FROM drivers
       WHERE driver_id = $1
         `,
            [driverId]
        );
        const activeDriverRow = checkActiveDriver.rows[0].status;
        if (activeDriverRow !== "active") {
            await pool.query("ROLLBACK");
            return NextResponse.json(
                { message: "ไม่สามารถมอบหมายงานให้คนขับที่ไม่ออนไลน์ได้" },
                { status: 400 }
            );
        }



        const update = await pool.query(
            `UPDATE bookings
       SET driver_id = $1,
            status = 'accepted'
       WHERE booking_id = $2
       RETURNING booking_id, driver_id, status`,
            [driverId, bookingId]
        );

        await pool.query(
            `INSERT INTO logs(
                booking_id, event_type, event_action, message, actor_id, actor_type
            ) VALUES($1, $2, $3, $4, $5, $6)`,
            [
                bookingId,
                "ASSIGNED",
                "Admin_Assign_Driver",
                "admin มอบหมายงานให้คนขับ",
                adminId,
                "admin",
            ]
        );

        await pool.query("COMMIT");

        // ⚡ Invalidate related caches
        try {
            const { invalidateBooking } = await import("@/lib/cache");
            await invalidateBooking(bookingId, userId, driverId);
        } catch (err) {
            console.error("Cache Invalidation Error:", err);
        }

        await pusher.trigger("private-driver", "booking.assigned", {
            booking_id: bookingId,
            driver_id: driverId,
            type: "ADMIN_ASSIGN",
        });

        // แจ้ง admin ทุกคนด้วย (realtime)
        await pusher.trigger("private-admin", "booking.assigned", {
            booking_id: bookingId,
            driver_id: driverId,
            type: "ADMIN_ASSIGN",
        });

        // แจ้งผู้ป่วยด้วย (realtime)
        if (userId) {
            await pusher.trigger(`private-user-${userId}`, "booking-updated", {
                booking_id: bookingId,
                status: "accepted",
                driver_id: driverId,
                type: "ADMIN_ASSIGN",
            });
        }

        // LINE notify (best-effort): ส่งให้ทั้งคนขับ + ลูกค้า
        // ไม่ควรทำให้ API ล้มเหลว ถ้าส่ง LINE ไม่ผ่าน
        try {
            const info = await pool.query(
                `
        SELECT
          b.booking_id,
            b.booking_date,
            b.start_time,
            u.line_id AS user_line_id,
            u.first_name AS user_first_name,
            u.last_name AS user_last_name,
            u.phone_number AS user_phone,
            d.line_id AS driver_line_id,
            d.first_name AS driver_first_name,
            d.last_name AS driver_last_name,
            d.phone_number AS driver_phone,
            d.car_brand,
            d.car_model,
            d.car_plate,
            l.pickup_address,
            l.dropoff_address
        FROM bookings b
        JOIN users u ON b.user_id = u.user_id
        JOIN drivers d ON b.driver_id = d.driver_id
        LEFT JOIN locations l ON b.booking_id = l.booking_id
        WHERE b.booking_id = $1
            `,
                [bookingId]
            );

            const row = info.rows[0] as
                | {
                    booking_id: number;
                    booking_date?: Date | string | null;
                    start_time?: Date | string | null;
                    user_line_id?: string | null;
                    user_first_name?: string | null;
                    user_last_name?: string | null;
                    user_phone?: string | null;
                    driver_line_id?: string | null;
                    driver_first_name?: string | null;
                    driver_last_name?: string | null;
                    driver_phone?: string | null;
                    car_brand?: string | null;
                    car_model?: string | null;
                    car_plate?: string | null;
                    pickup_address?: string | null;
                    dropoff_address?: string | null;
                }
                | undefined;

            if (row) {
                const bookingDate = parseDbDateTimeTH(row.booking_date);
                const startTime = parseDbDateTimeTH(row.start_time);

                const dateLabel = bookingDate ? bookingDate.toFormat("dd/LL/yyyy") : "-";
                const timeLabel = startTime ? startTime.toFormat("HH:mm") : "-";

                const pickup = row.pickup_address ?? "-";
                const dropoff = row.dropoff_address ?? "-";

                const userName = `${row.user_first_name ?? ""} ${row.user_last_name ?? ""}`.trim() || "ผู้ป่วย";
                const driverName = `${row.driver_first_name ?? ""} ${row.driver_last_name ?? ""}`.trim() || "คนขับ";

                const driverMsg = `🚗 คุณได้รับมอบหมายงานใหม่\n🆔 Booking: #${row.booking_id}\n📅 วันที่: ${dateLabel} เวลา: ${timeLabel}\n📍 จุดรับ: ${pickup}\n🏁 จุดส่ง: ${dropoff}\n👤 ผู้ป่วย: ${userName}${row.user_phone ? ` (${row.user_phone})` : ""}`;

                const userMsg = `🚗 มีคนขับถูกมอบหมายให้กับงานของคุณแล้ว\n👤 คนขับ: ${driverName}\n📞 เบอร์โทร: ${row.driver_phone ?? "-"}\n🚘 รถ: ${(row.car_brand ?? "-")}-${(row.car_model ?? "-")} (${row.car_plate ?? "-"}) \n📅 วันที่: ${dateLabel} เวลา: ${timeLabel} \nขอให้เดินทางโดยสวัสดิภาพ 🙏`;

                const userLineId = (row.user_line_id ?? "").trim();
                const driverLineId = (row.driver_line_id ?? "").trim();

                if (driverLineId) {
                    try {
                        await sendLineMessage(driverLineId, driverMsg);
                    } catch (lineError) {
                        console.error("LINE push to driver failed (ignored):", lineError);
                    }
                }

                if (userLineId) {
                    try {
                        await sendLineMessage(userLineId, userMsg);
                    } catch (lineError) {
                        console.error("LINE push to user failed (ignored):", lineError);
                    }
                }
            }
        } catch (notifyError) {
            console.error("LINE notify lookup failed (ignored):", notifyError);
        }

        return NextResponse.json(
            { message: "มอบหมายงานสำเร็จ", booking: update.rows[0] },
            { status: 200 }
        );
    } catch (error) {
        console.error("ASSIGN DRIVER ERROR:", error);
        try {
            await pool.query("ROLLBACK");
        } catch {
            // ignore
        }
        return NextResponse.json(
            { message: "ไม่สามารถมอบหมายงานได้" },
            { status: 500 }
        );
    }
}
