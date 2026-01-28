import { NextResponse } from "next/server";

export async function POST() {
    const response = NextResponse.json({ message: "ออกจากระบบสำเร็จ" }, { status: 200 });

    response.cookies.set("admin_token", "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 0,
        path: "/",
    });

    return response;
}

