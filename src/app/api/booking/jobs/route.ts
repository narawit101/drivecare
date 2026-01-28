import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import pool from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const sort = request.nextUrl.searchParams.get("sort");
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
      JOIN locations l ON b.booking_id = l.booking_id
      WHERE b.driver_id IS NULL
        AND b.status = 'pending'
        ORDER BY ${orderBy}
    `
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { message: "ไม่พบ booking ที่เปิดรับคนขับ" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { count: result.rows.length, booking: result.rows },
      { status: 201 }
    );
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { message: "ไม่สามารถดึง booking ได้" },
      { status: 500 }
    );
  }
}
