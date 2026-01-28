import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const booking_id = id;
    const driver_id = req.headers.get("x-driver-id");

    if (!driver_id) {
        return NextResponse.json({ message: "unauthorized" }, { status: 401 });
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

    try {
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

        // 1️⃣ ห้ามมีงานกำลังทำอยู่
        const inProgress = await pool.query(
            `
    SELECT booking_id
FROM bookings
WHERE driver_id = $1
  AND status = ANY($2)
FOR UPDATE
      `,
            [driver_id, ACTIVE_STATUSES]
        );

        if (inProgress.rows.length > 0) {
            await pool.query("ROLLBACK");
            return NextResponse.json(
                { message: "คุณมีงานที่กำลังดำเนินการอยู่แล้ว" },
                { status: 400 }
            );
        }

        // 2️⃣ หา “งานที่ถึงคิวจริง”
        const nextJob = await pool.query(
            `
      SELECT booking_id
      FROM bookings
      WHERE driver_id = $1
        AND status = 'accepted'
      ORDER BY booking_date ASC, start_time ASC
      LIMIT 1
      FOR UPDATE
      `,
            [driver_id]
        );

        if (nextJob.rowCount === 0) {
            await pool.query("ROLLBACK");
            return NextResponse.json(
                { message: "ไม่พบงานที่สามารถเริ่มได้" },
                { status: 400 }
            );
        }

        if (nextJob.rows[0].booking_id != booking_id) {
            await pool.query("ROLLBACK");
            return NextResponse.json(
                { message: "ต้องเริ่มงานตามลำดับเวลา" },
                { status: 400 }
            );
        }


        // 3️⃣ เริ่มงาน
        await pool.query(
            `
      UPDATE bookings
      SET status = 'in_progress'
      WHERE booking_id = $1
      `,
            [booking_id]
        );

        await pool.query("COMMIT");

        return NextResponse.json({ message: "งานของคุณเข้าสู่ขั้นตอนกำลังดำเนินงาน" });

    } catch (err) {
        await pool.query("ROLLBACK");
        return NextResponse.json(
            { message: "เกิดข้อผิดพลาด" },
            { status: 500 }
        );
    }
}

