import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { sendLineMessage } from "@/lib/line";
import { pusher } from "@/lib/pusher";

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const client = await pool.connect();

    try {
        const { id } = await params;
        const booking_id = id;
        const user_id = req.headers.get("x-user-id");

        if (!user_id) {
            return NextResponse.json(
                { message: "unauthorized" },
                { status: 401 }
            );
        }

        // BEGIN
        await client.query("BEGIN");

        // 🔒 lock bookings
        const bookingRes = await client.query(
            `
  SELECT status, driver_id
  FROM bookings
  WHERE booking_id = $1
    AND user_id = $2
  FOR UPDATE
  `,
            [booking_id, user_id]
        );

        if (bookingRes.rowCount === 0) {
            await client.query("ROLLBACK");
            return NextResponse.json({ message: "ไม่พบงาน" }, { status: 404 });
        }

        const { status, driver_id } = bookingRes.rows[0];

        // status check
        if (status === "cancelled") {
            await client.query("ROLLBACK");
            return NextResponse.json({ message: "งานถูกยกเลิกไปแล้ว" }, { status: 400 });
        }

        const FORBIDDEN_CANCEL_STATUSES = [
            "pending_payment",
            "paymented",
            "success"
        ];

        if (FORBIDDEN_CANCEL_STATUSES.includes(status)) {
            await client.query("ROLLBACK");
            return NextResponse.json(
                { message: "ไม่สามารถยกเลิกงานในขั้นตอนนี้ได้" },
                { status: 400 }
            );
        }

        // update booking
        await client.query(
            `UPDATE bookings SET status = 'cancelled' WHERE booking_id = $1`,
            [booking_id]
        );

        // log
        await client.query(
            `
  INSERT INTO logs (booking_id, event_type, event_action, message, actor_id, actor_type)
  VALUES ($1, 'BOOKING', 'USER_CANCELLED', 'ผู้ใช้ยกเลิกงาน', $2, 'user')
  `,
            [booking_id, user_id]
        );

        // COMMIT
        await client.query("COMMIT");

        const findDriverID = await pool.query(
            `SELECT driver_id FROM bookings WHERE booking_id = $1`,
            [booking_id]
        );

        if (findDriverID.rows.length > 0) {
            const driverId = findDriverID.rows[0].driver_id;
            await pusher.trigger(
                `private-driver-${driverId}`,
                "booking-updated",
                {
                    booking_id,
                    status: "cancelled",
                    type: "USER_CANCEL_BOOKING"
                }
            );
        }

        // Realtime for admin
        try {
            await pusher.trigger("private-admin", "booking-updated", {
                booking_id,
                status: "cancelled",
                type: "USER_CANCEL_BOOKING",
                user_id,
            });
        } catch (e) {
            console.error("PUSHER TRIGGER ERROR (ignored):", e);
        }

        // หลัง commit ค่อยไปดึง line driver
        let driverLineId = null;
        if (driver_id) {
            const driverRes = await pool.query(
                `SELECT line_id FROM drivers WHERE driver_id = $1`,
                [driver_id]
            );
            driverLineId = driverRes.rows[0]?.line_id;
        }


        // 5. แจ้ง LINE หา driver (ถ้ามี)
        if (driver_id && driverLineId) {
            const msg =
                `❌ งานถูกยกเลิกโดยผู้ป่วย\n\n` +
                `เลขที่การจอง: ${booking_id}\n`;
            try {
                await sendLineMessage(driverLineId, msg);
            } catch (err) {
                console.error("LINE SEND ERROR:", err);
            }
        }

        return NextResponse.json(
            { message: "ยกเลิกงานเรียบร้อยแล้ว" },
            { status: 200 }
        );

    } catch (error) {
        await client.query("ROLLBACK");
        console.error("USER CANCEL ERROR:", error);
        return NextResponse.json(
            { message: "ไม่สามารถยกเลิกงานได้" },
            { status: 500 }
        );
    } finally {
        client.release();
    }
}
