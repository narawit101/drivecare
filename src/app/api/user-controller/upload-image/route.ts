import pool from "@/lib/db";
import { NextResponse, NextRequest } from "next/server";
import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";

export async function PUT(request: NextRequest) {
    try {
        const user_id = request.headers.get("x-user-id");
        if (!user_id) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

        const formData = await request.formData();
        const file = formData.get("file") as File;
        const fieldName = formData.get("fieldName") as string; // เช่น 'profile_img', 'car_img'

        if (!file || !fieldName) {
            return NextResponse.json({ message: "ข้อมูลไม่ครบ" }, { status: 400 });
        }

        // 1. ดึงชื่อไฟล์เดิมจาก Database ก่อนเพื่อเอาไปลบ
        const oldFileQuery = await pool.query(
            `SELECT ${fieldName} FROM users WHERE user_id = $1`,
            [user_id]
        );
        const oldFilePath = oldFileQuery.rows[0]?.[fieldName];

        // 2. Logic การอัปโหลดไฟล์ใหม่ลงเครื่อง (อ้างอิงจากตัวอย่าง regis ของคุณ)
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // กำหนดชื่อไฟล์และโฟลเดอร์ (แยกตาม fieldName เช่น uploads/profile หรือ uploads/car)
        const folderName = fieldName.split('_')[0]; // ตัดคำว่า _img ออกเพื่อให้ได้ชื่อโฟลเดอร์สั้นๆ
        const fileName = `${Date.now()}-${file.name}`;
        const relativePath = `/uploads/user/${folderName}/${fileName}`;
        const fullPath = path.join(process.cwd(), "public", relativePath);

        // สร้างโฟลเดอร์ถ้ายังไม่มี
        await mkdir(path.dirname(fullPath), { recursive: true });
        // เขียนไฟล์ใหม่ลงดิสก์
        await writeFile(fullPath, buffer);

        // 3. 💥 ลบรูปเก่าทิ้ง (ถ้ามีรูปเดิมอยู่ในเครื่อง)
        if (oldFilePath && oldFilePath.startsWith('/uploads/')) {
            const oldFullFileLocation = path.join(process.cwd(), "public", oldFilePath);
            try {
                await unlink(oldFullFileLocation);
                console.log(`ลบไฟล์เก่าสำเร็จ: ${oldFilePath}`);
            } catch (unlinkErr) {
                // ถ้าลบไม่ได้ (เช่น ไฟล์ไม่มีอยู่จริง) ให้ข้ามไป ไม่ให้พัง
                console.warn(`ไม่สามารถลบไฟล์เก่าได้: ${oldFilePath}`);
            }
        }

        // 4. อัปเดต Path รูปใหม่ลงใน Database
        const query = `UPDATE users SET ${fieldName} = $1 WHERE user_id = $2`;
        await pool.query(query, [relativePath, user_id]);

        return NextResponse.json({
            message: `อัปเดต ${fieldName} สำเร็จ`,
            url: relativePath // ส่ง path ใหม่กลับไปให้ UI แสดงผล
        });

    } catch (error: any) {
        console.error("Upload & Delete Error:", error);
        return NextResponse.json({ message: "Upload Error", error: error.message }, { status: 500 });
    }
}