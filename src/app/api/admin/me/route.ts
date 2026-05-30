import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { cacheGet } from "@/lib/cache";
import { CacheKeys, TTL } from "@/lib/cache-keys";

export async function GET(request: NextRequest) {
    try {
        // 1. อ่าน admin_id จาก proxy header
        const adminId = request.headers.get("x-admin-id");

        if (!adminId) {
            return NextResponse.json(
                { message: "ไม่ได้รับสิทธิ์ (ไม่พบ admin id)" },
                { status: 401 }
            );
        }

        // 2. Query ข้อมูล admin ด้วย Cache
        const adminData = await cacheGet(
            CacheKeys.adminMe(adminId),
            TTL.ADMIN_ME,
            async () => {
                const result = await pool.query(
                    `
                    SELECT admin_id, user_name, role
                    FROM admin
                    WHERE admin_id = $1
                    `,
                    [adminId]
                );
                return result.rows[0] || null;
            }
        );

        if (!adminData) {
            return NextResponse.json(
                { message: "ไม่พบผู้ดูแลในระบบ" },
                { status: 404 }
            );
        }

        // 3. ส่งข้อมูลกลับ
        return NextResponse.json({
            data: adminData,
        });

    } catch (error) {
        console.error("ADMIN_ME_ERROR:", error);

        return NextResponse.json(
            { message: "เกิดข้อผิดพลาดในการดึงข้อมูลผู้ดูแล" },
            { status: 500 }
        );
    }
}

