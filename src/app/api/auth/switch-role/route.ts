import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import jwt from "jsonwebtoken";
import pool from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!);
    } catch (err) {
      return NextResponse.json({ message: "Token ไม่ถูกต้องหรือหมดอายุ" }, { status: 401 });
    }

    // ==========================================
    // CASE A: Current Role is USER -> Switch to DRIVER
    // ==========================================
    if (decoded.user_id) {
      // 1. ดึง line_id ของผู้ใช้ปัจจุบัน
      const userRes = await pool.query(
        "SELECT line_id FROM users WHERE user_id = $1",
        [decoded.user_id]
      );

      if (userRes.rows.length === 0) {
        return NextResponse.json({ message: "ไม่พบบัญชีผู้ใช้งานเดิม" }, { status: 404 });
      }

      const lineId = userRes.rows[0].line_id;

      if (!lineId) {
        return NextResponse.json(
          { message: "บัญชีนี้ไม่ได้ผูกกับ LINE ไม่สามารถสลับบทบาทได้" },
          { status: 400 }
        );
      }

      // 2. ตรวจสอบว่ามีบัญชีคนขับรถหรือยัง
      const driverRes = await pool.query(
        "SELECT driver_id, role, verified, status FROM drivers WHERE line_id = $1",
        [lineId]
      );

      if (driverRes.rows.length === 0) {
        return NextResponse.json(
          {
            message: "ยังไม่ได้ลงทะเบียนเป็นคนขับรถ",
            status: 404,
            redirect: "/register-driver",
          },
          { status: 404 }
        );
      }

      const driver = driverRes.rows[0];

      // อัปเดตสถานะคนขับเป็น active (กรณีผ่านการอนุมัติแล้ว)
      if (driver.verified === "approved") {
        await pool.query(
          "UPDATE drivers SET status = 'active' WHERE driver_id = $1",
          [driver.driver_id]
        );
      }

      // 3. สร้าง Token ตัวใหม่สำหรับคนขับรถ
      const newDriverToken = jwt.sign(
        {
          driver_id: driver.driver_id,
          role: driver.role,
          verified: driver.verified,
        },
        process.env.JWT_SECRET!,
        { expiresIn: "7d" }
      );

      return NextResponse.json(
        {
          message: "สลับเป็นโหมดคนขับสำเร็จ",
          token: newDriverToken,
          role: "driver",
          verified: driver.verified,
        },
        { status: 200 }
      );
    }

    // ==========================================
    // CASE B: Current Role is DRIVER -> Switch to USER
    // ==========================================
    if (decoded.driver_id) {
      // 1. ดึง line_id ของคนขับปัจจุบัน
      const driverRes = await pool.query(
        "SELECT line_id, first_name, last_name, phone_number, profile_img FROM drivers WHERE driver_id = $1",
        [decoded.driver_id]
      );

      if (driverRes.rows.length === 0) {
        return NextResponse.json({ message: "ไม่พบบัญชีคนขับรถเดิม" }, { status: 404 });
      }

      const driverInfo = driverRes.rows[0];
      const lineId = driverInfo.line_id;

      if (!lineId) {
        return NextResponse.json(
          { message: "บัญชีนี้ไม่ได้ผูกกับ LINE ไม่สามารถสลับบทบาทได้" },
          { status: 400 }
        );
      }

      // 2. ตรวจสอบว่ามีบัญชีผู้ใช้งานหรือยัง
      const userRes = await pool.query(
        "SELECT user_id, role FROM users WHERE line_id = $1",
        [lineId]
      );

      let userId: number;
      let userRole: string = "user";

      if (userRes.rows.length > 0) {
        userId = userRes.rows[0].user_id;
        userRole = userRes.rows[0].role || "user";
      } else {
        // 3. สร้างบัญชีผู้ใช้งานให้อัตโนมัติ (สลับมาครั้งแรก สะดวกสบายที่สุด)
        const fullName = `${driverInfo.first_name} ${driverInfo.last_name}`.trim();
        const insertUserRes = await pool.query(
          `INSERT INTO users (line_id, name, first_name, last_name, phone_number, profile_img, role)
           VALUES ($1, $2, $3, $4, $5, $6, 'user')
           RETURNING user_id, role`,
          [
            lineId,
            fullName || "ผู้ใช้งานใหม่",
            driverInfo.first_name || "",
            driverInfo.last_name || "",
            driverInfo.phone_number || "",
            driverInfo.profile_img || null,
          ]
        );
        userId = insertUserRes.rows[0].user_id;
        userRole = insertUserRes.rows[0].role;
      }

      // 4. สร้าง Token ตัวใหม่สำหรับผู้ใช้ทั่วไป
      const newUserToken = jwt.sign(
        {
          user_id: userId,
          role: userRole,
        },
        process.env.JWT_SECRET!,
        { expiresIn: "7d" }
      );

      return NextResponse.json(
        {
          message: "สลับเป็นโหมดผู้ใช้งานสำเร็จ",
          token: newUserToken,
          role: "user",
        },
        { status: 200 }
      );
    }

    return NextResponse.json({ message: "ไม่สามารถระบุบทบาทได้" }, { status: 400 });
  } catch (error) {
    console.error("Switch role error:", error);
    return NextResponse.json({ message: "การสลับบทบาทล้มเหลว" }, { status: 500 });
  }
}
