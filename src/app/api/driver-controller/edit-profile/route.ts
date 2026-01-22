import pool from "@/lib/db";
import { NextResponse, NextRequest } from "next/server";

export async function PUT(request: NextRequest) {
    try {
        const driver_id = request.headers.get("x-driver-id");
        if (!driver_id) return NextResponse.json({ message: "ไม่พบ Driver ID" }, { status: 401 });

        const body = await request.json();
        const {
            first_name, last_name, phone_number,
            car_brand, car_model, car_plate, city
        } = body;

        // อัปเดตทุกฟีลด์ในตาราง drivers ที่เดียวจบ
        const result = await pool.query(
            `UPDATE drivers SET 
                first_name = $1, 
                last_name = $2, 
                phone_number = $3, 
                car_brand = $4, 
                car_model = $5, 
                car_plate = $6, 
                city = $7 
             WHERE driver_id = $8
             RETURNING *`,
            [first_name, last_name, phone_number, car_brand, car_model, car_plate, city, driver_id]
        );

        if (result.rowCount === 0) {
            return NextResponse.json({ message: "ไม่พบข้อมูลคนขับ" }, { status: 404 });
        }

        return NextResponse.json({ message: "อัปเดตข้อมูลสำเร็จ", data: result.rows[0] });

    } catch (error) {
        console.error("Update Error:", error);
        return NextResponse.json({ message: "เกิดข้อผิดพลาดภายในระบบ" }, { status: 500 });
    }
}