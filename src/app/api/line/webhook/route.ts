// app/api/line/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const text = await req.text();
    if (!text) return NextResponse.json({ ok: true });

    const body = JSON.parse(text);
    console.log("LINE webhook event:", body);

    for (const event of body.events ?? []) {
      // ✅ เช็ค type ก่อน
      if (event.type === "message" && event.message?.type === "text") {
        const userId = event.source?.userId;
        const message = event.message.text;

        console.log("Message from:", userId, message);
      }

      if (event.type === "follow") {
        console.log("User followed:", event.source?.userId);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("LINE webhook error:", err);

    // ⚠️ สำคัญมาก: ห้าม return 500
    return NextResponse.json({ ok: true });
  }
}
