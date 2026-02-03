import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { sendLineMessage } from "@/lib/line";
import { sendDriverCancelledFlexMessage } from "@/services/sent-line-user/driver-cancelled";
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
            return NextResponse.json({ message: "ไม่พบข้อมูลคนขับ" }, { status: 401 });
        }

        // 1. ดึงข้อมูลงานและข้อมูล LINE ID ของลูกค้า
        const bookingRes = await pool.query(
            `SELECT 
               b.status, 
               u.line_id, 
               b.booking_id,
               b.start_time AT TIME ZONE 'Asia/Bangkok' AS start_time
             FROM bookings b
             JOIN users u ON b.user_id = u.user_id
             WHERE b.booking_id = $1 AND b.driver_id = $2`,
            [booking_id, driver_id]
        );

        if (bookingRes.rowCount === 0) {
            return NextResponse.json(
                { message: "ไม่พบงาน หรือคุณไม่มีสิทธิ์ยกเลิกงานนี้" },
                { status: 404 }
            );
        }

        const { status: currentStatus, line_id } = bookingRes.rows[0];

        const now = new Date();
        const bookingStartTime = bookingRes.rows[0].start_time
            ? new Date(bookingRes.rows[0].start_time)
            : null;

        const checkTimeLimit = () => {
            if (!bookingStartTime) return false;
            console.log("starttime", bookingStartTime);
            console.log("now", now);
            const timeDiff = bookingStartTime.getTime() - now.getTime();
            const hoursDiff = timeDiff / (1000 * 60 * 60);
            return hoursDiff < 6; // ตรวจสอบถ้าเหลือเวลาไม่เกิน 6 ชั่วโมง       }
        }
        if (checkTimeLimit()) {
            return NextResponse.json(
                { message: "ไม่สามารถยกเลิกงานได้เนื่องจากเหลือเวลาน้อยกว่า 6 ชั่วโมงก่อนถึงเวลานัด ถ้าต้องการยกเลิกงาน กรุณากดปุ่มรายงานปัญหา และเลือก 'ยกเลิกงาน'" },
                { status: 400 }
            );
        } else {
            console.log("สามารถยกเลิกงานได้เนื่องจากเหลือเวลาเกิน 6 ชั่วโมงก่อนถึงเวลานัด");
            if (currentStatus === "cancelled") {
                return NextResponse.json(
                    { message: "งานนี้ถูกยกเลิกไปแล้ว" },
                    { status: 400 }
                );
            }

            // ❌ ถ้างานเสร็จแล้ว
            if (currentStatus === "success") {
                return NextResponse.json(
                    { message: "ไม่สามารถยกเลิกงานที่เสร็จแล้วได้" },
                    { status: 400 }
                );
            }

            // ✅ สถานะที่อนุญาตให้ยกเลิก
            const allowedStatuses = ["accepted", "going_pickup"];

            if (!allowedStatuses.includes(currentStatus)) {
                return NextResponse.json(
                    { message: "ไม่สามารถยกเลิกงานในสถานะปัจจุบันได้" },
                    { status: 400 }
                );
            }

            // 3. เริ่มขั้นตอน Database Update
            const client = await pool.connect();
            try {
                await client.query("BEGIN");

                // คืนงานกลับเข้าระบบ
                await client.query(
                    `UPDATE bookings
                 SET driver_id = NULL, status = 'pending'
                 WHERE booking_id = $1`,
                    [booking_id]
                );

                // บันทึก Log
                await client.query(
                    `INSERT INTO logs (booking_id, event_type, event_action, message, actor_id, actor_type)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                    [booking_id, "BOOKING", "DRIVER_CANCELLED", `คนขับคืนงานเข้าระบบ (สถานะเดิม: ${currentStatus})`, driver_id, "driver"]
                );

                await client.query("COMMIT");

                // Realtime (best-effort): คืนงานเข้าระบบ -> ถือว่าเป็นงานใหม่สำหรับคนขับทุกคน
                // และแจ้ง admin เพื่อให้ refresh หน้า job-assignment
                try {
                    // IMPORTANT: ต้องส่ง payload เต็มให้ driver ทุกคน เพื่อให้หน้า dashboard อัปเดตโดยไม่ต้อง refetch
                    // ใช้ LEFT JOIN locations เผื่อข้อมูลเก่าบางรายการไม่มี locations แล้วจะไม่หลุด event
                    const bookingRowRes = await pool.query(
                        `
          SELECT 
            b.booking_id,
            b.booking_date,
            b.start_time,
            b.status,
            b.create_at,

            u.user_id,
            u.name,
            u.first_name,
            u.last_name,
            u.phone_number,
            u.profile_img,

            l.pickup_address,
            l.pickup_lat,
            l.pickup_lng,
            l.dropoff_address,
            l.dropoff_lat,
            l.dropoff_lng

          FROM bookings b
          JOIN users u ON b.user_id = u.user_id
          LEFT JOIN locations l ON b.booking_id = l.booking_id
          WHERE b.booking_id = $1
          LIMIT 1
          `,
                        [booking_id]
                    );

                    const booking = bookingRowRes.rows[0];

                    if (booking) {
                        await pusher.trigger("private-driver", "booking.returned", { booking });
                        await pusher.trigger("private-admin", "booking.returned", {
                            booking_id: booking.booking_id,
                            booking,
                            type: "DRIVER_RETURN",
                        });
                    } else {
                        // Fallback: แจ้งอย่างน้อยให้ admin เห็นว่ามีการคืนงาน (อาจต้องตรวจสอบข้อมูลใน DB)
                        await pusher.trigger("private-admin", "booking.returned", {
                            booking_id: Number(booking_id),
                            type: "DRIVER_RETURN",
                        });
                    }
                } catch (pusherError) {
                    console.error("PUSHER TRIGGER ERROR (ignored):", pusherError);
                }

                // 4. ส่ง LINE แจ้งเตือนลูกค้า (ทำหลังจากที่ DB มั่นใจว่า Update สำเร็จ)
                if (line_id) {
                    try {
                        await sendDriverCancelledFlexMessage(line_id, parseInt(booking_id));
                    } catch (lineError) {
                        console.error("LINE FLEX SEND ERROR:", lineError);
                        // Fallback to text message if flex fails
                        try {
                            const fallbackLineMessage =
                                `⚠️ แจ้งเตือนการเดินทาง (เลขที่การจอง: ${booking_id})\n\n` +
                                `ขออภัยในความไม่สะดวก เนื่องจากคนขับมีความจำเป็นต้องยกเลิกงานในครั้งนี้\n\n` +
                                `ขณะนี้ระบบกำลังนำงานของคุณกลับเข้าสู่ระบบเพื่อจัดหาคนขับท่านใหม่ให้โดยด่วนที่สุด\n` +
                                `คุณสามารถตรวจสอบสถานะได้ผ่านแอปพลิเคชันครับ 🙏`;
                            await sendLineMessage(line_id, fallbackLineMessage);
                        } catch (fallbackError) {
                            console.error("LINE FALLBACK SEND ERROR:", fallbackError);
                        }
                    }
                }

            } catch (dbError) {
                await client.query("ROLLBACK");
                throw dbError;
            } finally {
                client.release();
            }

            return NextResponse.json({ message: "ยกเลิกงานและส่งการแจ้งเตือนเรียบร้อย" }, { status: 200 });
        }


    } catch (error) {
        console.error("CANCEL TASK ERROR:", error);
        return NextResponse.json({ message: "ไม่สามารถดำเนินการได้ในขณะนี้" }, { status: 500 });
    }
}