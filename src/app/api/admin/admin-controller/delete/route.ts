// api/admin/admin-controller/delete/route.ts
import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function DELETE(request: Request) {
    const adminId = request.headers.get("x-admin-id");

    if (!adminId) {
        return NextResponse.json(
            { message: "ไม่ได้รับสิทธิ์ (ไม่พบ admin id)" },
            { status: 401 }
        );
    }
    
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get("id");
        const role = searchParams.get("role"); // เพื่อแยกแยะว่าลบ driver หรือ user
        const idNum = Number(userId);

        if (!userId || isNaN(idNum)) {
            return NextResponse.json(
                { message: "ID ไม่ถูกต้อง" },
                { status: 400 }
            );
        }

        if (role === "driver") {
            await pool.query("DELETE FROM drivers WHERE driver_id = $1", [idNum]);
        } else {
            await pool.query("DELETE FROM users WHERE user_id = $1", [idNum]);
        }

        return NextResponse.json({ message: "ลบข้อมูลสำเร็จ" }, { status: 200 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ message: "เกิดข้อผิดพลาดในการลบ" }, { status: 500 });
    }
}