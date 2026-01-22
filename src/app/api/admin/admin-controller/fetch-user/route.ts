// api/admin-controller/fetch-driver/route.ts
import { NextResponse, NextRequest } from "next/server";
import pool from "@/lib/db";

export async function GET(request: NextRequest) {
    const adminId = request.headers.get("x-admin-id");

    if (!adminId) {
        return NextResponse.json(
            { message: "ไม่ได้รับสิทธิ์ (ไม่พบ admin id)" },
            { status: 401 }
        );
    }


    try {
        // ดึงเฉพาะข้อมูลที่จำเป็น
        const result = await pool.query(`
            SELECT user_id , first_name, last_name, phone_number, address,
            profile_img, create_at 
            FROM users 
            ORDER BY create_at DESC
        `);

        return NextResponse.json({ users: result.rows }, { status: 200 });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}