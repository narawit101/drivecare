import pool from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { pusher } from "@/lib/pusher";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";

export const runtime = "nodejs";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

function getFormString(formData: FormData, keys: string[]): string | null {
  for (const key of keys) {
    const value = formData.get(key);
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed) return trimmed;
    }
  }

  const normalizedTargets = new Set(
    keys.map((k) => k.replace(/\s+/g, "").toLowerCase())
  );

  for (const [k, v] of formData.entries()) {
    const normalizedKey = k.replace(/\s+/g, "").toLowerCase();
    if (!normalizedTargets.has(normalizedKey)) continue;
    if (typeof v === "string") {
      const trimmed = v.trim();
      if (trimmed) return trimmed;
    }
  }

  return null;
}

async function saveSlipFile(file: File, userId: string, bookingId: string) {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const ext = path.extname(file.name || "").toLowerCase() || ".jpg";
  const fileName = `${userId}-${bookingId}-${Date.now()}${ext}`;
  const relativePath = `/uploads/user/payments/${fileName}`;
  const fullPath = path.join(process.cwd(), "public", relativePath);

  await mkdir(path.dirname(fullPath), { recursive: true });
  await writeFile(fullPath, buffer);

  return relativePath;
}

async function safeDeletePublicFile(relativePath: string) {
  if (!relativePath.startsWith("/uploads/user/payments/")) return;

  const fullPath = path.resolve(process.cwd(), "public", relativePath);
  const paymentsDir = path.resolve(process.cwd(), "public", "uploads", "user", "payments");
  if (!fullPath.startsWith(paymentsDir)) return;

  try {
    await unlink(fullPath);
  } catch {
    // ignore missing file / delete issues
  }
}

export async function PATCH(request: NextRequest) {
  const client = await pool.connect();
  let newSlipPath: string | null = null;
  let oldSlipToDelete: string | null = null;

  try {
    const user_id = request.headers.get("x-user-id");
    if (!user_id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const contentType = request.headers.get("content-type") || "";

    let booking_id: string | null = null;
    let slip_url: string | null = null;
    let slipFile: File | null = null;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();

      booking_id =
        getFormString(formData, ["booking_id", "bookingId", "booking", "id"]) ||
        request.nextUrl.searchParams.get("booking_id") ||
        request.nextUrl.searchParams.get("bookingId") ||
        null;

      const entry = (formData.get("payment_slip") || formData.get("slip")) as
        | FormDataEntryValue
        | null;

      slipFile = entry instanceof File ? entry : null;

      if (!booking_id) {
        return NextResponse.json(
          { message: "กรุณาระบุ booking_id" },
          { status: 400 }
        );
      }

      if (slipFile) {
        if (!IMAGE_TYPES.includes(slipFile.type)) {
          return NextResponse.json(
            { message: "อนุญาตเฉพาะไฟล์รูป (jpg, png, webp)" },
            { status: 400 }
          );
        }
        if (slipFile.size > MAX_SIZE) {
          return NextResponse.json(
            { message: "ขนาดไฟล์ต้องไม่เกิน 10MB" },
            { status: 400 }
          );
        }

        newSlipPath = await saveSlipFile(slipFile, user_id, booking_id);
        slip_url = newSlipPath;
      }
    } else {
      const json = await request.json();
      booking_id = json?.booking_id ?? null;
      slip_url = json?.slip_url ?? null;
    }

    if (!slip_url) {
      return NextResponse.json(
        { message: "กรุณาแนบหลักฐานการโอนเงิน" },
        { status: 400 }
      );
    }

    await client.query("BEGIN");

    const check = await client.query(
      `SELECT status, payment_status, payment_slip, driver_id, user_id
       FROM bookings 
       WHERE booking_id = $1 
       FOR UPDATE`,
      [booking_id]
    );

    if (check.rowCount === 0) {
      await client.query("ROLLBACK");
      return NextResponse.json({ message: "ไม่พบรายการ" }, { status: 404 });
    }

    const { status, payment_status, payment_slip, driver_id: driverId, user_id: bookingUserId } =
      check.rows[0];

    if (String(bookingUserId) !== String(user_id)) {
      await client.query("ROLLBACK");
      if (newSlipPath) await safeDeletePublicFile(newSlipPath);
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (!driverId) {
      await client.query("ROLLBACK");
      if (newSlipPath) await safeDeletePublicFile(newSlipPath);
      return NextResponse.json(
        { message: "ยังไม่มีคนขับรับงาน" },
        { status: 400 }
      );
    }

    const canPay =
      (status === "pending_payment" && payment_status === "pending") ||
      ((status === "paymented" || status === "success") && payment_status === "rejected");

    if (!canPay) {
      await client.query("ROLLBACK");
      if (newSlipPath) await safeDeletePublicFile(newSlipPath);
      return NextResponse.json(
        { message: "ไม่สามารถจ่ายเงินได้ตอนนี้" },
        { status: 400 }
      );
    }

    if (typeof payment_slip === "string" && payment_slip) {
      oldSlipToDelete = payment_slip;
    }

    // 🔥 UPDATE + เอา driver_id มาพร้อมกัน
    const result = await client.query(
      `UPDATE bookings
       SET status = 'paymented',
           payment_status = 'waiting_verify',
           payment_slip = $1,
           payment_at = NOW(),
           payment_method = 'transfer'
       WHERE booking_id = $2
         AND user_id = $3
         AND payment_status IN ('pending', 'rejected')
       RETURNING booking_id, driver_id`,
      [slip_url, booking_id, user_id]
    );

    if (result.rowCount === 0) {
      await client.query("ROLLBACK");
      if (newSlipPath) await safeDeletePublicFile(newSlipPath);
      return NextResponse.json(
        { message: "รายการนี้ถูกชำระไปแล้ว" },
        { status: 400 }
      );
    }

    await client.query(
      `INSERT INTO logs
       (booking_id, event_type, event_action, message, actor_id, actor_type)
       VALUES ($1, 'PAYMENT', 'SUBMIT_SLIP', 'ผู้ป่วยโอนเงินและแนบสลิป', $2, 'user')`,
      [booking_id, user_id]
    );

    await client.query("COMMIT");

    if (oldSlipToDelete && oldSlipToDelete !== slip_url) {
      await safeDeletePublicFile(oldSlipToDelete);
    }

    /* ---------------- 🔔 REALTIME (หลัง commit เท่านั้น) ---------------- */
    const driver_id = result.rows[0]?.driver_id ?? driverId;

    const payload = {
      booking_id,
      status: "paymented",
      payment_status: "waiting_verify",
      type: "USER_SUBMIT_SLIP",
    };

    if (driver_id) {
      await pusher.trigger(
        `private-driver-${driver_id}`,
        "booking-updated",
        payload
      );
    }

    await pusher.trigger("private-admin", "booking-updated", {
      ...payload,
      user_id,
    });

    return NextResponse.json(
      { message: "ส่งหลักฐานการชำระเงินเรียบร้อยแล้ว" },
      { status: 200 }
    );
  } catch (err) {
    try {
      await client.query("ROLLBACK");
    } catch {
      // ignore
    }
    if (newSlipPath) await safeDeletePublicFile(newSlipPath);
    console.error(err);
    return NextResponse.json(
      { message: "เกิดข้อผิดพลาดในการชำระเงิน" },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
