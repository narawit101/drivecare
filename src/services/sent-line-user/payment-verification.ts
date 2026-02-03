export const sendPaymentVerificationFlexMessage = async (
  lineUserId: string,
  bookingId: number,
  status: "verified" | "rejected"
) => {
    const flexMessage = {
        type: "flex",
        altText: status === "verified" ? "การชำระเงินผ่านแล้ว" : "การชำระเงินไม่ผ่าน",
        contents: {
            type: "bubble",
            size: "mega",
            body: {
                type: "box",
                layout: "vertical",
                contents: [
                    {
                        type: "text",
                        text: status === "verified" ? "การชำระเงินผ่าน" : "การชำระเงินไม่ผ่าน",
                        weight: "bold",
                        size: "xl",
                        color: status === "verified" ? "#70C5BE" : "#FF6B6B",
                        margin: "md",
                    },
                    {
                        type: "box",
                        layout: "vertical",
                        margin: "lg",
                        spacing: "sm",
                        contents: [
                            {
                                type: "box",
                                layout: "baseline",
                                spacing: "sm",
                                contents: [
                                    {
                                        type: "text",
                                        text: "หมายเลขการจอง",
                                        color: "#888888",
                                        size: "sm",
                                        flex: 3,
                                    },
                                    {
                                        type: "text",
                                        text: `${bookingId}`,
                                        weight: "bold",
                                        size: "sm",
                                        color: "#111111",
                                        flex: 4,
                                    },
                                ],
                            },
                        ],
                    },
                    {
                        type: "box",
                        layout: "vertical",
                        margin: "lg",
                        contents: [
                            
                            {
                                type: "text",
                                text: status === "verified" 
                                    ? "ขอบคุณที่ใช้บริการไดรฟ์แคร์ 🙏\nการเดินทางของคุณเสร็จสมบูรณ์แล้ว"
                                    : `กรุณาไปที่หน้าชำระเงินเพื่ออัปโหลดสลิปใหม่อีกครั้ง\nเลขที่การจอง: ${bookingId}`,
                                size: "sm",
                                color: "#666666",
                                wrap: true,
                            },
                        ],
                    },
                ],
            },
        },
    };

    const res = await fetch("https://api.line.me/v2/bot/message/push", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.NEXT_LINE_ACCESS_TOKEN}`,
        },
        body: JSON.stringify({
            to: lineUserId,
            messages: [flexMessage],
        }),
    });

    const text = await res.text();

    if (!res.ok) {
        console.error("❌ LINE PAYMENT VERIFICATION FLEX PUSH FAILED Status:", res.status);
        console.error("❌ LINE Error Detail:", text);
        throw new Error(`LINE payment verification flex push failed: ${text}`);
    }
    console.log("✅ LINE payment verification flex message sent successfully to:", lineUserId);
};
