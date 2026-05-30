// src/app/api/me/route.ts
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { cacheGet } from "@/lib/cache";
import { CacheKeys, TTL } from "@/lib/cache-keys";

export async function GET(request: Request) {
    try {
        const role = request.headers.get("x-role");
        const user_id = request.headers.get("x-user-id");
        const driver_id = request.headers.get("x-driver-id");

        // กรณีเป็น Driver
        if (role === "driver" && driver_id) {
            const driver = await cacheGet(
                CacheKeys.driverProfile(driver_id),
                TTL.DRIVER_PROFILE,
                async () => {
                    const result = await pool.query("SELECT * FROM drivers WHERE driver_id = $1", [driver_id]);
                    return result.rows[0] || null;
                }
            );

            if (!driver) return NextResponse.json({ message: "ไม่พบบัญชีคนขับ" }, { status: 404 });

            return NextResponse.json({ user: driver }, { status: 200 });
        }

        // กรณีเป็น User ทั่วไป
        if (role === "user" && user_id) {
            const user = await cacheGet(
                CacheKeys.userProfile(user_id),
                TTL.USER_PROFILE,
                async () => {
                    const result = await pool.query("SELECT * FROM users WHERE user_id = $1", [user_id]);
                    return result.rows[0] || null;
                }
            );

            if (!user) return NextResponse.json({ message: "" }, { status: 404 });

            return NextResponse.json({ user: user }, { status: 200 });
        }

        return NextResponse.json({ message: "Unauthorized or Invalid Role" }, { status: 401 });

    } catch (err) {
        console.error(err);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}