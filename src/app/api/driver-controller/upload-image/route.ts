import pool from "@/lib/db";
import { NextResponse, NextRequest } from "next/server";
import { deleteCloudinaryByUrl, uploadImageFile } from "@/lib/cloudinary";

export const runtime = "nodejs";

function mapDriverFieldToFolder(fieldName: string) {
    if (fieldName === "profile_img") return "profile";
    if (fieldName === "citizen_id_img") return "citizen";
    if (fieldName === "driving_license_img") return "license";
    if (fieldName === "car_img") return "car";
    if (fieldName === "act_img") return "act";
    return fieldName.split("_")[0] || "others";
}

export async function PUT(request: NextRequest) {
    try {
        const driver_id = request.headers.get("x-driver-id");
        if (!driver_id) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

        const formData = await request.formData();
        const file = formData.get("file") as File;
        const fieldName = formData.get("fieldName") as string; // เช่น 'profile_img', 'car_img'

        if (!file || !fieldName) {
            return NextResponse.json({ message: "ข้อมูลไม่ครบ" }, { status: 400 });
        }

        // 1. ดึงชื่อไฟล์เดิมจาก Database ก่อนเพื่อเอาไปลบ
        const oldFileQuery = await pool.query(
            `SELECT ${fieldName} FROM drivers WHERE driver_id = $1`,
            [driver_id]
        );
        const oldFilePath = oldFileQuery.rows[0]?.[fieldName];

        // 2. Upload ไป Cloudinary แทนการเขียนลง public/uploads (Vercel เป็น read-only)
        const folderName = mapDriverFieldToFolder(fieldName);
        const uploaded = await uploadImageFile(file, {
            folder: `drivecare/driver/${folderName}`,
            publicIdPrefix: `${driver_id}-${fieldName}`,
        });

        // 3. 💥 ลบรูปเก่าทิ้ง (ถ้าเป็น Cloudinary URL)
        if (typeof oldFilePath === "string" && oldFilePath) {
            try {
                await deleteCloudinaryByUrl(oldFilePath);
            } catch {
                // ignore delete issues
            }
        }

        // 4. อัปเดต URL รูปใหม่ลงใน Database
        const query = `UPDATE drivers SET ${fieldName} = $1 WHERE driver_id = $2`;
        await pool.query(query, [uploaded.secure_url, driver_id]);

        return NextResponse.json({
            message: `อัปเดต ${fieldName} สำเร็จ`,
            url: uploaded.secure_url
        });

    } catch (error: any) {
        console.error("Upload & Delete Error:", { code: error?.code, message: error?.message });
        return NextResponse.json({ message: "Upload Error", error: error.message }, { status: 500 });
    }
}