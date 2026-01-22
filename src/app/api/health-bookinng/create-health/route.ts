import pool from "@/lib/db";
import { NextResponse, NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const client = await pool.connect();
    const user_id = request.headers.get("x-user-id"); 

    if (!user_id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { weight, height, congenital_diseases, allergies } = body;

    // คำนวณ BMI
    const heightInMeters = height / 100;
    const bmi = (weight / (heightInMeters * heightInMeters)).toFixed(1);

    try {
      await client.query("BEGIN");

      // บันทึกหรืออัปเดตข้อมูลล่าสุด
      const upsertQuery = `
          INSERT INTO health_records (user_id, weight, height, bmi, congenital_diseases, allergies, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, NOW())
          ON CONFLICT (user_id) 
          DO UPDATE SET 
              weight = EXCLUDED.weight,
              height = EXCLUDED.height,
              bmi = EXCLUDED.bmi,
              congenital_diseases = EXCLUDED.congenital_diseases,
              allergies = EXCLUDED.allergies,
              updated_at = NOW()
          RETURNING *;
      `;

      // 🔥 แก้ไขจาก user.user_id เป็น user_id
      const res = await client.query(upsertQuery, [
        user_id, weight, height, bmi, congenital_diseases, allergies
      ]);

      // บันทึกลงตารางประวัติ
      const historyQuery = `
          INSERT INTO health_history (user_id, weight, recorded_at)
          VALUES ($1, $2, NOW());
      `;
      
      // 🔥 แก้ไขจาก user.user_id เป็น user_id
      await client.query(historyQuery, [user_id, weight]);

      await client.query("COMMIT");

      return NextResponse.json({
        message: "บันทึกข้อมูลสำเร็จ",
        data: res.rows[0]
      }, { status: 200 });

    } catch (dbError) {
      await client.query("ROLLBACK");
      console.error("Database Error:", dbError);
      return NextResponse.json({ message: "Database error occurred" }, { status: 500 });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Internal Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}