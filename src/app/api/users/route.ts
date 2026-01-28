// src/app/api/me/route.ts
import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(request: Request) {
    try {
        const role = request.headers.get("x-role");
        const user_id = request.headers.get("x-user-id");
        const driver_id = request.headers.get("x-driver-id");

        // กรณีเป็น Driver
        if (role === "driver" && driver_id) {
            const result = await pool.query("SELECT * FROM drivers WHERE driver_id = $1", [driver_id]);
            if (result.rows.length === 0) return NextResponse.json({ message: "ไม่พบบัญชีคนขับ" }, { status: 404 });

            return NextResponse.json({ user: result.rows[0] }, { status: 200 });
        }

        // กรณีเป็น User ทั่วไป
        if (role === "user" && user_id) {
            const result = await pool.query("SELECT * FROM users WHERE user_id = $1", [user_id]);
            if (result.rows.length === 0) return NextResponse.json({ message: "" }, { status: 404 });

            return NextResponse.json({ user: result.rows[0] }, { status: 200 });
        }

        return NextResponse.json({ message: "Unauthorized or Invalid Role" }, { status: 401 });

    } catch (err) {
        console.error(err);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}