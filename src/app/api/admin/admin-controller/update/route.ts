import { NextRequest, NextResponse } from "next/server"
import pool from "@/lib/db"
import { pusher } from "@/lib/pusher";

export async function PUT(req: NextRequest) {
    const adminId = req.headers.get("x-admin-id")

    if (!adminId) {
        return NextResponse.json(
            { message: "ไม่ได้รับสิทธิ์ (ไม่พบ admin id)" },
            { status: 401 }
        )
    }

    try {
        const { searchParams } = new URL(req.url)
        const id = searchParams.get("id")
        const role = searchParams.get("role")
        const body = await req.json()

        if (!id || !role) {
            return NextResponse.json({ message: "missing id or role" }, { status: 400 })
        }

        let table = ""
        let idField = ""
        let allowedFields: string[] = []

        if (role === "driver") {
            table = "drivers"
            idField = "driver_id"
            allowedFields = [
                "first_name",
                "last_name",
                "phone_number",
                "status",
                "city",
                "verified",
            ];

        } else if (role === "user") {
            table = "users"
            idField = "user_id"
            allowedFields = ["first_name", "last_name", "phone_number", "address"]
        } else {
            return NextResponse.json({ message: "invalid role" }, { status: 400 })
        }

        // whitelist fields
        const filteredEntries = Object.entries(body)
            .filter(([key]) => allowedFields.includes(key))

        if (filteredEntries.length === 0) {
            return NextResponse.json({ message: "no valid fields" }, { status: 400 })
        }

        const fields = filteredEntries.map(([key]) => key)
        const values = filteredEntries.map(([, value]) => value)

        const setQuery = fields
            .map((field, index) => `${field} = $${index + 1}`)
            .join(", ")

        await pool.query(
            `UPDATE ${table}
       SET ${setQuery}
       WHERE ${idField} = $${values.length + 1}`,
            [...values, id]
        )

        if (role === "driver") {
            await pusher.trigger(
                `private-driver-${id}`,
                "driver.status.updated",
                {
                    driver_id: id,
                    status: body.status,
                }
            );
        }

        return NextResponse.json({ message: "อัพเดทข้อมูลเรียบร้อย" })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ message: "server error" }, { status: 500 })
    }
}
