// api/admin-controller/fetch-driver/route.ts
import { NextResponse, NextRequest } from "next/server";
import pool from "@/lib/db";
import { cacheGet } from "@/lib/cache";
import { CacheKeys, TTL } from "@/lib/cache-keys";

export async function GET(request: NextRequest) {
    const adminId = request.headers.get("x-admin-id");

    if (!adminId) {
        return NextResponse.json(
            { message: "ไม่ได้รับสิทธิ์ (ไม่พบ admin id)" },
            { status: 401 }
        );
    }
    try {
        // ดึงเฉพาะข้อมูลที่จำเป็น ด้วย Cache
        const drivers = await cacheGet(
            CacheKeys.allDrivers(),
            TTL.ALL_DRIVERS,
            async () => {
                const result = await pool.query(`
                    SELECT driver_id , first_name, last_name, phone_number, 
                    verified, status, profile_img,city
                    FROM drivers 
                    WHERE verified = 'approved'
                    ORDER BY create_at DESC
                `);
                return result.rows;
            }
        );

        if (drivers.length === 0) {
            return NextResponse.json(
                { message: "ไม่พบคนขับที่ใช้งานอยู่" },
                { status: 404 }
            );
        }

        return NextResponse.json({ users: drivers }, { status: 200 });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}