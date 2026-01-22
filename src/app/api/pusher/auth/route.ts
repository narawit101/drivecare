// app/api/pusher/auth/route.ts
import { NextRequest, NextResponse } from "next/server";
import { pusher } from "@/lib/pusher";
import jwt from "jsonwebtoken";

export async function POST(req: NextRequest) {
    try {
        const body = await req.text(); // ⚠️ ต้องใช้ text()
        const params = new URLSearchParams(body);

        const socket_id = params.get("socket_id");
        const channel_name = params.get("channel_name");

        if (!socket_id || !channel_name) {
            return NextResponse.json({ error: "Invalid request" }, { status: 400 });
        }

        // 🔐 ดึง token (driver)
        const token =
            req.headers.get("authorization")?.replace("Bearer ", "") ||
            req.cookies.get("admin_token")?.value;

        if (!token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

        // ✅ อนุญาตเฉพาะ driver ที่เข้าห้องตัวเอง
        // driver
        // driver ห้องส่วนตัว
        if (
            decoded.driver_id &&
            channel_name === `private-driver-${decoded.driver_id}`
        ) {
            return NextResponse.json(
                pusher.authorizeChannel(socket_id, channel_name)
            );
        }

        // 🔥 ห้องกลาง งานใหม่
        if (
            decoded.driver_id &&
            channel_name === "private-driver"
        ) {
            return NextResponse.json(
                pusher.authorizeChannel(socket_id, channel_name)
            );
        }

        // user (🔥 เพิ่ม)
        if (
            decoded.user_id &&
            channel_name === `private-user-${decoded.user_id}`
        ) {
            return NextResponse.json(
                pusher.authorizeChannel(socket_id, channel_name)
            );
        }
        if (
            decoded.role === "admin" &&
            channel_name === "private-admin"
        ) {
            return NextResponse.json(
                pusher.authorizeChannel(socket_id, channel_name)
            );
        }

        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    } catch (err) {
        console.error("Pusher auth error:", err);
        return NextResponse.json({ error: "Auth failed" }, { status: 403 });
    }
}
