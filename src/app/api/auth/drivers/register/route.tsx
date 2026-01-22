import { NextResponse, NextRequest } from "next/server";
import pool from "@/lib/db";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
const jwt = require("jsonwebtoken");
import { sendLineMessage } from "@/lib/line";

export async function POST(req: NextRequest) {
  try {
    // ใช้ formData() ของ Next.js แทน Multer middleware
    const formData = await req.formData();

    // ดึงข้อมูล Text fields
    const line_id = formData.get("line_id") as string;
    const first_name = formData.get("first_name") as string;
    // ... ดึงฟิลด์อื่นๆ เช่น last_name, phone_number, city

    // ฟังก์ชันช่วยบันทึกไฟล์ลงเครื่อง (เลียนแบบการทำงานของ Multer)
    const saveFile = async (file: FormDataEntryValue | null, folder: string) => {
      if (!file || !(file instanceof File)) return null;

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const fileName = `${Date.now()}-${file.name}`;
      const relativePath = `/uploads/driver/${folder}/${fileName}`;
      const fullPath = path.join(process.cwd(), "public", relativePath);

      // สร้างโฟลเดอร์ถ้ายังไม่มี
      await mkdir(path.dirname(fullPath), { recursive: true });
      // เขียนไฟล์ลงดิสก์
      await writeFile(fullPath, buffer);

      return relativePath; // ส่งค่า path กลับไปเก็บใน Database
    };

    // ประมวลผลรูปภาพทั้งหมด
    const profile_img = await saveFile(formData.get("profile_img"), "profile");
    const citizen_id_img = await saveFile(formData.get("citizen_id_img"), "citizen");
    const driving_license_img = await saveFile(formData.get("driving_license_img"), "license");
    const car_img = await saveFile(formData.get("car_img"), "car");
    const act_img = await saveFile(formData.get("act_img"), "act");

    // บันทึกลง Database
    const result = await pool.query(
      `INSERT INTO drivers (
        line_id, first_name, last_name, phone_number,
        city, car_brand, car_model, car_plate,
        profile_img, citizen_id_img, driving_license_img, car_img, act_img,
        status, role
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
      RETURNING *`,
      [
        line_id, first_name, formData.get("last_name"), formData.get("phone_number"),
        formData.get("city"), formData.get("car_brand"), formData.get("car_model"), formData.get("car_plate"),
        profile_img, citizen_id_img, driving_license_img, car_img, act_img,
        formData.get("status"), formData.get("role"),
      ]
    );
    if (result.rows.length > 0) {

      const driverRes = await pool.query(
        `SELECT line_id FROM drivers WHERE driver_id = $1`,
        [result.rows[0].driver_id]
      );
      const lineId = driverRes.rows[0]?.line_id;
      console.log("LINE User ID:", lineId);

      if (lineId) {
        try {
          await sendLineMessage(
            lineId,
            ` ยินดีต้อนรับสู่แพลตฟอร์มของเรา! คุณได้ลงทะเบียนคนขับสำเร็จแล้ว รอรับการตรวจสอบจากผู้ดูแลระบบก่อนเริ่มใช้งาน`
          );
        } catch (e) {
          console.error("LINE SEND ERROR (ignored):", e);
        }

        // console.log("Sending approval message to LINE user:", lineUserId);
      }
    }
    const driver = result.rows[0];

    if (driver) {
      const token = jwt.sign(
        { driver_id: driver.driver_id, role: driver.role },
        process.env.JWT_SECRET!,
        { expiresIn: "7d" }
      );
      return NextResponse.json({ token }, { status: 201 });
    }

  } catch (err: any) {
    console.error("Upload Error:", err);
    return NextResponse.json(
      { message: err.message || "การลงทะเบียนล้มเหลว" },
      { status: 400 }
    );
  }
}