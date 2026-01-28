import pool from "@/lib/db";
import { NextResponse, NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const user_id = request.headers.get("x-user-id");

    if (!user_id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // ดึงข้อมูลล่าสุดของ User รายนี้
    const query = `
      SELECT 
        weight, 
        height, 
        bmi, 
        congenital_diseases, 
        allergies, 
        updated_at 
      FROM health_records 
      WHERE user_id = $1 
      LIMIT 1
    `;
    
    const result = await pool.query(query, [user_id]);

    if (result.rows.length === 0) {
      return NextResponse.json({ message: "No record found" }, { status: 404 });
    }

    return NextResponse.json(result.rows[0], { status: 200 });

  } catch (error) {
    console.error("GET Health Record Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}