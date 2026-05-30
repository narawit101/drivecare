// app/api/admin/drivers/[id]/verify/route.ts
import { NextRequest, NextResponse } from "next/server"
import { sendLineMessage } from "@/lib/line";
import pool from "@/lib/db"
import { pusher } from "@/lib/pusher";

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> } // ปรับให้เป็น Promise
) {
    try {
        const { id } = await params
        const adminId = req.headers.get("x-admin-id")

        if (!adminId) {
            return NextResponse.json({ message: "no admin id" }, { status: 401 })
        }

        const body = await req.json();
        const { verified, reason } = body;
        console.log("reson", reason)
        console.log("Updating driver ID:", id, "to status:", verified)

        if (!["approved", "pending_approval", "rejected"].includes(verified)) {
            return NextResponse.json({ message: "invalid status" }, { status: 400 })
        }

        const result = await pool.query(
            `UPDATE drivers
       SET verified = $1
       WHERE driver_id = $2
       RETURNING driver_id, verified`,
            [verified, id]
        );

        if (result.rows.length === 0) {
            return NextResponse.json({ message: "driver not found" }, { status: 404 });
        }

        const updated = result.rows[0];

        // realtime
        try {
            await pusher.trigger(
                `private-driver-${updated.driver_id}`,
                "driver.verified.updated",
                {
                    driver_id: updated.driver_id,
                    verified: updated.verified,
                }
            );
        } catch (e) {
            console.error("Pusher trigger failed (ignored):", e);
        }

        // 🔑 ดึง line_user_id
        const driverRes = await pool.query(
            `SELECT line_id FROM drivers WHERE driver_id = $1`,
            [id]
        );

        const lineId = driverRes.rows[0]?.line_id;
        console.log("LINE User ID:", lineId);

        // ✅ ส่ง LINE เฉพาะบางสถานะ
        if (lineId) {
            if (verified === "rejected") {
                await pool.query(
                    `UPDATE drivers
       SET status = 'inactive'
           WHERE driver_id = $1`,
                    [id]
                );
                try {
                    await sendLineMessage(

                        lineId,
                        `❌ บัญชีของคุณยังไม่ผ่านการยืนยันตัวตน
                    เหตุผลจากผู้ดูแลระบบ:
                    ${reason || "-"}
                    📌 กรุณาแก้ไขข้อมูลและส่งตรวจสอบใหม่`
                    );
                } catch (e) {
                    console.error("LINE SEND ERROR (ignored):", e);
                }

                // console.log("Sending approval message to LINE user:", lineUserId);
            }
            if (verified === "approved") {
                await pool.query(
                    `UPDATE drivers
       SET status = 'active'
           WHERE driver_id = $1`,
                    [id]
                );
                try {
                    await sendLineMessage(
                        lineId,
                        `✅ บัญชีของคุณผ่านการยืนยันตัวตนแล้ว คุณสามารถเริ่มรับงานได้ทันที`
                    );
                } catch (e) {
                    console.error("LINE SEND ERROR (ignored):", e);
                }

            }
        }
        return NextResponse.json({ message: "อัปเดตสถานะเรียบร้อย" })
    } catch (error) {
        console.error("Verify driver status error:", error);
        return NextResponse.json({ message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" }, { status: 500 });
    }
}
