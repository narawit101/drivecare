import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export async function POST(request: NextRequest) {
    try {
        const driver_id = request.headers.get("x-driver-id");

        if (!driver_id) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }
        await pool.query(
            `UPDATE drivers
       SET status = 'inactive'
       WHERE driver_id = $1`,
            [driver_id]
        );

        return NextResponse.json({ message: "ออกจากระบบสำเร็จ" });

    } catch (error) {
        console.error("Logout error:", error);
        return NextResponse.json(
            { message: "logout failed" },
            { status: 500 }
        );
    }
}
