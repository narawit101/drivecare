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
            SELECT driver_id , first_name, last_name, phone_number, 
            verified, status, profile_img,city
            FROM drivers 
            WHERE verified = 'approved'
            ORDER BY create_at DESC
        `);

        if (result.rows.length === 0) {
            return NextResponse.json(
                { message: "ไม่พบคนขับที่ใช้งานอยู่" },
                { status: 404 }
            );
        }

        return NextResponse.json({ users: result.rows }, { status: 200 });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}