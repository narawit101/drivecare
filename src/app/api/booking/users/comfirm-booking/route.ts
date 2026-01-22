import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { pusher } from "@/lib/pusher";
import { sendLineMessage } from "@/lib/line";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const user_id = request.headers.get("x-user-id");
    if (!user_id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const {
      booking_date,
      start_time,
      pickup_address,
      pickup_lat,
      pickup_lng,
      dropoff_address,
      dropoff_lat,
      dropoff_lng,
    } = body;

    await pool.query("BEGIN");
    const onlyTime = start_time.includes("T")
      ? start_time.split("T")[1]
      : start_time;

    const fullTimestamp = `${booking_date} ${onlyTime}`;
    const now = new Date();
    const bookingDateTime = new Date(fullTimestamp);
    if (bookingDateTime < now) {
      return NextResponse.json(
        {
          message: "ไม่สามารถที่จะจองย้อนหลังได้ กรุณาตรวจสอบวันที่และเวลาใหม่",
        },
        { status: 400 },
      );
    }

    const bookingResult = await pool.query(
      `INSERT INTO bookings (
        user_id, booking_date, start_time, status
      ) VALUES ($1,$2,$3,'pending')
      RETURNING booking_id`,
      [user_id, booking_date, fullTimestamp],
    );

    const booking_id = bookingResult.rows[0].booking_id;

    await pool.query(
      `INSERT INTO locations (
        booking_id, pickup_address, pickup_lat, pickup_lng,
        dropoff_address, dropoff_lat, dropoff_lng
      ) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [
        booking_id,
        pickup_address,
        pickup_lat,
        pickup_lng,
        dropoff_address,
        dropoff_lat,
        dropoff_lng,
      ],
    );

    await pool.query(
      `INSERT INTO logs (
        booking_id, event_type, event_action, message, actor_id, actor_type
      ) VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        booking_id,
        "CREATE",
        "Booking_Create",
        "สร้างรายการจองใหม่",
        user_id,
        "user",
      ],
    );

    await pool.query("COMMIT");

    // 4️⃣ ดึง booking เต็ม (ไว้ส่ง realtime)
    const bookingData = await pool.query(
      `
      SELECT
        b.booking_id,
        b.booking_date,
        b.start_time,
        b.status,
        b.create_at,

        u.first_name,
        u.last_name,
        u.phone_number,
        u.profile_img,

        l.pickup_address,
        l.pickup_lat,
        l.pickup_lng,
        l.dropoff_address,
        l.dropoff_lat,
        l.dropoff_lng
      FROM bookings b
      JOIN users u ON b.user_id = u.user_id
      JOIN locations l ON b.booking_id = l.booking_id
      WHERE b.booking_id = $1
      `,
      [booking_id],
    );

    await pusher.trigger("private-driver", "booking.created", {
      booking: bookingData.rows[0],
    });

    await pusher.trigger("private-admin", "booking.created", {
      booking_id: booking_id,
      booking: bookingData.rows[0],
      type: "USER_CREATE",
    });

    // หลัง commit ค่อยไปดึง line driver
    let userLineId = null;
    if (user_id) {
      const userRes = await pool.query(
        `SELECT line_id FROM users WHERE user_id = $1`,
        [user_id],
      );
      userLineId = userRes.rows[0]?.line_id;
    }

    // 5. แจ้ง LINE หา driver (ถ้ามี)
    if (user_id && userLineId) {
      const msg =
        `✅ การจองของคุณสำเร็จแล้ว\n\n` + `เลขที่การจอง: ${booking_id}\n`;
      try {
        await sendLineMessage(userLineId, msg);
      } catch (err) {
        console.error("LINE SEND ERROR:", err);
      }
    }

    return NextResponse.json(
      { message: "จองสำเร็จ", booking_id },
      { status: 201 },
    );
  } catch (error) {
    console.log(error);
    return NextResponse.json({ message: error }, { status: 500 });
  }
}
