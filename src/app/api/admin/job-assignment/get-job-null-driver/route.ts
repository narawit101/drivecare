import { NextResponse, NextRequest } from "next/server";
import pool from "@/lib/db";
import { cacheGet } from "@/lib/cache";
import { CacheKeys, TTL } from "@/lib/cache-keys";

export async function GET(request: NextRequest) {
    const adminId = request.headers.get("x-admin-id");

    if (!adminId) {
        return NextResponse.json(
            { message: "ไม่ได้รับสิทธิ์" },
            { status: 401 }
        );
    }

    try {
        const sort = request.nextUrl.searchParams.get("sort");
        const orderBy =
            sort === "created_desc"
                ? "b.create_at DESC NULLS LAST, b.booking_id DESC"
                : "b.booking_date ASC NULLS LAST, b.start_time ASC NULLS LAST, b.create_at ASC NULLS LAST";

        const bookings = await cacheGet(
            CacheKeys.adminJobAssignment(sort || undefined),
            TTL.ADMIN_JOB_ASSIGNMENT,
            async () => {
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
                return result.rows;
            }
        );

        if (bookings.length === 0) {
            return NextResponse.json(
                { message: "ไม่พบการจอง" },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { count: bookings.length, booking: bookings },
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

