import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const user_id = req.headers.get("x-user-id");

    if (!user_id) {
      return NextResponse.json({ message: "unauthorized" }, { status: 401 });
    }

    const result = await pool.query(
      `
      SELECT 
        b.booking_id, b.booking_date, b.start_time, b.status, b.total_price, b.total_hours, b.payment_status,
        u.first_name, u.last_name,
        dr.driver_id,
        dr.first_name AS driver_first_name, 
        dr.last_name AS driver_last_name, 
        dr.phone_number AS driver_phone_number, 
        dr.profile_img AS driver_profile_img,
        dr.car_brand, dr.car_model, dr.car_plate,

        l.pickup_address, l.pickup_lat, l.pickup_lng,
        l.dropoff_address, l.dropoff_lat, l.dropoff_lng,

        hr.weight, 
        hr.height, 
        hr.bmi, 
        hr.congenital_diseases, 
        hr.allergies
      FROM bookings b
      JOIN users u ON b.user_id = u.user_id
      LEFT JOIN locations l ON b.booking_id = l.booking_id
      LEFT JOIN drivers dr ON b.driver_id = dr.driver_id
      LEFT JOIN health_records hr ON b.user_id = hr.user_id
      WHERE b.booking_id = $1 AND b.user_id = $2
      `,
      [id, user_id],
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { message: "ไม่พบข้อมูลการจอง" },
        { status: 404 },
      );
    }

    // ส่งค่ากลับเป็นออบเจกต์ job เพื่อให้ Frontend ใช้งานได้ทันที
    return NextResponse.json(
      { message: "สำเร็จ", job: result.rows[0] },
      { status: 200 },
    );
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { message: "Internal Server Error", error: String(error) },
      { status: 500 },
    );
  }
}
