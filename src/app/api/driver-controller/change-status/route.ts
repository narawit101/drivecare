import pool from "@/lib/db"
import { NextResponse, NextRequest } from "next/server"

export async function PATCH(request: NextRequest) {
    try {
        const driver_id = request.headers.get("x-driver-id")
        const { status } = await request.json()

        if (!driver_id) {
            return NextResponse.json({ message: "driver_id not found" }, { status: 400 })
        }

        // 1. ตรวจสอบข้อมูลคนขับ
        const checkVerify = await pool.query(
            "SELECT verified FROM drivers WHERE driver_id = $1",
            [driver_id]
        )

        if (checkVerify.rows.length === 0) {
            return NextResponse.json({ message: "ไม่พบข้อมูลคนขับ" }, { status: 404 })
        }
        if (checkVerify.rows[0].verified === "pending_approval") {
            return NextResponse.json(
                { message: "บัญชีของคุณอยู่ระหว่างการตรวจสอบ จึงไม่สามารถเปลี่ยนสถานะเป็น “พร้อมรับงาน” ได้" },
                { status: 403 }
            )
        }
        if (checkVerify.rows[0].verified === "rejected") {
            return NextResponse.json(
                { message: "บัญชีของคุณไม่ผ่านการตรวจสอบกรุณาแก้ไขข้อมูล จึงจะสามารถเปลี่ยนสถานะเป็น “พร้อมรับงาน” ได้" },
                { status: 403 }
            )
        }

        const validStatuses = ["active", "inactive"]
        if (!validStatuses.includes(status)) {
            return NextResponse.json({ message: "สถานะไม่ถูกต้อง" }, { status: 400 })
        }

        const checkBanded = await pool.query(
            "SELECT status FROM drivers WHERE driver_id = $1",
            [driver_id]
        )

        if (checkBanded.rows[0].status === "banned") {
            return NextResponse.json(
                { message: "บัญชีของคุณถูกระงับการใช้งาน จึงไม่สามารถเปลี่ยนสถานะได้" },
                { status: 403 }
            )
        }

        // 2. อัปเดต Database (ทำอันนี้ก่อนเสมอ)
        await pool.query(
            "UPDATE drivers SET status = $1 WHERE driver_id = $2",
            [status, driver_id]
        )

        return NextResponse.json({ message: "เปลี่ยนสถานะเรียบร้อย" })

    } catch (err) {
        console.error("❌ API Error:", err)
        return NextResponse.json({ message: "เกิดข้อผิดพลาดภายในระบบ" }, { status: 500 })
    }
}