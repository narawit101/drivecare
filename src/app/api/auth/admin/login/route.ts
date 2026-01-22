import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
const jwt = require("jsonwebtoken");

export async function POST(request: NextRequest) {
  try {
    const { user_name, password } = await request.json();

    const result = await pool.query(
      `SELECT admin_id, user_name, password, role
      FROM admin
      WHERE user_name = $1 AND role = 'admin'`,
      [user_name]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ message: "ไม่พบผู้ใช้ในระบบ" }, { status: 404 });
    }

    const admin = result.rows[0];

    if (admin.password !== password) {
      return NextResponse.json({ message: "รหัสผ่านไม่ถูกต้อง" }, { status: 401 });
    }


    const val = result.rows[0];

    const token = jwt.sign(
      {
        admin_id: val.admin_id,
        role: val.role,
      },
      process.env.JWT_SECRET as string,
      { expiresIn: "7d" }
    );

    const response = NextResponse.json(
      { message: "เข้าสู่ระบบสำเร็จ" },
      { status: 200 }
    );

    response.cookies.set("admin_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;

  } catch (error) {
    console.log(error);
    return NextResponse.json({ message: "ไม่สามารถเข้าสู่ระบบได้" });
  }
}
