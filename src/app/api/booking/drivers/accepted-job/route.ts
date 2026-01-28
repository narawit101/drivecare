import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(req: Request) {
    const driver_id = req.headers.get("x-driver-id");
    if (!driver_id) {
        return NextResponse.json({ message: "unauthorized" }, { status: 401 });
    }
    try {
        const result = await pool.query(
            `
    SELECT COUNT(*)::int AS total
    FROM bookings
    WHERE driver_id = $1
      AND status IN ('accepted')
    `,
            [driver_id]
        );
        if (result.rows.length === 0) {
            return NextResponse.json({ message: "not found" }, { status: 404 });
        }
        return NextResponse.json({
            total: result.rows[0].total ,
        });
    } catch (error) {
        console.error("Error fetching accepted jobs count:", error);
        return NextResponse.json(
            { message: "internal server error" },
            { status: 500 }
        );
    }
}
