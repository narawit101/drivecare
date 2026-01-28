import pool from "@/lib/db";
import { NextResponse, NextRequest } from "next/server";
const jwt = require("jsonwebtoken");

export async function POST(request: NextRequest) {
  try {
    const { line_id } = await request.json();

    if (!line_id) {
      return NextResponse.json(
        { message: "กรุณากรอก line_id" },
        { status: 400 }
      );
    }

    // users
    const userResult = await pool.query(
      `SELECT user_id, role
       FROM users
       WHERE line_id = $1`,
      [line_id]
    );

    if (userResult.rows.length > 0) {
      const user = userResult.rows[0];

      const token = jwt.sign(
        {
          user_id: user.user_id,
          role: user.role,
        },
        process.env.JWT_SECRET as string,
        { expiresIn: "7d" }
      );

      return NextResponse.json(
        {
          message: "เข้าสู่ระบบผู้ใช้สำเร็จ",
          token,
        },
        { status: 200 }
      );
    }

    // drivers
    const driverResult = await pool.query(
      `SELECT driver_id, role, verified, status
       FROM drivers
       WHERE line_id = $1`,
      [line_id]
    );

    if (driverResult.rows.length > 0) {
      const driver = driverResult.rows[0];

      // ถ้า approved → อัพเดต active
      if (driver.verified === "approved") {
        await pool.query(
          `UPDATE drivers
       SET status = 'active'
       WHERE driver_id = $1`,
          [driver.driver_id]
        );
      }

      const token = jwt.sign(
        {
          driver_id: driver.driver_id,
          role: driver.role,
          verified: driver.verified, // 👈 ใส่ไปใน token ด้วย
        },
        process.env.JWT_SECRET as string,
        { expiresIn: "7d" }
      );

      return NextResponse.json(
        {
          message:
            driver.verified === "approved"
              ? "เข้าสู่ระบบคนขับสำเร็จ"
              : driver.verified === "pending_approval"
                ? "บัญชีคนขับอยู่ระหว่างการตรวจสอบ"
                : "บัญชีคนขับยังไม่ผ่านการยืนยันตัวตน",
          verified: driver.verified,
          token,
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        message: "บัญชีนี้ยังไม่เป็นสมาชิก",
        status: 100
      },
      { status: 404 }
    );

  } catch (error) {
    const err = error as { code?: string; message?: string };
    console.error("Login error:", { code: err?.code, message: err?.message });
    return NextResponse.json(
      { message: "login ล้มเหลว" },
      { status: 500 }
    );
  }
}
