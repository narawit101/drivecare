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
      WITH reporter_data AS (
        SELECT 
          r.report_id,
          r.booking_id,
          r.actor_type,
          r.actor_id,
          CASE 
            WHEN r.actor_type = 'user' THEN 
              (u.first_name || ' ' || u.last_name)
            WHEN r.actor_type = 'driver' THEN 
              (d.first_name || ' ' || d.last_name)
            ELSE 'ไม่ระบุชื่อ'
          END AS reporter_name,
          CASE 
            WHEN r.actor_type = 'user' THEN u.phone_number
            WHEN r.actor_type = 'driver' THEN d.phone_number
            ELSE '-'
          END AS reporter_phone
        FROM reports r
        LEFT JOIN users u ON r.actor_type = 'user' AND r.actor_id = u.user_id
        LEFT JOIN drivers d ON r.actor_type = 'driver' AND r.actor_id = d.driver_id
      )
      
      SELECT
        b.booking_id,
        b.booking_date,
        b.start_time,

        bu.user_id,
        bu.first_name || ' ' || bu.last_name AS user_name,
        bu.phone_number AS user_phone,

        bd.driver_id,
        bd.first_name || ' ' || bd.last_name AS driver_name,
        bd.phone_number AS driver_phone,

        json_agg(
          json_build_object(
            'report_id', r.report_id,
            'actor_type', r.actor_type,
            'actor_id', r.actor_id,
            'report_type', r.report_type,
            'message', r.message,
            'is_replied', r.is_replied,
            'create_at', r.create_at,
            'reporter_name', rd.reporter_name,
            'reporter_phone', rd.reporter_phone
          )
          ORDER BY r.create_at ASC
        ) AS reports

      FROM reports r
      JOIN bookings b ON r.booking_id = b.booking_id
      JOIN users bu ON b.user_id = bu.user_id
      LEFT JOIN drivers bd ON b.driver_id = bd.driver_id
      LEFT JOIN reporter_data rd ON r.report_id = rd.report_id

      GROUP BY
        b.booking_id,
        b.booking_date,
        b.start_time,
        bu.user_id,
        bu.first_name,
        bu.last_name,
        bu.phone_number,
        bd.driver_id,
        bd.first_name,
        bd.last_name,
        bd.phone_number
      ORDER BY MAX(r.create_at) DESC
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
