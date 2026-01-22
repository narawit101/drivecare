import { NextResponse } from "next/server";
import pool from "@/lib/db";
const jwt = require("jsonwebtoken")
import { sendLineMessage } from "@/lib/line";

export async function GET() {
  try {
    const result = await pool.query('SELECT NOW()');

    return NextResponse.json({
      status: "DB Connection OK",
      timestamp: result.rows[0].now
    });

  } catch (error) {
    console.error("Test Query Failed:", error);
    return NextResponse.json({
      status: "DB Connection Error",
      message: "Check server logs for connection errors."
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { line_id, name, profile_img, phone_number, first_name, last_name, address, role } = body;

    if (line_id) {
      const checkLine = await pool.query(
        'SELECT line_id FROM users WHERE line_id = $1 ',
        [line_id]
      )

      if (checkLine.rows.length > 0) {
        return NextResponse.json(
          {
            message: `line_id`,
            status: 100
          },
          { status: 400 }
        );
      }
    }

    const result = await pool.query(
      `INSERT INTO users(line_id, name, profile_img, phone_number, first_name, last_name, address, role) 
   VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
   RETURNING user_id, role, line_id`,
      [line_id, name, profile_img, phone_number, first_name, last_name, address, role || 'user']
    );
    if (result.rows.length > 0) {

      const userRes = await pool.query(
        `SELECT line_id FROM users WHERE user_id = $1`,
        [result.rows[0].user_id]
      );
      const lineId = userRes.rows[0]?.line_id;
      console.log("LINE User ID:", lineId);

      if (lineId) {
        try {
          await sendLineMessage(
            lineId,
            ` ยินดีต้อนรับสู่แพลตฟอร์มของเรา! คุณได้ลงทะเบียนสำเร็จแล้ว`
          );
        } catch (e) {
          console.error("LINE SEND ERROR (ignored):", e);
        }

        // console.log("Sending approval message to LINE user:", lineUserId);
      }
    }

    const val = result.rows[0]
    const token = jwt.sign({
      user_id: val.user_id,
      role: val.role
    }, process.env.JWT_SECRET,
      {
        expiresIn: "7d"
      })

    return NextResponse.json(
      { message: "ลงทะเบียนสำเร็จ", token: token },
      { status: 201 }
    );
  } catch (error) {
    console.log("Registration Failed:", error);
    return NextResponse.json(
      { message: "ลงทะเบียนล้มเหลว" },
      { status: 500 }
    )
  }
}