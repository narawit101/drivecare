import { NextRequest, NextResponse } from "next/server"
import pool from "@/lib/db"

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> } 
) {
    const adminId = req.headers.get("x-admin-id");

    if (!adminId) {
        return NextResponse.json(
            { message: "ไม่ได้รับสิทธิ์ (ไม่พบ admin id)" },
            { status: 401 }
        );
    }
    try {
       
        const { id } = await params;

        const result = await pool.query(
            `SELECT
                driver_id,
                first_name,
                last_name,
                phone_number,
                city,
                profile_img,
                citizen_id_img,
                driving_license_img,
                car_brand,
                car_model,
                car_plate,
                car_img,
                act_img,
                verified,
                create_at
            FROM drivers
            WHERE driver_id = $1`,
            [id]
        )

        if (result.rows.length === 0) {
            return NextResponse.json(
                { message: "ไม่พบข้อมูลคนขับ (Driver Not Found)" },
                { status: 404 }
            )
        }

        // ส่งข้อมูลกลับไป
        return NextResponse.json({
            data: result.rows[0]
        })

    } catch (err) {
        console.error("Database Error:", err)
        return NextResponse.json(
            { message: "เกิดข้อผิดพลาดที่เซิร์ฟเวอร์" },
            { status: 500 }
        )
    }
}
