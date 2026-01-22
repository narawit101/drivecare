import { NextResponse, NextRequest } from "next/server";
import pool from "@/lib/db";

export async function GET(request: NextRequest) {
    const adminId = request.headers.get("x-admin-id");

    if (!adminId) {
        return NextResponse.json(
            { message: "ไม่ได้รับสิทธิ์" },
            { status: 401 }
        );
    }

    try {
        const sort = (request.nextUrl.searchParams.get("sort") ?? "").trim();
        const orderBy =
            sort === "created_desc"
                ? "b.create_at DESC NULLS LAST, b.booking_id DESC"
                : "b.booking_date ASC NULLS LAST, b.start_time ASC NULLS LAST, b.create_at ASC NULLS LAST";

        const result = await pool.query(
            `
      SELECT 
        b.booking_id,
        b.booking_date,
        b.start_time,
        b.status,
        b.create_at,
        b.payment_status,
        b.total_price,

        u.user_id,
        u.first_name AS user_first_name,
        u.last_name AS user_last_name,
        u.phone_number  AS user_phone_number,
        u.profile_img AS user_profile_img,
        d.driver_id,
        d.first_name AS driver_first_name,
        d.last_name AS driver_last_name,
        d.phone_number AS driver_phone_number,
        d.profile_img AS driver_profile_img,

        l.pickup_address,
        l.pickup_lat,
        l.pickup_lng,
        l.dropoff_address,
        l.dropoff_lat,
        l.dropoff_lng

      FROM bookings b
      JOIN users u ON b.user_id = u.user_id
      LEFT JOIN drivers d ON b.driver_id = d.driver_id
      LEFT JOIN locations l ON b.booking_id = l.booking_id
            ORDER BY ${orderBy}
    `
        );

        return NextResponse.json(
            { count: result.rows.length, booking: result.rows },
            { status: 200 }
        );
    } catch (error) {
        console.log(error);
        return NextResponse.json(
            { message: "ไม่สามารถดึง booking ได้" },
            { status: 500 }
        );
    }
}
