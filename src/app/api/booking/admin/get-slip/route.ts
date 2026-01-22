import { NextResponse, NextRequest } from "next/server";
import pool from "@/lib/db";

export async function GET(request: NextRequest) {
    const adminId = request.headers.get("x-admin-id");

    if (!adminId) {
        return NextResponse.json(
            { message: "ไม่ได้รับสิทธิ์ (ไม่พบ admin id)" },
            { status: 401 }
        );
    }
    try {
        const result = await pool.query(`
      SELECT 
        b.booking_id,
        b.booking_date,
        b.start_time,
        b.status,
        b.payment_at,
        b.payment_slip,
        b.payment_status,
        b.total_price,

        u.user_id,
        u.first_name AS user_first_name,
        u.last_name AS user_last_name,
        u.phone_number AS user_phone_number,

        d.driver_id,
        d.first_name AS driver_first_name,
        d.last_name AS driver_last_name,
        d.phone_number AS driver_phone_number,
        d.car_plate,
        d.car_brand,
        d.car_model,

        l.pickup_address,
        l.dropoff_address

      FROM bookings b
      JOIN users u ON b.user_id = u.user_id
      LEFT JOIN drivers d ON b.driver_id = d.driver_id
      LEFT JOIN locations l ON b.booking_id = l.booking_id

      WHERE b.status IN ('paymented', 'success')
      AND b.payment_status IN ('waiting_verify', 'verified','rejected')

      ORDER BY b.payment_at DESC
    `);

        return NextResponse.json(
            {
                count: result.rows.length,
                bookings: result.rows,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("GET VERIFY SLIP ERROR:", error);
        return NextResponse.json(
            { message: "ไม่สามารถดึงข้อมูลตรวจสอบสลิปได้" },
            { status: 500 }
        );
    }
}
