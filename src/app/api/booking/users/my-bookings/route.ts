import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const user_id = request.headers.get("x-user-id");
    if (!user_id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const result = await pool.query(
      `SELECT 
        b.booking_id,
        b.booking_date,
        b.start_time,
        b.end_time,
        b.total_hours,
        b.total_price,
        b.status,
        b.driver_id,
        b.payment_status,

        l.pickup_address,
        l.pickup_lat,
        l.pickup_lng,
        l.dropoff_address,
        l.dropoff_lat,
        l.dropoff_lng,

        d.first_name as driver_first_name,
        d.last_name as driver_last_name,
        d.phone_number as driver_phone,
        d.profile_img as driver_profile_image,

        hr.weight,
        hr.height,
        hr.bmi,
        hr.congenital_diseases,
        hr.allergies

      FROM bookings b
      LEFT JOIN locations l ON b.booking_id = l.booking_id
      LEFT JOIN drivers d ON b.driver_id = d.driver_id
      LEFT JOIN health_records hr ON b.user_id = hr.user_id
      WHERE b.user_id = $1
      ORDER BY b.create_at DESC`,
      [user_id]
    );
    return NextResponse.json({ bookings: result.rows }, { status: 201 });
  } catch (error) {
    console.log(error)
    return NextResponse.json(
      { message: "ไม่สามารถดูข้อมูลได้" },
      { status: 500 }
    );
  }
}
