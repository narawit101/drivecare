import pool from "@/lib/db";
import { NextResponse, NextRequest } from "next/server";

export async function PUT(request: NextRequest) {
    try {
        const user_id = request.headers.get("x-user-id");
        if (!user_id) return NextResponse.json({ message: "ไม่พบ user ID" }, { status: 401 });

        const body = await request.json();
        const {
            first_name, last_name, phone_number,
            address
        } = body;

        // อัปเดตทุกฟีลด์ในตาราง drivers ที่เดียวจบ
        const result = await pool.query(
            `UPDATE users SET 
                first_name = $1, 
                last_name = $2, 
                phone_number = $3, 
                address = $4
             WHERE user_id = $5
             RETURNING *`,
            [first_name, last_name, phone_number, address, user_id]
        );

        if (result.rowCount === 0) {
            return NextResponse.json({ message: "ไม่พบข้อมูลผู้ใช้" }, { status: 404 });
        }

        return NextResponse.json({ message: "อัปเดตข้อมูลสำเร็จ", data: result.rows[0] });

    } catch (error) {
        console.error("Update Error:", error);
        return NextResponse.json({ message: "เกิดข้อผิดพลาดภายในระบบ" }, { status: 500 });
    }
}