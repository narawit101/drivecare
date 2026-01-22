import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { pusher } from "@/lib/pusher";
import { sendLineMessage } from "@/lib/line";

export async function PATCH(request: Request) {
    try {
        const adminId = request.headers.get("x-admin-id");
        if (!adminId) {
            return NextResponse.json({ message: "unauthorized" }, { status: 401 });
        }

        const { report_id, message } = await request.json();
        if (!report_id || !message) {
            return NextResponse.json(
                { message: "ข้อมูลไม่ครบถ้วน" },
                { status: 400 }
            );
        }

        await pool.query("BEGIN");

        /* ---------------- 🔍 หา report ---------------- */
        const reportRes = await pool.query(
            `
      SELECT
        r.report_id,
        r.booking_id,
        r.actor_id,
        r.actor_type,
        r.is_replied
      FROM reports r
      WHERE r.report_id = $1
      FOR UPDATE
      `,
            [report_id]
        );

        if (reportRes.rowCount === 0) {
            await pool.query("ROLLBACK");
            return NextResponse.json(
                { message: "ไม่พบรายงาน" },
                { status: 404 }
            );
        }

        const report = reportRes.rows[0];

        if (report.is_replied) {
            await pool.query("ROLLBACK");
            return NextResponse.json(
                { message: "รายงานนี้ถูกตอบแล้ว" },
                { status: 409 }
            );
        }

        /* ---------------- ✏️ update report ---------------- */
        await pool.query(
            `
      UPDATE reports
      SET is_replied = true
      WHERE report_id = $1
      `,
            [report_id]
        );

        /* ---------------- 🧾 log ---------------- */
        await pool.query(
            `
      INSERT INTO logs
      (booking_id, event_type, event_action, message, actor_id, actor_type)
      VALUES ($1, 'REPORT_REPLY_ADMIN', $2 , $3, $4 ,'admin')
      `,
            [report.booking_id, report.actor_type, message, adminId]
        );

        /* ---------------- 🔍 หา LINE ID ---------------- */
        let lineId: string | null = null;

        if (report.actor_type === "user") {
            const userRes = await pool.query(
                `SELECT line_id FROM users WHERE user_id = $1`,
                [report.actor_id]
            );
            lineId = userRes.rows[0]?.line_id || null;
        }

        if (report.actor_type === "driver") {
            const driverRes = await pool.query(
                `SELECT line_id FROM drivers WHERE driver_id = $1`,
                [report.actor_id]
            );
            lineId = driverRes.rows[0]?.line_id || null;
        }

        await pool.query("COMMIT");

        /* ---------------- 🔔 REALTIME ---------------- */
        pusher.trigger(
            `private-${report.actor_type}-${report.actor_id}`,
            "report-created",
            {
                type: "ADMIN_REPLY_REPORT",
                report_id,
                booking_id: report.booking_id,
                message,
            }
        );

        pusher.trigger("private-admin", "report-created", {
            type: "ADMIN_REPLY_REPORT",
            report_id,
            booking_id: report.booking_id,
        });

        /* ---------------- 💬 LINE ---------------- */
        if (lineId) {
            try {
                await sendLineMessage(
                    lineId,
                    `📢 แอดมินตอบกลับรายงานของคุณ\n${message}`
                );
            } catch (err) {
                console.error("LINE ERROR:", err);
            }
        }

        return NextResponse.json({
            message: "ตอบกลับรายงานสำเร็จ",
        });

    } catch (error) {
        console.error("REPLY REPORT ERROR:", error);
        await pool.query("ROLLBACK");
        return NextResponse.json(
            { message: "server error" },
            { status: 500 }
        );
    }
}
