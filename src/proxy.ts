import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import jwt from "jsonwebtoken";

export default function proxy(req: NextRequest) {
  let token = req.headers.get("authorization")?.replace("Bearer ", "");

  if (!token) {
    token = req.cookies.get("admin_token")?.value;
  }

  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

    const requestHeaders = new Headers(req.headers);

    if (decoded.user_id) {
      requestHeaders.set("x-user-id", decoded.user_id.toString());
      requestHeaders.set("x-role", decoded.role ?? "user");
    }

    if (decoded.driver_id) {
      requestHeaders.set("x-driver-id", decoded.driver_id.toString());
      requestHeaders.set("x-role", decoded.role ?? "driver");
    }

    if (decoded.admin_id) {
      requestHeaders.set("x-admin-id", decoded.admin_id.toString());
      requestHeaders.set("x-role", "admin");
    }

    return NextResponse.next({
      request: {
        headers: requestHeaders, // ✅ ตรงนี้แหละของจริง
      },
    });
  } catch {
    return NextResponse.json({ message: "Token ไม่ถูกต้อง" }, { status: 403 });
  }
}


export const config = {
  matcher: [
    "/api((?!/auth|/pusher/auth|/line/webhook).*)"
  ],
};

