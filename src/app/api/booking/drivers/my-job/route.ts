import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(request: NextRequest) {
    try {
        // 🔐 ดึง driver_id (มาจาก token middleware)
        const driver_id = request.headers.get("x-driver-id");
        const rawTab = request.nextUrl.searchParams.get("tab");
        const tab = rawTab?.trim(); // ⭐ สำคัญมาก


        if (!driver_id) {
            return NextResponse.json(
                { message: "missing driver id" },
                { status: 401 }
            );
        }

        // 🧠 map tab → status
        let statuses: string[] | null = null;

        if (tab === "upcoming") {
            statuses = ["accepted",
                "in_progress",
                "going_pickup",
                "picked_up",
                "heading_to_hospital",
                "arrived_at_hospital",
                "waiting_for_return",
                "heading_home",
                "arrived_home",
                "pending_payment",
                "paymented",
                "success",
                "cancelled"
            ];
        }
        if (tab === "current") {
            statuses = [
                // 'accepted',
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
            ];
        }
        console.log("tab =", tab);
        if (!statuses) {
            return NextResponse.json(
                { message: "invalid tab" },
                { status: 400 }
            );
        }

        // 📦 query งานของ driver
        const result = await pool.query(
            `
      SELECT 
        b.booking_id,
        b.booking_date,
        b.start_time,
        b.status,
        b.create_at,
        b.payment_status,


        u.user_id,
        u.first_name,
        u.last_name,
        u.phone_number,
        u.profile_img,

        l.pickup_address,
        l.pickup_lat,
        l.pickup_lng,
        l.dropoff_address,
        l.dropoff_lat,
        l.dropoff_lng,

        hr.congenital_diseases, 
        hr.allergies


      FROM bookings b
      JOIN users u ON b.user_id = u.user_id
      LEFT JOIN locations l ON b.booking_id = l.booking_id
      LEFT JOIN health_records hr ON b.user_id = hr.user_id
      WHERE b.driver_id = $1
        AND b.status = ANY($2)
            ORDER BY b.start_time ASC
      `,
            [driver_id, statuses]
        );

        return NextResponse.json(
            {
                count: result.rows.length,
                jobs: result.rows,
            },
            { status: 200 }
        );
    } catch (err) {
        console.error("GET my-job error:", err);
        return NextResponse.json(
            { message: "โหลดงานไม่สำเร็จ" },
            { status: 500 }
        );
    }
}
