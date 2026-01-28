import { NextResponse, NextRequest } from "next/server";
import pool from "@/lib/db";

export async function GET(request: NextRequest) {
  const adminId = request.headers.get("x-admin-id");

  if (!adminId) {
    return NextResponse.json(
      { message: "unauthorized" },
      { status: 401 }
    );
  }

  try {
    const result = await pool.query(`
      SELECT
        b.booking_id,
        b.booking_date,
        b.start_time,

        u.user_id,
        u.first_name || ' ' || u.last_name AS user_name,
        u.phone_number AS user_phone,

        d.driver_id,
        d.first_name || ' ' || d.last_name AS driver_name,
        d.phone_number AS driver_phone,

        json_agg(
          json_build_object(
            'report_id', r.report_id,
            'actor_type', r.actor_type,
            'report_type', r.report_type,
            'message', r.message,
            'is_replied', r.is_replied,
            'create_at', r.create_at
          )
          ORDER BY r.create_at ASC
        ) AS reports

      FROM reports r
      JOIN bookings b ON r.booking_id = b.booking_id
      JOIN users u ON b.user_id = u.user_id
      JOIN drivers d ON b.driver_id = d.driver_id

      GROUP BY
        r.create_at,
        b.booking_id,
        b.booking_date,
        b.start_time,
        u.user_id,
        d.driver_id
      ORDER BY r.create_at  DESC
    `);

    return NextResponse.json({
      count: result.rows.length,
      data: result.rows,
    });

  } catch (error) {
    console.error("ADMIN FETCH REPORTS ERROR:", error);
    return NextResponse.json(
      { message: "ไม่สามารถดึงรายงานได้" },
      { status: 500 }
    );
  }
}
