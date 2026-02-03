export const sendPaymentPendingFlexMessage = async (
  lineUserId: string,
  bookingId: number,
  totalHours: number,
  totalPrice: number,
  endTime: string
) => {
    const flexMessage = {
        type: "flex",
        altText: "การเดินทางสำเร็จ - รอชำระเงิน",
        contents: {
            type: "bubble",
            size: "mega",
            body: {
                type: "box",
                layout: "vertical",
                contents: [
                    {
                        type: "text",
                        text: "กรุณาชำระเงิน!",
                        weight: "bold",
                        size: "xl",
                        color: "#70C5BE",
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
                            {
                                type: "box",
                                layout: "baseline",
                                spacing: "sm",
                                contents: [
                                    {
                                        type: "text",
                                        text: "ระยะเวลา",
                                        color: "#888888",
                                        size: "sm",
                                        flex: 3,
                                    },
                                    {
                                        type: "text",
                                        text: `${totalHours.toFixed(2)} ชั่วโมง`,
                                        weight: "bold",
                                        size: "sm",
                                        color: "#111111",
                                        flex: 4,
                                    },
                                ],
                            },
                            {
                                type: "box",
                                layout: "baseline",
                                spacing: "sm",
                                contents: [
                                    {
                                        type: "text",
                                        text: "ค่าบริการ",
                                        color: "#888888",
                                        size: "sm",
                                        flex: 3,
                                    },
                                    {
                                        type: "text",
                                        text: `${totalPrice.toLocaleString()} บาท`,
                                        weight: "bold",
                                        size: "sm",
                                        color: "#FF6B6B",
                                        flex: 4,
                                    },
                                ],
                            },
                            {
                                type: "box",
                                layout: "baseline",
                                spacing: "sm",
                                contents: [
                                    {
                                        type: "text",
                                        text: "เวลาสิ้นสุด",
                                        color: "#888888",
                                        size: "sm",
                                        flex: 3,
                                    },
                                    {
                                        type: "text",
                                        text: endTime,
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
                                text: "ข้อมูลการชำระเงิน",
                                weight: "bold",
                                size: "sm",
                                color: "#70C5BE",
                                margin: "md",
                            },
                            {
                                type: "text",
                                text: "กรุณาชำระเงินและแนบสลิปผ่านแอปพลิเคชันของเราเพื่อยืนยันการชำระเงิน\nขอบคุณที่ใช้บริการ 🙏",
                                size: "sm",
                                color: "#666666",
                                wrap: true,
                            },
                        ],
                    },
                ],
            },
            footer: {
                type: "box",
                layout: "vertical",
                spacing: "sm",
                contents: [
                    {
                        type: "button",
                        style: "primary",
                        height: "sm",
                        action: {
                            type: "uri",
                            label: "ชำระเงิน",
                            uri: "https://drive-care-gilt.vercel.app/user-payment",
                        },
                        color: "#70C5BE",
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
        console.error("❌ LINE PAYMENT PENDING FLEX PUSH FAILED Status:", res.status);
        console.error("❌ LINE Error Detail:", text);
        throw new Error(`LINE payment pending flex push failed: ${text}`);
    }
    console.log("✅ LINE payment pending flex message sent successfully to:", lineUserId);
};
